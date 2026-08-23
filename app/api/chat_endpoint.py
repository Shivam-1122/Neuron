
from fastapi import APIRouter, Body
from app.services.conversation_service import conversation_service
from app.services.semantic_memory import semantic_memory
from app.services.memory_service import memory_service
from app.services.llm_service import llm_service

router = APIRouter()

@router.post("/chat/query")
async def chat_query(text: str = Body(..., embed=True)):
    """
    Process a text query or statement.
    Supports:
    1. Real-time Memory Intake & Position Updates ("I switched the position of pen to drawer")
    2. Semantic Vector Search + Recency-Prioritized Context retrieval
    3. Server-Side Context Tracking
    """
    text = text.strip()
    lower_text = text.lower()
    
    # 0. CHECK IF USER IS PROVIDING AN UPDATE / STATEMENT (e.g. "I switched the position of pen to backpack")
    statement_analysis = llm_service.analyze_statement_intent(text)
    if statement_analysis.get("is_update"):
        entity = statement_analysis.get("entity")
        location = statement_analysis.get("location")
        fact = statement_analysis.get("fact") or text
        confirmation = statement_analysis.get("confirmation") or f"Got it! I will remember that: {fact}"
        
        # Store in Semantic Memory
        semantic_memory.learn_fact(
            fact_text=fact,
            entity_name=entity,
            fact_type="user_update" if location else "user_statement",
            metadata={"location": location, "raw_text": text}
        )
        
        # If an object entity or location is mentioned, update the objects collection
        if entity and location:
            memory_service.update_or_create_object_location(
                object_name=entity,
                new_location=location,
                notes=f"User updated location to {location}: {text}"
            )
        elif location and not entity:
            # Try to extract entity from text or context
            context = conversation_service.get_context()
            ctx_name = context.get("name") if context else None
            if ctx_name:
                memory_service.update_or_create_object_location(
                    object_name=ctx_name,
                    new_location=location,
                    notes=f"Updated to {location}: {text}"
                )
        
        # Update current conversation context
        conversation_service.update_context({
            "name": entity or "memory_update",
            "type": "object" if location else "statement",
            "location": location,
            "notes": fact
        })
        
        return {
            "status": "found",
            "text": confirmation,
            "entity_type": "object" if location else "statement",
            "person": {"name": entity or "Memory", "type": "object" if location else "statement", "location": location, "notes": fact},
            "audio_base64": None,
            "image_base64": None,
            "gallery": []
        }

    # 1. Retrieve Context
    context = conversation_service.get_context()
    context_name = context.get("name") if context else None
    
    # 2. Check for Follow-up ("he", "she", "where", "look")
    pronouns = ["he", "she", "him", "her", "it", "his", "her", "live", "do", "does", "about", "look", "features"]
    is_followup = any(p in lower_text.split() for p in pronouns)
    
    matches = []
    
    # SAFETY: If user says "He" but we don't know who "He" is (Context is None)
    if is_followup and not context_name and "who is" not in lower_text:
         return {
             "status": "unknown",
             "text": "I'm not sure who you are referring to. Who are we talking about?"
         }
    
    # 3. Direct Entity Search (Person/Object Name)
    entity_matches = memory_service.search_by_text(text)
    
    # Also fetch semantic memories for richer facts
    semantic_matches = semantic_memory.search_knowledge(text, context_name=context_name, limit=4)
    
    if entity_matches:
        # High confidence match on entity
        payload = entity_matches[0].payload
        name = payload.get("name")
        matches = [{"name": name, "score": 1.0, "payload": payload}]
    elif context_name and is_followup and "who is" not in lower_text:
        # Contextual Search: Filter by current person/object
        matches = semantic_matches
    else:
        # Global Semantic Search
        matches = semantic_matches
    
    if matches:
        best_match = matches[0]
        name = best_match.get("name")
        
        full_person = None
        audio_base64 = None
        image_base64 = None
        original_matches = []
        
        if name and name != "general":
            original_matches = memory_service.search_by_text(name)
            if original_matches:
                full_person = original_matches[0].payload
                for m in original_matches:
                    if not audio_base64 and m.payload.get("audio_base64"):
                        audio_base64 = m.payload.get("audio_base64")
                    if not image_base64 and m.payload.get("image_base64"):
                        image_base64 = m.payload.get("image_base64")
            else:
                full_person = matches[0].get("payload")
            
            if full_person:
                if not audio_base64: audio_base64 = full_person.get("audio_base64")
                if not image_base64: image_base64 = full_person.get("image_base64")

        # Update Context
        if full_person:
            conversation_service.update_context(full_person)
        else:
            conversation_service.update_context(best_match)
        
        # Prepare context for LLM
        llm_context = full_person if full_person else best_match
        if llm_context:
            llm_context["has_audio"] = bool(audio_base64)
            llm_context["has_image"] = bool(image_base64)

        # Generate Response via LLM with prioritized recent timeline
        final_text = llm_service.generate_response(user_text=text, context=llm_context, additional_memories=semantic_matches)

        # Build Gallery
        gallery = []
        if original_matches:
             seen_imgs = set()
             for m in original_matches:
                 img = m.payload.get("image_base64")
                 if img and len(img) > 100 and img not in seen_imgs:
                     gallery.append(img)
                     seen_imgs.add(img)
             gallery = gallery[:6]

        # Intent Filtering for Audio
        voice_keywords = ["voice", "talk", "speak", "sound", "listen", "hear"]
        voice_intent = any(k in text.lower() for k in voice_keywords)
        final_audio = audio_base64 if voice_intent else None

        gallery_keywords = ["memories", "photos", "pictures", "images", "gallery", "album"]
        gallery_intent = any(k in text.lower() for k in gallery_keywords)
        final_gallery = gallery if gallery_intent else []

        matched_entity = full_person if full_person else best_match
        if matched_entity and audio_base64 and isinstance(matched_entity, dict):
            matched_entity["audio"] = audio_base64
            matched_entity["audio_base64"] = audio_base64

        entity_type = "object" if (matched_entity and (matched_entity.get("type") == "object" or "location" in matched_entity or "object_name" in matched_entity)) else "person"

        # Attach image if this query is about a specific recognized person/object in memory
        final_image = image_base64 if (image_base64 and matched_entity and matched_entity.get("name") and matched_entity.get("name") != "general") else None

        response_data = {
            "status": "found",
            "text": final_text,
            "entity_type": entity_type,
            "person": matched_entity,
            "audio_base64": final_audio or audio_base64,
            "image_base64": final_image,
            "gallery": final_gallery
        }
        return response_data

    return {
        "status": "unknown",
        "text": "I couldn't find anything relevant in my memory."
    }
