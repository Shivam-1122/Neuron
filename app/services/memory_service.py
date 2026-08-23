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

    def search_by_text(self, text_query: str):
        import difflib
        try:
            points = []
            for col in ["faces", "objects", "patients"]:
                try:
                    res = self.client.scroll(collection_name=col, limit=500, with_payload=True, with_vectors=False)
                    points.extend(res[0])
                except Exception: pass
            
            query = text_query.lower()
            candidates = []
            max_score = 0.0
            
            for p in points:
                if not p.payload: continue
                name = (p.payload.get("name") or "").lower()
                relation = (p.payload.get("relation") or "").lower()
                notes = (p.payload.get("notes") or "").lower()
                location = (p.payload.get("location") or "").lower()
                
                score = 0
                if name and name in query: score += 1.0
                if relation and relation in query: score += 0.8
                if notes and query in notes: score += 0.5
                if location and location in query: score += 0.5
                
                query_words = query.split()
                for word in query_words:
                    if len(word) > 2:
                        matcher = difflib.SequenceMatcher(None, word, name)
                        if matcher.ratio() > 0.7: score += 0.8
                            
                full_sim = difflib.SequenceMatcher(None, query, name).ratio()
                if full_sim > 0.6: score += 1.0

                if score > max_score:
                    max_score = score
                    candidates = [p]
                elif score == max_score and score > 0.4:
                    candidates.append(p)
            
            if max_score > 0.4:
                # Sort candidates with newest timestamp first so latest updates are prioritized!
                candidates.sort(key=lambda x: x.payload.get("timestamp", ""), reverse=True)
                return candidates[:5]
            return []

        except Exception as e:
            print(f"Fuzzy search error: {e}")
            return []

memory_service = MemoryService()
