from fastapi import APIRouter, Body
from pydantic import BaseModel
from typing import Optional
import re
from app.services.conversation_service import conversation_service
from app.services.semantic_memory import semantic_memory
from app.services.memory_service import memory_service
from app.services.llm_service import llm_service

router = APIRouter()

class SetProviderRequest(BaseModel):
    provider: str

class ChatQueryRequest(BaseModel):
    text: str
    provider: Optional[str] = None
    user_id: Optional[str] = None

@router.get("/llm/provider")
async def get_llm_provider():
    """Retrieve the current active LLM engine and all available providers."""
    return llm_service.get_provider_info()

@router.post("/llm/provider")
async def set_llm_provider(req: SetProviderRequest):
    """Switch active LLM engine between 'groq' (Primary) and 'gemini'."""
    new_provider = llm_service.set_provider(req.provider)
    return {
        "status": "success",
        "active_provider": new_provider,
        "message": f"LLM Cortex switched to {new_provider.upper()}"
    }

@router.post("/chat/query")
async def chat_query(req: ChatQueryRequest):
    """
    Process a text query or statement.
    Supports:
    1. Real-time Memory Intake & Position Updates ("I switched the position of pen to drawer")
    2. Semantic Vector Search + Recency-Prioritized Context retrieval
    3. Multimodal LLM Engine Toggle (Groq / Gemini)
    4. Server-Side Context Tracking
    """
    text = (req.text or "").strip()
    provider = req.provider or llm_service.active_provider
    lower_text = text.lower()
    
    # 0. CHECK IF USER IS SCHEDULING A TASK OR GENTLE ANCHOR
    statement_analysis = llm_service.analyze_statement_intent(text, provider=provider)
    if statement_analysis.get("is_task"):
        from app.services.task_service import task_service
        task_title = statement_analysis.get("task_title") or text[:40]
        task_time = statement_analysis.get("task_time") or "Today"
        task_notes = statement_analysis.get("task_notes") or text
        confirmation = statement_analysis.get("confirmation") or f"I've added '{task_title}' to Today's Gentle Anchors ({task_time})."
        
        # Add to gentle anchors task store
        added_task = task_service.add_task(
            title=task_title,
            time=task_time,
            notes=task_notes,
            user_id=req.user_id or "default_user"
        )
        
        # Also store in semantic memory so the cortex remembers the schedule
        try:
            semantic_memory.learn_fact(
                fact_text=f"Scheduled task: {task_title} at {task_time}. {task_notes}",
                entity_name="Gentle Anchors",
                fact_type="scheduled_task",
                metadata={"task_id": added_task["id"], "time": task_time}
            )
        except Exception as e:
            print(f"Task semantic memory note: {e}")
            
        return {
            "status": "found",
            "text": confirmation,
            "llm_provider": provider,
            "entity_type": "task",
            "task_added": added_task,
            "person": {"name": "Gentle Anchors", "type": "task", "location": task_time, "notes": task_title},
            "audio_base64": None,
            "image_base64": None,
            "gallery": []
        }

    # 1. CHECK IF USER IS PROVIDING AN OBJECT / POSITION UPDATE (e.g. "I switched the position of pen to backpack")
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
            "llm_provider": provider,
            "entity_type": "object" if location else "statement",
            "person": {"name": entity or "Memory", "type": "object" if location else "statement", "location": location, "notes": fact},
            "audio_base64": None,
            "image_base64": None,
            "gallery": []
        }

    # Helper to extract queried subject (person or object name)
    def extract_query_subject(t: str) -> str:
        c = (t or "").strip(" ?.,!").lower()
        for prefix in [
            "who is my", "who are my", "who is", "who's", "who are",
            "where is my", "where are my", "where is the", "where are the", "where is", "where's", "where are",
            "have you seen my", "have you seen", "find my", "find", "locate my", "locate",
            "is there someone named", "is there anyone named", "do you know who", "do you know",
            "tell me about", "is he", "is she", "call", "contact"
        ]:
            if c.startswith(prefix + " "):
                sub = c[len(prefix):].strip(" ?.,!")
                for suffix in ["here", "right now", "today", "around", "nearby", "at home"]:
                    if sub.endswith(" " + suffix):
                        sub = sub[:-len(suffix)-1].strip()
                if sub:
                    return sub.title()
        return ""

    def is_person_lookup(t: str) -> bool:
        low = t.lower()
        person_terms = [
            "who is", "who are", "who's", "whose", "do you know", "have you seen",
            "is he", "is she", "call ", "contact ", "someone", "anybody", "person",
            "doctor", "nurse", "caregiver", "physician", "mom", "dad", "mother",
            "father", "son", "daughter", "brother", "sister", "wife", "husband",
            "friend", "helper", "colleague", "uncle", "aunt", "grandma", "grandpa"
        ]
        if any(term in low for term in person_terms):
            return True
        if low.startswith("who ") or low.startswith("who's "):
            return True
        return False

    def is_object_lookup(t: str) -> bool:
        low = t.lower()
        object_terms = [
            "where is my", "where are my", "where is the", "where are the",
            "find my", "locate my", "lost my", "seen my", "placed my", "put my"
        ]
        return any(term in low for term in object_terms)

    # 1. Retrieve Context
    context = conversation_service.get_context()
    context_name = context.get("name") if context else None
    
    # Check if query is an anaphoric / pronoun follow-up referring to active context
    pure_pronouns = {"he", "she", "him", "her", "they", "them", "it", "his", "hers", "their"}
    query_words = set(lower_text.split())
    is_pronoun_query = bool(query_words.intersection(pure_pronouns))
    
    # Only use context_name for vector search if user is asking a pronoun follow-up
    active_context_name = context_name if is_pronoun_query else None
    
    # 2. Direct Entity Search (Searches Loved Ones, Caregivers, Faces, Objects)
    entity_matches = memory_service.search_by_text(text, user_id=req.user_id)
    
    # 3. Semantic vector search (requires min score)
    semantic_matches = semantic_memory.search_knowledge(text, context_name=active_context_name, limit=4, min_score=0.48)
    
    # Filter semantic matches to ensure relevance to query tokens
    filtered_semantic_matches = []
    tokens = [re.sub(r'[^\w\s]', '', w) for w in lower_text.split()]
    meaningful_tokens = [w for w in tokens if len(w) > 2 and w not in [
        "who", "what", "where", "how", "the", "about", "tell", "you", "know", "seen",
        "have", "here", "there", "show", "with", "this", "that"
    ]]
    for sm in semantic_matches:
        sm_name = (sm.get("name") or "").lower()
        sm_text = (sm.get("text") or "").lower()
        if is_pronoun_query and active_context_name and sm_name == active_context_name.lower():
            filtered_semantic_matches.append(sm)
        elif meaningful_tokens and (any(tok in sm_name for tok in meaningful_tokens) or any(tok in sm_text for tok in meaningful_tokens)):
            filtered_semantic_matches.append(sm)

    matches = []
    if entity_matches:
        payload = entity_matches[0].payload
        name = payload.get("name")
        matches = [{"name": name, "score": 1.0, "payload": payload}]
    elif filtered_semantic_matches:
        matches = filtered_semantic_matches
    elif is_pronoun_query and context_name:
        # User is asking a pronoun follow-up referring to the active context
        matches = [{"name": context_name, "score": 0.8, "payload": context}]

    # 4. Handle Case When No Matching Entity Is Found
    if not matches:
        target_subject = extract_query_subject(text)
        is_person = is_person_lookup(text) or (bool(target_subject) and not is_object_lookup(text))
        is_obj = is_object_lookup(text)

        if is_person:
            subject_name = target_subject if target_subject else "that person"
            return {
                "status": "not_found",
                "no_data_found": True,
                "text": f"I don't have any record of {subject_name} in your memory cortex yet. Would you like to notify your caregivers via email so they can assist you?",
                "llm_provider": provider,
                "entity_type": "person",
                "person": None,
                "audio_base64": None,
                "image_base64": None,
                "gallery": [],
                "query_subject": subject_name
            }
        elif is_obj:
            subject_name = target_subject if target_subject else "that item"
            return {
                "status": "not_found",
                "no_data_found": True,
                "text": f"I couldn't locate your {subject_name} in your recorded memory locations. Would you like to notify your caregivers via email so they can help you locate it?",
                "llm_provider": provider,
                "entity_type": "object",
                "person": None,
                "audio_base64": None,
                "image_base64": None,
                "gallery": [],
                "query_subject": subject_name
            }
        else:
            return {
                "status": "not_found",
                "no_data_found": True,
                "text": "I couldn't find anything relevant in your recorded memories. Would you like to notify your caregivers via email so they can assist you?",
                "llm_provider": provider,
                "entity_type": "unknown",
                "person": None,
                "audio_base64": None,
                "image_base64": None,
                "gallery": []
            }
    
    if matches:
        best_match = matches[0]
        name = best_match.get("name")
        
        full_entity = None
        audio_base64 = None
        image_base64 = None
        original_matches = []
        
        if name and name != "general":
            original_matches = memory_service.search_by_text(name, user_id=req.user_id)
            if original_matches:
                full_entity = original_matches[0].payload
                for m in original_matches:
                    p_name = (m.payload.get("name") or "").lower()
                    if p_name == name.lower():
                        if not audio_base64 and m.payload.get("audio_base64"):
                            audio_base64 = m.payload.get("audio_base64")
                        if not image_base64 and m.payload.get("image_base64"):
                            image_base64 = m.payload.get("image_base64")
            else:
                full_entity = matches[0].get("payload") if (isinstance(matches[0], dict) and "payload" in matches[0]) else matches[0]
            
            if full_entity:
                p_name = (full_entity.get("name") or "").lower()
                if p_name == name.lower():
                    if not audio_base64: audio_base64 = full_entity.get("audio_base64")
                    if not image_base64: image_base64 = full_entity.get("image_base64")

        matched_entity = full_entity if full_entity else best_match
        is_obj = bool(
            matched_entity and (
                matched_entity.get("type") == "object" or 
                "object_id" in matched_entity or 
                ("location" in matched_entity and not matched_entity.get("relation"))
            )
        )
        entity_type = "object" if is_obj else "person"
        
        # Prepare context for LLM
        llm_context = matched_entity if matched_entity else best_match
        if llm_context:
            llm_context["has_audio"] = bool(audio_base64)
            llm_context["has_image"] = bool(image_base64)

        # Generate Response via LLM with prioritized recent timeline
        final_text, provider_used = llm_service.generate_response(
            user_text=text,
            context=llm_context,
            additional_memories=filtered_semantic_matches,
            provider=provider
        )

        # Check if the LLM output explicitly states absence or inability to find
        negative_markers = [
            "don't know", "not sure", "haven't learned", "no record", "not in my memory",
            "not in your memory", "not in your memories", "could not find", "couldn't find",
            "trouble searching", "not registered", "haven't met", "don't have any record",
            "cannot find", "can't find", "couldn't locate", "who that is"
        ]
        is_negative_response = any(m in final_text.lower() for m in negative_markers)

        if is_negative_response:
            return {
                "status": "not_found",
                "no_data_found": True,
                "text": final_text + " Would you like to notify your caregivers via email so they can assist you?",
                "llm_provider": provider_used,
                "entity_type": entity_type,
                "person": None,
                "audio_base64": None,
                "image_base64": None,
                "gallery": []
            }

        # Only update context when entity was legitimately verified and found!
        if matched_entity:
            conversation_service.update_context(matched_entity)

        # Build Gallery
        gallery = []
        if original_matches:
            seen_imgs = set()
            for m in original_matches:
                p_name = (m.payload.get("name") or "").lower()
                if p_name == (name or "").lower():
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

        if matched_entity and audio_base64 and isinstance(matched_entity, dict):
            matched_entity["audio"] = audio_base64
            matched_entity["audio_base64"] = audio_base64

        # SAFEGUARD: Never attach a person's photo to an object or an unrelated entity!
        final_image = None
        if image_base64 and matched_entity and matched_entity.get("name") and matched_entity.get("name") != "general":
            if entity_type == "object":
                # For objects, only attach if the object itself has an image
                if matched_entity.get("type") == "object" and matched_entity.get("image_base64"):
                    final_image = matched_entity.get("image_base64")
            else:
                final_image = image_base64

        if final_image and isinstance(final_image, str) and not final_image.startswith("data:") and not final_image.startswith("http"):
            final_image = f"data:image/jpeg;base64,{final_image}"

        response_data = {
            "status": "found",
            "no_data_found": False,
            "text": final_text,
            "llm_provider": provider_used,
            "entity_type": entity_type,
            "person": matched_entity,
            "audio_base64": final_audio or audio_base64,
            "image_base64": final_image,
            "gallery": final_gallery
        }
        return response_data

    return {
        "status": "not_found",
        "no_data_found": True,
        "text": "I couldn't find anything relevant in your recorded memories. Would you like to notify your caregivers via email so they can assist you?",
        "llm_provider": provider,
        "entity_type": "unknown",
        "person": None,
        "audio_base64": None,
        "image_base64": None,
        "gallery": []
    }
