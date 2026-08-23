
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, MatchValue
from app.core.config import settings
from app.services.memory_service import memory_service
import uuid
import hashlib
import numpy as np

class FallbackTextEncoder:
    def encode(self, text: str):
        # 384-dimensional normalized word-hash embedding
        words = text.lower().split()
        vec = np.zeros(384, dtype=np.float32)
        for i, w in enumerate(words):
            h = int(hashlib.sha256(w.encode('utf-8')).hexdigest(), 16)
            idx = h % 384
            vec[idx] += 1.0 / (1.0 + 0.1 * i)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

class SemanticMemoryService:
    def __init__(self, client=None):
        self._encoder = None
        self.client = client or memory_service.client
        self.collection_name = "text_knowledge"
        self._ensure_collection()

    @property
    def encoder(self):
        if self._encoder is None:
            try:
                print("DEBUG: Loading Sentence Transformer...", flush=True)
                from sentence_transformers import SentenceTransformer
                self._encoder = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"⚠️ SentenceTransformer unavailable ({e}), using FallbackTextEncoder", flush=True)
                self._encoder = FallbackTextEncoder()
        return self._encoder

    def _ensure_collection(self):
        try:
            self.client.get_collection(self.collection_name)
        except Exception:
            # all-MiniLM-L6-v2 outputs 384 dimensions
            self.client.recreate_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
        
        # Ensure Payload Index for filtering by name
        try:
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="name",
                field_schema="keyword"
            )
        except Exception as e:
            # Index might already exist
            print(f"Index creation note: {e}")

    def learn_fact(self, fact_text: str, entity_name: str = None, fact_type: str = "user_statement", metadata: dict = None):
        """
        Stores any general statement or update in semantic memory with a timestamp.
        """
        from datetime import datetime
        now_iso = datetime.now().isoformat()
        now_formatted = datetime.now().strftime("%b %d, %I:%M %p")
        
        embedding = self.encoder.encode(fact_text).tolist()
        point_id = str(uuid.uuid4())
        
        payload = {
            "text": fact_text,
            "name": entity_name or "general",
            "type": fact_type,
            "timestamp": now_iso,
            "updated_at": now_formatted
        }
        if metadata:
            payload.update(metadata)
            
        self.client.upsert(
            collection_name=self.collection_name,
            points=[PointStruct(
                id=point_id,
                vector=embedding,
                payload=payload
            )],
            wait=True
        )
        print(f"Stored semantic fact with timestamp ({now_formatted}): {fact_text}")
        return point_id

    def learn_person(self, person_data: dict):
        """
        Converts person data into semantic text memories.
        """
        from datetime import datetime
        now_iso = datetime.now().isoformat()
        now_formatted = datetime.now().strftime("%b %d, %I:%M %p")
        
        name = person_data.get("name")
        relation = person_data.get("relation")
        notes = person_data.get("notes", "")
        location = person_data.get("location", "")
        
        # Create meaningful sentences
        texts = []
        if relation:
            texts.append(f"{name} is my {relation}.")
        if location:
            texts.append(f"{name} is located at {location}.")
        if notes:
            texts.append(f"Notes about {name}: {notes}")
        
        points = []
        for txt in texts:
            if not txt.strip(): continue
            embedding = self.encoder.encode(txt).tolist()
            
            points.append(PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "text": txt,
                    "name": name,
                    "relation": relation,
                    "type": "person_bio" if relation else "object_fact",
                    "timestamp": now_iso,
                    "updated_at": now_formatted
                }
            ))
            
        if points:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            print(f"Learned {len(points)} semantic facts about {name}")

    def search_knowledge(self, query: str, context_name: str = None, limit=5):
        """
        Hybrid Search:
        1. Semantic Vector Search
        2. Optional Metadata Filter (if context_name provided)
        3. Prioritize newest memories when matches exist
        """
        embedding = self.encoder.encode(query).tolist()
        print(f"DEBUG: Executing query_points for '{query}'...")
        
        query_filter = None
        if context_name:
            # Narrow down to specific person if context is active
            query_filter = Filter(
                must=[
                    FieldCondition(key="name", match=MatchValue(value=context_name))
                ]
            )
            
        res = self.client.query_points(
            collection_name=self.collection_name,
            query=embedding,
            query_filter=query_filter,
            limit=limit
        )
        
        # Sort results prioritizing the most recent updates
        matches = [match.payload for match in res.points]
        matches.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return matches

# Global Instance
semantic_memory = SemanticMemoryService()
