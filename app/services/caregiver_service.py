import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "storage"
CAREGIVER_FILE = STORAGE_DIR / "caregivers.json"

class CaregiverService:
    def __init__(self):
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        self.caregivers: List[Dict[str, Any]] = self._load()

    def _load(self) -> List[Dict[str, Any]]:
        if not CAREGIVER_FILE.exists():
            return []
        try:
            with open(CAREGIVER_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading caregivers: {e}")
            return []

    def _save(self):
        try:
            with open(CAREGIVER_FILE, "w", encoding="utf-8") as f:
                json.dump(self.caregivers, f, indent=2)
        except Exception as e:
            print(f"Error saving caregivers: {e}")

    def get_caregivers(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve registered caregivers, optionally scoped to patient user_id."""
        self._reload()
        if not user_id:
            return self.caregivers
        return [
            c for c in self.caregivers 
            if not c.get("user_id") or c.get("user_id") == user_id or c.get("user_id") == "default_user"
        ]

    def add_caregiver(
        self,
        name: str,
        email: str,
        phone: str = "",
        relation: str = "Caregiver",
        password: str = "",
        user_id: Optional[str] = None,
        image_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """Add a new caregiver record."""
        caregiver_id = f"cg_{uuid.uuid4().hex[:8]}"
        new_cg = {
            "id": caregiver_id,
            "name": name.strip(),
            "email": email.strip().lower(),
            "phone": phone.strip(),
            "relation": relation.strip() or "Caregiver",
            "password": password,
            "user_id": user_id or "default_user",
            "image_base64": image_base64 or "",
            "created_at": datetime.now().isoformat()
        }
        self.caregivers.append(new_cg)
        self._save()
        return new_cg

    def delete_caregiver(self, caregiver_id: str, user_id: Optional[str] = None) -> bool:
        """Remove a caregiver record by id, email, name, or composite key."""
        self._reload()
        initial_len = len(self.caregivers)
        cid_str = str(caregiver_id).strip().lower()
        self.caregivers = [
            c for c in self.caregivers
            if not (
                str(c.get("id", "")).strip().lower() == cid_str
                or str(c.get("email", "")).strip().lower() == cid_str
                or cid_str == f"caregiver_{str(c.get('id', '')).strip().lower()}"
                or (c.get("id") and cid_str.endswith(str(c.get("id", "")).strip().lower()))
                or str(c.get("name", "")).strip().lower() == cid_str
                or (user_id and str(c.get("user_id", "")).strip().lower() == cid_str)
            )
        ]
        changed = len(self.caregivers) < initial_len
        if changed:
            self._save()
        return changed

    def update_caregiver_photo(self, caregiver_id: str, image_base64: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Update a caregiver's face photo."""
        self._reload()
        for c in self.caregivers:
            if c["id"] == caregiver_id and (not user_id or not c.get("user_id") or c.get("user_id") == user_id):
                c["image_base64"] = image_base64
                self._save()
                return c
        return None

    def sync_caregivers_to_memory(self):
        """Sync registered caregivers who have photos into Qdrant faces and semantic memory."""
        try:
            from app.services.memory_service import memory_service
            from app.services.semantic_memory import semantic_memory
            from app.services.face_service import face_service
            from PIL import Image
            import base64
            import io
            import numpy as np

            self._reload()
            for cg in self.caregivers:
                img_b64 = cg.get("image_base64")
                name = cg.get("name", "Caregiver")
                relation = cg.get("relation") or "Caregiver"
                email = cg.get("email", "")
                phone = cg.get("phone", "")
                user_id = cg.get("user_id") or "default_user"

                # Always register in semantic memory
                try:
                    semantic_memory.learn_person({
                        "name": name,
                        "relation": relation,
                        "role": "caregiver",
                        "notes": f"{name} is your registered {relation}. Email: {email}. Phone: {phone}.",
                        "image_base64": img_b64 or "",
                        "user_id": user_id
                    })
                    semantic_memory.learn_fact(
                        fact_text=f"The patient's caregiver is {name}, who is their registered {relation}. Contact email: {email}, phone: {phone}.",
                        entity_name="caregiver",
                        fact_type="caregiver_identity",
                        metadata={"name": name, "relation": relation, "email": email, "phone": phone, "user_id": user_id}
                    )
                except Exception as sem_err:
                    print(f"Caregiver semantic sync note for {name}: {sem_err}")

                # If face image is available, ensure face embedding is stored in Qdrant faces collection
                if img_b64 and len(img_b64) > 100:
                    try:
                        clean_b64 = img_b64.split(",")[-1] if "," in img_b64 else img_b64
                        img_bytes = base64.b64decode(clean_b64)
                        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                        vector = face_service.get_embedding(np.array(img))
                        if vector is not None and len(vector) > 0:
                            memory_service.store_face_memory(
                                person_id=f"caregiver_{cg.get('id', name)}",
                                embedding=vector,
                                metadata={
                                    "name": name,
                                    "relation": relation,
                                    "role": "caregiver",
                                    "type": "caregiver",
                                    "email": email,
                                    "phone": phone,
                                    "notes": f"{name} is your registered {relation}. Email: {email}. Phone: {phone}.",
                                    "image_base64": img_b64,
                                    "user_id": user_id,
                                    "timestamp": cg.get("created_at") or ""
                                }
                            )
                    except Exception as face_err:
                        print(f"Caregiver face sync note for {name}: {face_err}")
        except Exception as e:
            print(f"Caregiver sync to memory note: {e}")

    def _reload(self):
        """Reload caregivers from disk (call before auth to pick up newly-added entries)."""
        self.caregivers = self._load()

    def authenticate_caregiver(self, identifier: str, password: str) -> Optional[Dict[str, Any]]:
        """Check if email/phone and password match an enrolled caregiver."""
        # Always reload from disk so newly added caregivers are visible
        self._reload()
        clean_id = identifier.strip().lower()
        clean_phone = identifier.replace(" ", "").replace("-", "").replace("+", "")
        for c in self.caregivers:
            c_phone = c.get("phone", "").replace(" ", "").replace("-", "").replace("+", "")
            match_email = c.get("email", "").lower() == clean_id
            match_phone = c_phone == clean_phone and clean_phone
            if (match_email or match_phone) and c.get("password") == password:
                return c
        return None

caregiver_service = CaregiverService()
