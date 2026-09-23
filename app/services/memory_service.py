from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, MatchValue, MatchText
from app.core.config import settings
import uuid

class MemoryService:
    def __init__(self):
        print("DEBUG: Initializing MemoryService (Qdrant)...", flush=True)
        if settings.QDRANT_MODE == "local":
            self.client = QdrantClient(path=settings.QDRANT_PATH)
        else:
            self.client = QdrantClient(
                url=settings.get_qdrant_url(),
                api_key=settings.QDRANT_API_KEY,
                check_compatibility=False
            )
            
        self._ensure_collections()

    def _ensure_collections(self):
        # 1. FACES
        try:
            self.client.get_collection("faces")
        except Exception:
            self.client.recreate_collection(
                collection_name="faces",
                vectors_config=VectorParams(size=512, distance=Distance.COSINE)
            )

        # 2. OBJECTS
        try:
             self.client.get_collection("objects")
        except Exception:
             self.client.recreate_collection(
                collection_name="objects",
                vectors_config=VectorParams(size=1280, distance=Distance.COSINE)
             )
             
        # 3. PATIENTS (Caregiver Data)
        try:
            self.client.get_collection("patients")
        except Exception:
            self.client.recreate_collection(
                collection_name="patients",
                vectors_config=VectorParams(size=512, distance=Distance.COSINE) # Same as Faces
            )

        # 4. Ensure payload index on 'name' for keyword filtering
        for col in ["faces", "objects", "patients"]:
            try:
                self.client.create_payload_index(
                    collection_name=col,
                    field_name="name",
                    field_schema="keyword"
                )
            except Exception:
                pass


    def store_face_memory(self, person_id: str, embedding: list, metadata: dict):
        from datetime import datetime
        point_id = str(uuid.uuid4())
        if "timestamp" not in metadata: metadata["timestamp"] = datetime.now().isoformat()
        self.client.upsert(
            collection_name="faces",
            points=[PointStruct(id=point_id, vector=embedding, payload={"person_id": person_id, **metadata})],
            wait=True
        )
        return point_id

    def store_patient_memory(self, person_id: str, embedding: list, metadata: dict):
        """Store Caregiver-entered Patient info"""
        from datetime import datetime
        point_id = str(uuid.uuid4())
        if "timestamp" not in metadata: metadata["timestamp"] = datetime.now().isoformat()
        self.client.upsert(
            collection_name="patients",
            points=[PointStruct(id=point_id, vector=embedding, payload={"person_id": person_id, **metadata})],
            wait=True
        )
        return point_id

    def search_face(self, embedding: list, limit=1):
        # Search BOTH faces and patients collections for recognition
        # Merge results manually
        res1 = self.client.query_points(collection_name="faces", query=embedding, limit=limit).points
        res2 = self.client.query_points(collection_name="patients", query=embedding, limit=limit).points
        
        all_res = res1 + res2
        all_res.sort(key=lambda x: x.score, reverse=True)
        return all_res[:limit]

    def store_object_memory(self, object_id: str, embedding: list, metadata: dict):
        from datetime import datetime
        point_id = str(uuid.uuid4())
        if "timestamp" not in metadata: metadata["timestamp"] = datetime.now().isoformat()
        self.client.upsert(
            collection_name="objects",
            points=[PointStruct(id=point_id, vector=embedding, payload={"object_id": object_id, **metadata})],
            wait=True
        )
        return point_id

    def search_object(self, embedding: list, limit=1):
        response = self.client.query_points(
            collection_name="objects",
            query=embedding,
            limit=limit
        )
        return response.points

    def update_or_create_object_location(self, object_name: str, new_location: str, notes: str = None):
        """
        Updates the location and timestamp of an object, or creates a new entry if none exists.
        Ensures the latest state is stored and retrieved.
        """
        from datetime import datetime
        now_iso = datetime.now().isoformat()
        
        # Look for existing object points matching object_name
        try:
            res = self.client.scroll(
                collection_name="objects",
                limit=100,
                with_payload=True,
                with_vectors=True
            )
            matching_points = [
                p for p in res[0]
                if p.payload and (p.payload.get("name", "").lower() == object_name.lower())
            ]
            
            if matching_points:
                # Update existing points with new location & timestamp
                for p in matching_points:
                    updated_payload = dict(p.payload)
                    updated_payload["location"] = new_location
                    updated_payload["timestamp"] = now_iso
                    if notes:
                        updated_payload["notes"] = notes
                    else:
                        updated_payload["notes"] = f"Location updated to {new_location} at {datetime.now().strftime('%I:%M %p')}."
                    
                    self.client.set_payload(
                        collection_name="objects",
                        payload=updated_payload,
                        points=[p.id],
                        wait=True
                    )
                print(f"Updated {len(matching_points)} object records for '{object_name}' to location: {new_location}")
                return True
            else:
                # Create a new point for this object
                from app.services.object_service import detector as object_service
                dummy_vec = [0.0] * 1280
                point_id = str(uuid.uuid4())
                self.client.upsert(
                    collection_name="objects",
                    points=[PointStruct(
                        id=point_id,
                        vector=dummy_vec,
                        payload={
                            "object_id": point_id,
                            "name": object_name,
                            "type": "object",
                            "location": new_location,
                            "notes": notes or f"Location is {new_location}.",
                            "timestamp": now_iso
                        }
                    )],
                    wait=True
                )
                print(f"Created new object record for '{object_name}' with location: {new_location}")
                return True
        except Exception as e:
            print(f"Error in update_or_create_object_location: {e}")
            return False

    def search_by_text(self, text_query: str, user_id: Optional[str] = None):
        import difflib
        import re
        try:
            points = []
            for col in ["faces", "objects", "patients", "user_profiles"]:
                try:
                    res = self.client.scroll(collection_name=col, limit=500, with_payload=True, with_vectors=False)
                    for pt in res[0]:
                        if pt.payload:
                            pt_user = pt.payload.get("user_id")
                            if user_id and pt_user and pt_user not in [user_id, "default_user"]:
                                continue
                            points.append(pt)
                except Exception: pass
            
            # Also include registered caregivers from caregiver_service
            try:
                from app.services.caregiver_service import caregiver_service
                caregiver_service._reload()
                class DummyPoint:
                    def __init__(self, payload):
                        self.id = payload.get("id") or str(uuid.uuid4())
                        self.payload = payload
                caregivers_list = caregiver_service.get_caregivers(user_id=user_id)
                for cg in caregivers_list:
                    cg_payload = {
                        "name": cg.get("name"),
                        "relation": cg.get("relation") or "Caregiver",
                        "notes": f"{cg.get('name')} is your registered {cg.get('relation', 'Caregiver')}. Email: {cg.get('email', '')}. Phone: {cg.get('phone', '')}",
                        "type": "caregiver",
                        "image_base64": cg.get("image_base64") or "",
                        "user_id": cg.get("user_id") or "default_user",
                        "timestamp": cg.get("created_at") or "",
                        "email": cg.get("email", ""),
                        "phone": cg.get("phone", "")
                    }
                    points.append(DummyPoint(cg_payload))
            except Exception as cg_err:
                print(f"Caregiver search inclusion note: {cg_err}")

            query = text_query.lower()
            query_tokens = [re.sub(r'[^\w\s]', '', w) for w in query.split()]
            candidates = []
            max_score = 0.0

            caregiver_keywords = ["caregiver", "caregivers", "doctor", "physician", "nurse", "taking care", "takes care", "care of me", "helping me", "helper", "my helper"]
            is_caregiver_query = any(k in query for k in caregiver_keywords)

            # Common role and filler words that shouldn't count as an individual's unique name token
            role_and_stop_words = set(caregiver_keywords + ["who", "is", "my", "the", "a", "an", "about", "tell", "me", "show", "what", "where", "how", "name", "of"])
            specific_query_tokens = [w for w in query_tokens if w and w not in role_and_stop_words]
            
            for p in points:
                if not p.payload: continue
                raw_name = p.payload.get("name") or ""
                name = raw_name.lower().replace("(me)", "").strip()
                relation = (p.payload.get("relation") or "").lower().strip()
                notes = (p.payload.get("notes") or "").lower()
                location = (p.payload.get("location") or "").lower()
                p_type = (p.payload.get("type") or "").lower()
                has_image = bool(p.payload.get("image_base64"))
                p_user = p.payload.get("user_id")
                
                score = 0.0

                # Strong caregiver intent boost
                if is_caregiver_query:
                    if p_type == "caregiver" or "caregiver" in relation or "physician" in relation or "doctor" in relation or "nurse" in relation:
                        score += 8.0
                        if has_image:
                            score += 6.0
                        if user_id and p_user == user_id:
                            score += 5.0

                # Name matching: check specific query tokens first
                if name:
                    name_tokens = [re.sub(r'[^\w\s]', '', w) for w in name.split() if w not in role_and_stop_words]
                    if specific_query_tokens and any(nt in specific_query_tokens for nt in name_tokens if nt):
                        score += 8.0
                    elif not is_caregiver_query:
                        all_name_tokens = [re.sub(r'[^\w\s]', '', w) for w in name.split()]
                        if any(nt in query_tokens for nt in all_name_tokens if nt):
                            score += 3.5
                        elif name in query:
                            score += 2.5
                
                # Relation match (e.g. "doctor", "physician", "friend")
                if relation and not is_caregiver_query:
                    if relation in query or any(rt in query_tokens for rt in relation.split()):
                        score += 2.0

                if notes and query in notes: score += 0.5
                if location and location in query: score += 1.0
                if has_image: score += 0.3
                
                # Fuzzy similarity for words > 2 chars on specific query tokens
                tokens_for_fuzzy = specific_query_tokens if is_caregiver_query else query_tokens
                for word in tokens_for_fuzzy:
                    if len(word) > 2 and name:
                        matcher = difflib.SequenceMatcher(None, word, name)
                        if matcher.ratio() > 0.75: score += 1.0
                            
                if name and specific_query_tokens:
                    full_sim = difflib.SequenceMatcher(None, " ".join(specific_query_tokens), name).ratio()
                    if full_sim > 0.6: score += 1.2

                if score > max_score:
                    max_score = score
                    candidates = [p]
                elif score == max_score and score > 0.4:
                    candidates.append(p)
            
            if max_score > 0.4:
                candidates.sort(key=lambda x: (
                    1 if (user_id and x.payload.get("user_id") == user_id) else 0,
                    bool(x.payload.get("image_base64")),
                    x.payload.get("timestamp", "")
                ), reverse=True)
                return candidates[:5]
            return []

        except Exception as e:
            print(f"Fuzzy search error: {e}")
            return []

memory_service = MemoryService()
