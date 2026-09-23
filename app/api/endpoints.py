
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from qdrant_client.models import PointIdsList, Filter, FieldCondition, MatchValue, PointStruct
from app.services.face_service import face_service
from app.services.object_service import detector as object_service
from app.services.memory_service import memory_service
from app.services.tts_service import tts_service
from app.services.voice_service import voice_service
import shutil
from pathlib import Path
import uuid
import base64
from PIL import Image
import io
import numpy as np
from datetime import datetime
from app.services.caregiver_service import caregiver_service
from app.services.email_service import email_service
from app.services.task_service import task_service

router = APIRouter()

class PersonUpdateRequest(BaseModel):
    name: Optional[str] = None
    relation: Optional[str] = None
    notes: Optional[str] = None
    age: Optional[int] = None

class ObjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    location: Optional[str] = None

@router.post("/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...)):
    """
    Transcribe raw audio from frontend recording (WebM / WAV) via Whisper.
    """
    file_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix or ".webm"
    temp_path = TEMP_DIR / f"{file_id}{ext}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        text = voice_service.transcribe(str(temp_path))
        return {
            "status": "success",
            "text": text
        }
    except Exception as e:
        print(f"Transcription error: {e}")
        return {
            "status": "error",
            "text": "",
            "error": str(e)
        }
    finally:
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass

TEMP_DIR = Path("temp_uploads")
TEMP_DIR.mkdir(exist_ok=True)

# Ensure enrollment dir exists
ENROLL_DIR = Path("photo/enrolled")
ENROLL_DIR.mkdir(parents=True, exist_ok=True)

def encode_image_base64(image_path: str):
    """Resize and encode image to base64 for storage."""
    try:
        with Image.open(image_path) as img:
            # Resize to thumbnail to save space (e.g., 300px max)
            img.thumbnail((300, 300))
            buffered = io.BytesIO()
            img.convert("RGB").save(buffered, format="JPEG", quality=70)
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return f"data:image/jpeg;base64,{img_str}"
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None

@router.post("/recognize/person")
async def recognize_person(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Receive an image, detect faces, search Qdrant for identity.
    """
    # 1. Save temp file
    file_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix
    temp_path = TEMP_DIR / f"{file_id}{ext}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Generate Embedding
        # Note: FaceService currently returns list of floats or empty list
        embedding = face_service.generate_embedding(str(temp_path))
        
        if not embedding:
            return {"status": "no_face_detected", "person": None}
            
        # 3. Search Memory
        matches = memory_service.search_face(embedding)
        
        if matches:
             best_match = matches[0]
             name = best_match.payload.get("name", "Unknown")
             score = float(best_match.score)
             print(f"Face search best match: {name} with score: {score:.4f}")
             
             # Cosine similarity >= 0.40 is a reliable match for ResNet18 embeddings
             if score >= 0.40:
                 relation = best_match.payload.get("relation", "Unknown")
                 notes = best_match.payload.get("notes", "")
                 
                 return {
                     "status": "identified",
                     "person": {
                         "name": name,
                         "relation": relation,
                         "confidence": score,
                         "id": best_match.payload.get("person_id"),
                         "notes": notes,
                         "image": best_match.payload.get("image_base64", None),
                         "image_base64": best_match.payload.get("image_base64", None),
                         "audio": best_match.payload.get("audio_base64", None),
                         "audio_base64": best_match.payload.get("audio_base64", None)
                     }
                 }
             else:
                 print(f"Match score {score:.4f} is below threshold 0.40. Treated as unknown person.")

        return {"status": "unknown", "person": None}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        if temp_path.exists():
            temp_path.unlink()

from app.services.semantic_memory import semantic_memory

@router.post("/remember/person")
async def remember_person(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    relation: str = Form("Acquaintance"),
    notes: str = Form(None),
    age: int = Form(None),
    user_id: Optional[str] = Form("default_user"),
    file: UploadFile = File(...),
    audio_file: UploadFile = File(None)
):
    """Enroll a new person with optional voice sample."""
    file_id = str(uuid.uuid4())
    filename = f"{name.replace(' ', '_')}_{file_id}.jpg"
    perm_path = ENROLL_DIR / filename
    
    # Audio Path
    audio_b64 = None
    if audio_file:
         audio_path = Path("audio/enrolled") / f"{name.replace(' ', '_')}_{file_id}.webm"
         audio_path.parent.mkdir(parents=True, exist_ok=True)
         try:
             with open(audio_path, "wb") as buffer:
                 shutil.copyfileobj(audio_file.file, buffer)
             
             # Encode for Cloud
             with open(audio_path, "rb") as f:
                 audio_b64 = base64.b64encode(f.read()).decode("utf-8")
         except Exception as e:
             print(f"Error saving audio: {e}")

    try:
        # Save Image locally as backup
        with open(perm_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Generate Embedding
        embedding = face_service.generate_embedding(str(perm_path))
        
        if not embedding:
            if perm_path.exists():
                perm_path.unlink()
            raise HTTPException(status_code=400, detail="No face detected in enrollment photo. Please upload a clear photo of the face.")

        # Encode Image for Cloud Storage
        img_b64 = encode_image_base64(str(perm_path))
        
        # 4. Generate Avatar (optional/non-blocking)
        avatar_url = None
        try:
            from app.services.avatar_service import avatar_service
            avatar_url = avatar_service.generate_avatar(str(perm_path))
        except Exception as av_err:
            print(f"Avatar skipped: {av_err}")
            
        # Store in Qdrant
        metadata = {
            "name": name,
            "relation": relation,
            "age": age,
            "type": "person",
            "notes": notes or f"This is {name}, your {relation}.",
            "image_base64": img_b64,
            "avatar_url": avatar_url
        }
        if audio_b64:
            metadata["audio_base64"] = audio_b64 # Store voice sample in cloud!

        memory_service.store_face_memory(
            person_id=name.replace(" ", "_"),
            embedding=embedding,
            metadata=metadata
        )

        # Also store in semantic text knowledge for conversational LLM queries
        try:
            semantic_memory.learn_person(metadata)
        except Exception as sem_err:
            print(f"Warning: Failed to store semantic memory for {name}: {sem_err}")
        
        return {"status": "stored", "name": name, "avatar_url": avatar_url, "message": f"Successfully enrolled {name}."}
        
    except HTTPException:
        raise
    except Exception as e:
        if perm_path.exists():
             perm_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/remember/patient")
async def remember_patient(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    relation: str = Form("Acquaintance"),
    notes: str = Form(None),
    age: int = Form(None),
    user_id: Optional[str] = Form("default_user"),
    file: UploadFile = File(...),
    audio_file: Optional[UploadFile] = File(None)
):
    """Enroll a new PATIENT/Person via Caregiver (Stored in 'patients' and 'faces' collections)"""
    file_id = str(uuid.uuid4())
    filename = f"{name.replace(' ', '_')}_{file_id}.jpg"
    perm_path = ENROLL_DIR / filename
    
    # Audio Path
    audio_b64 = None
    if audio_file:
         audio_path = Path("audio/enrolled") / f"{name.replace(' ', '_')}_{file_id}.webm"
         audio_path.parent.mkdir(parents=True, exist_ok=True)
         try:
             with open(audio_path, "wb") as buffer:
                 shutil.copyfileobj(audio_file.file, buffer)
             with open(audio_path, "rb") as f:
                 audio_b64 = base64.b64encode(f.read()).decode("utf-8")
         except Exception as e:
             print(f"Error saving audio: {e}")

    try:
        # Save Image
        with open(perm_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Generate Embedding — use fallback hash if face detection fails
        embedding = face_service.generate_embedding(str(perm_path))
        
        if not embedding:
            # Fallback: deterministic 512-d image-hash embedding so enrollment never fails
            print(f"Face detect fallback for '{name}' — using image hash embedding.")
            import hashlib
            with open(perm_path, "rb") as f:
                digest = hashlib.sha256(f.read()).hexdigest()
            import numpy as np
            vec = np.zeros(512, dtype=np.float32)
            for i, c in enumerate(digest):
                vec[i % 512] += ord(c)
            norm = float(np.linalg.norm(vec))
            embedding = (vec / norm if norm > 0 else vec).tolist()

        # Encode for storage (always as data URI so frontend can render it)
        img_b64_raw = encode_image_base64(str(perm_path))
        img_b64 = f"data:image/jpeg;base64,{img_b64_raw}" if img_b64_raw and not img_b64_raw.startswith("data:") else img_b64_raw
        
        # Generate Avatar (optional/non-blocking)
        avatar_url = None
        try:
            from app.services.avatar_service import avatar_service
            avatar_url = avatar_service.generate_avatar(str(perm_path))
        except Exception as av_err:
            print(f"Avatar skipped: {av_err}")
            
        # Store in Qdrant PATIENTS collection
        metadata = {
            "name": name,
            "relation": relation,
            "age": age,
            "type": "patient_contact",
            "notes": notes or f"This is {name}, your {relation}.",
            "image_base64": img_b64,
            "avatar_url": avatar_url,
            "user_id": user_id or "default_user"
        }
        if audio_b64:
            metadata["audio_base64"] = audio_b64

        memory_service.store_patient_memory(
            person_id=name.replace(" ", "_"),
            embedding=embedding,
            metadata=metadata
        )

        # Also store face in faces collection for full compatibility
        memory_service.store_face_memory(
            person_id=name.replace(" ", "_"),
            embedding=embedding,
            metadata=metadata
        )

        # Also learn into semantic text knowledge
        try:
            semantic_memory.learn_person(metadata)
        except Exception as sem_err:
            print(f"Warning: Failed to store semantic memory for {name}: {sem_err}")
        
        return {"status": "stored", "name": name, "avatar_url": avatar_url, "message": f"Successfully enrolled {name}."}
        
    except HTTPException:
        raise
    except Exception as e:
        if perm_path.exists():
             perm_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/remember/object")
async def remember_object(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    notes: str = Form(None),
    user_id: Optional[str] = Form("default_user"),
    file: UploadFile = File(...)
):
    """Register a new personal object (e.g. Medicine Box)"""
    file_id = str(uuid.uuid4())
    temp_path = TEMP_DIR / f"{file_id}_{file.filename}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Generate Embedding
        embedding = object_service.generate_embedding(str(temp_path))
        
        # Encode
        img_b64 = encode_image_base64(str(temp_path))

        metadata = {
            "name": name,
            "type": "object",
            "notes": notes or f"This is your {name}.",
            "image_base64": img_b64
        }

        # Store
        memory_service.store_object_memory(
            object_id=str(uuid.uuid4()),
            embedding=embedding,
            metadata=metadata
        )

        # Store semantic memory for the object
        try:
            semantic_memory.learn_person({
                "name": name,
                "relation": "personal item",
                "notes": notes or f"My {name}."
            })
        except Exception as sem_err:
            print(f"Warning: Object semantic memory note: {sem_err}")
        
        return {"status": "stored", "name": name, "message": f"Successfully remembered your {name}."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path.exists():
            temp_path.unlink()

@router.post("/find/object")
async def find_object(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Identify a specific personal object."""
    file_id = str(uuid.uuid4())
    temp_path = TEMP_DIR / f"{file_id}_{file.filename}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 1. Generate Embedding
        embedding = object_service.generate_embedding(str(temp_path))
        
        # 2. Search
        matches = memory_service.search_object(embedding)
        
        found_name = "Unknown Object"
        found_notes = ""
        found_img = None
        
        if matches and matches[0].score > 0.6: # Threshold
            best = matches[0]
            found_name = best.payload.get("name", "Unknown")
            found_notes = best.payload.get("notes", "")
            found_img = best.payload.get("image_base64", None)
            
            # TTS
            msg = f"This looks like your {found_name}."
            if found_notes:
                msg += f" {found_notes}"
            # background_tasks.add_task(tts_service.speak, msg)
            
            return {
                "status": "identified", 
                "object": {
                    "name": found_name, 
                    "notes": found_notes, 
                    "confidence": best.score,
                    "location": best.payload.get("location", "Unknown"),
                    "image": found_img
                }
            }
        
        # Fallback: YOLO Detection -> Auto-Enroll
        detections = object_service.detect_objects(str(temp_path))
        if detections:
            # Found "cell phone", "bottle", etc.
            # Pick the highest confidence object
            best_det = max(detections, key=lambda x: x['confidence'])
            label = best_det['object']
            
            # Auto-Learn: Store this specific instance embedding
            object_id = str(uuid.uuid4())
            # Use the already calculated embedding
            # Note: We should ideally crop the object, but full image embedding is OK for prototype 
            # if the object is dominant.
            
            # Encode for storage
            img_b64 = encode_image_base64(str(temp_path))
            
            # Determine location (Mock or Current Context)
            # Since we don't have GPS, we say "Last Seen Location" or date
            from datetime import datetime
            timestamp = datetime.now().strftime("%I:%M %p")
            location = f"Last seen at {timestamp}"

            memory_service.store_object_memory(
                object_id=object_id,
                embedding=embedding,
                metadata={
                    "name": label,
                    "type": "object",
                    "notes": "Auto-enrolled from observation.",
                    "location": location,
                    "image_base64": img_b64
                }
            )
            
            found_name = label
            found_notes = "I just learned this object."
            
            # Return as 'identified' so Frontend treats it as a known object
            return {
                "status": "identified", 
                "object": {
                    "name": found_name, 
                    "notes": found_notes, 
                    "confidence": best_det['confidence'],
                    "location": location,
                    "image": img_b64
                }
            }
            
        return {"status": "unknown", "object": None}
        
    finally:
        if temp_path.exists():
            temp_path.unlink()
@router.get("/debug/names")
async def debug_names():
    """List all names in Qdrant Faces"""
    try:
        res = memory_service.client.scroll(
            collection_name="faces",
            limit=100,
            with_payload=True
        )
        points = res[0]
        names = [p.payload.get("name") for p in points]
        return {"count": len(names), "names": names}
    except Exception as e:
        return {"error": str(e)}

@router.get("/people")
async def get_enrolled_people(user_id: Optional[str] = Query(None)):
    """Retrieve enrolled people / loved ones / contacts, scoped by user_id if provided."""
    try:
        people = []
        seen_names = set()
        for col in ["faces", "patients"]:
            try:
                res = memory_service.client.scroll(
                    collection_name=col,
                    limit=100,
                    with_payload=True
                )
                points = res[0]
                for p in points:
                    payload = p.payload or {}
                    p_user = payload.get("user_id")
                    if user_id and p_user and p_user != user_id:
                        continue
                    name = payload.get("name")
                    if name and name not in seen_names and name.lower() not in ["unknown", "temp"]:
                        seen_names.add(name)
                        people.append({
                            "id": str(p.id),
                            "name": name,
                            "relation": payload.get("relation", "Family / Loved One"),
                            "notes": payload.get("notes", ""),
                            "age": payload.get("age"),
                            "image_base64": payload.get("image_base64"),
                            "avatar_url": payload.get("avatar_url"),
                            "timestamp": payload.get("timestamp", ""),
                            "user_id": p_user or "default_user"
                        })
            except Exception as ce:
                print(f"Scroll collection {col} warning: {ce}")
        
        # Sort newest first
        people.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
        return {"status": "success", "people": people}
    except Exception as e:
        return {"status": "error", "people": [], "error": str(e)}

def _find_points_by_name(col: str, target_name: str, with_payload: bool = True, user_id: Optional[str] = None):
    """Find points in a collection matching target_name with or without Qdrant index, scoped by user_id if provided."""
    norm_target = target_name.strip().lower()
    points = []
    # 1. Try filtered scroll first
    try:
        filter_conds = [FieldCondition(key="name", match=MatchValue(value=target_name.strip()))]
        if user_id:
            filter_conds.append(FieldCondition(key="user_id", match=MatchValue(value=user_id)))
        res = memory_service.client.scroll(
            collection_name=col,
            scroll_filter=Filter(must=filter_conds),
            limit=100,
            with_payload=with_payload
        )
        if res and res[0]:
            points = res[0]
    except Exception:
        pass

    # 2. Resilient fallback to full scroll if index missing or zero results
    if not points:
        try:
            res = memory_service.client.scroll(
                collection_name=col,
                limit=300,
                with_payload=True
            )
            if res and res[0]:
                for p in res[0]:
                    p_name = (p.payload or {}).get("name", "").strip().lower()
                    p_user = (p.payload or {}).get("user_id")
                    if p_name == norm_target:
                        if not user_id or not p_user or p_user == user_id:
                            points.append(p)
        except Exception as e:
            print(f"Fallback scroll error in {col}: {e}")
    return points

@router.put("/people")
@router.put("/people/{name:path}")
async def update_enrolled_person(req: PersonUpdateRequest, name: Optional[str] = None, user_id: Optional[str] = Query(None)):
    """Update an enrolled person's details in Qdrant and semantic memory."""
    if not name:
        raise HTTPException(status_code=400, detail="Person name is required.")
    try:
        updated = False
        target_name = name.strip()
        new_name = (req.name or target_name).strip()
        new_relation = req.relation
        new_notes = req.notes
        new_age = req.age

        for col in ["faces", "patients"]:
            try:
                points = _find_points_by_name(col, target_name, with_payload=True, user_id=user_id)
                if points:
                    p_ids = [p.id for p in points]
                    payload_update = {}
                    if new_name: payload_update["name"] = new_name
                    if new_relation is not None: payload_update["relation"] = new_relation
                    if new_notes is not None: payload_update["notes"] = new_notes
                    if new_age is not None: payload_update["age"] = new_age
                    if user_id: payload_update["user_id"] = user_id
                    
                    memory_service.client.set_payload(
                        collection_name=col,
                        payload=payload_update,
                        points=p_ids
                    )
                    updated = True
            except Exception as e:
                print(f"Update in {col} warning: {e}")

        # Update semantic memory
        try:
            sem_points = _find_points_by_name("text_knowledge", target_name, with_payload=False, user_id=user_id)
            sem_ids = [p.id for p in sem_points]
            if sem_ids:
                memory_service.client.delete(
                    collection_name="text_knowledge",
                    points_selector=PointIdsList(points=sem_ids)
                )
            
            semantic_memory.learn_person({
                "name": new_name,
                "relation": new_relation or "Family / Loved One",
                "notes": new_notes or f"This is {new_name}.",
                "user_id": user_id or "default_user"
            })
        except Exception as sem_e:
            print(f"Semantic memory update note: {sem_e}")

        if not updated:
            return {"status": "error", "message": f"Person '{name}' not found."}
        return {"status": "success", "message": f"Successfully updated '{new_name}'."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/people")
@router.delete("/people/{name:path}")
async def delete_enrolled_person(name: Optional[str] = None, user_id: Optional[str] = Query(None)):
    """Delete an enrolled person from faces, patients, and text_knowledge."""
    if not name:
        raise HTTPException(status_code=400, detail="Person name is required.")
    try:
        deleted_count = 0
        target_name = name.strip()

        for col in ["faces", "patients"]:
            try:
                points = _find_points_by_name(col, target_name, with_payload=False, user_id=user_id)
                if points:
                    p_ids = [p.id for p in points]
                    memory_service.client.delete(
                        collection_name=col,
                        points_selector=PointIdsList(points=p_ids)
                    )
                    deleted_count += len(p_ids)
            except Exception as e:
                print(f"Delete from {col} warning: {e}")

        # Also remove from semantic memory
        try:
            sem_points = _find_points_by_name("text_knowledge", target_name, with_payload=False, user_id=user_id)
            sem_ids = [p.id for p in sem_points]
            if sem_ids:
                memory_service.client.delete(
                    collection_name="text_knowledge",
                    points_selector=PointIdsList(points=sem_ids)
                )
        except Exception as sem_e:
            print(f"Semantic memory delete note: {sem_e}")

        return {"status": "success", "deleted": deleted_count, "message": f"Deleted {target_name}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/objects")
async def get_enrolled_objects(user_id: Optional[str] = Query(None)):
    """Retrieve all enrolled objects / memory anchors, scoped by user_id if provided."""
    try:
        objects = []
        seen_names = set()
        try:
            res = memory_service.client.scroll(
                collection_name="objects",
                limit=100,
                with_payload=True
            )
            points = res[0]
            for p in points:
                payload = p.payload or {}
                o_user = payload.get("user_id")
                if user_id and o_user and o_user != user_id:
                    continue
                name = payload.get("name")
                if name and name not in seen_names:
                    seen_names.add(name)
                    objects.append({
                        "id": str(p.id),
                        "name": name,
                        "notes": payload.get("notes", ""),
                        "location": payload.get("location", ""),
                        "image_base64": payload.get("image_base64"),
                        "timestamp": payload.get("timestamp", ""),
                        "user_id": o_user or "default_user"
                    })
        except Exception as ce:
            print(f"Scroll objects collection warning: {ce}")
        objects.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
        return {"status": "success", "objects": objects}
    except Exception as e:
        return {"status": "error", "objects": [], "error": str(e)}

@router.put("/objects")
@router.put("/objects/{name:path}")
async def update_enrolled_object(req: ObjectUpdateRequest, name: Optional[str] = None, user_id: Optional[str] = Query(None)):
    """Update an enrolled object's name, notes, or location."""
    if not name:
        raise HTTPException(status_code=400, detail="Object name is required.")
    try:
        target_name = name.strip()
        new_name = (req.name or target_name).strip()
        new_notes = req.notes
        new_location = req.location

        points = _find_points_by_name("objects", target_name, with_payload=True, user_id=user_id)
        if not points:
            return {"status": "error", "message": f"Object '{name}' not found."}

        p_ids = [p.id for p in points]
        payload_update = {}
        if new_name: payload_update["name"] = new_name
        if new_notes is not None: payload_update["notes"] = new_notes
        if new_location is not None: payload_update["location"] = new_location
        if user_id: payload_update["user_id"] = user_id

        memory_service.client.set_payload(
            collection_name="objects",
            payload=payload_update,
            points=p_ids
        )

        return {"status": "success", "message": f"Successfully updated '{new_name}'."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/objects")
@router.delete("/objects/{name:path}")
async def delete_enrolled_object(name: Optional[str] = None, user_id: Optional[str] = Query(None)):
    """Delete an enrolled object from objects collection."""
    if not name:
        raise HTTPException(status_code=400, detail="Object name is required.")
    try:
        target_name = name.strip()
        points = _find_points_by_name("objects", target_name, with_payload=False, user_id=user_id)
        if not points:
            return {"status": "error", "message": f"Object '{name}' not found."}

        p_ids = [p.id for p in points]
        memory_service.client.delete(
            collection_name="objects",
            points_selector=PointIdsList(points=p_ids)
        )
        return {"status": "success", "deleted": len(p_ids), "message": f"Deleted object '{target_name}'."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/game/memory-pool")
async def get_game_memory_pool():
    """Retrieve enrolled people, objects, and sanctuary memory anchors for Cross-Memory Recall game."""
    try:
        # 1. Enrolled People
        people = []
        seen_names = set()
        for col in ["faces", "patients"]:
            try:
                res = memory_service.client.scroll(
                    collection_name=col,
                    limit=100,
                    with_payload=True
                )
                points = res[0]
                for p in points:
                    payload = p.payload or {}
                    name = payload.get("name")
                    if name and name not in seen_names and name.lower() not in ["unknown", "temp"]:
                        seen_names.add(name)
                        people.append({
                            "name": name,
                            "relation": payload.get("relation", "Family / Loved One"),
                            "notes": payload.get("notes", ""),
                            "age": payload.get("age"),
                            "image_base64": payload.get("image_base64"),
                            "avatar_url": payload.get("avatar_url")
                        })
            except Exception as ce:
                print(f"Game pool scroll {col} warning: {ce}")

        # 2. Enrolled Objects
        objects = []
        seen_objects = set()
        try:
            res = memory_service.client.scroll(
                collection_name="objects",
                limit=100,
                with_payload=True
            )
            points = res[0]
            for p in points:
                payload = p.payload or {}
                obj_name = payload.get("name")
                if obj_name and obj_name not in seen_objects:
                    seen_objects.add(obj_name)
                    objects.append({
                        "name": obj_name,
                        "notes": payload.get("notes", f"Your personal {obj_name}"),
                        "location": payload.get("location", "Bedside table"),
                        "image_base64": payload.get("image_base64")
                    })
        except Exception as oe:
            print(f"Game pool scroll objects warning: {oe}")

        # 3. Default Sanctuary Anchors (warm, grounding everyday facts)
        sanctuary_anchors = [
            {
                "question": "Where are your reading glasses typically kept for evening reading?",
                "answer": "On the bedside table next to your book",
                "distractors": ["In the refrigerator door", "Inside the hallway umbrella stand", "Underneath the living room rug"],
                "category": "Everyday Essentials"
            },
            {
                "question": "What time is your calming morning tea routine scheduled?",
                "answer": "9:00 AM in the sunlit breakfast nook",
                "distractors": ["1:30 AM in the garage", "11:45 PM before sleep", "5:00 AM before sunrise"],
                "category": "Daily Routine"
            },
            {
                "question": "Who is your primary physician who assists with your wellness check-ins?",
                "answer": "Dr. Julian Vance (Neurology & Wellness)",
                "distractors": ["Officer Bradley Cooper", "Chef Antonio", "Captain Jack Miller"],
                "category": "Care Team"
            },
            {
                "question": "What is the name of your gentle companion cat that loves sunny windowsills?",
                "answer": "Barnaby the ginger tabby",
                "distractors": ["Thunderbolt the greyhound", "Professor Whiskers the parrot", "Shelly the tortoise"],
                "category": "Home Companions"
            },
            {
                "question": "Where is your daily medicine organizer kept for easy morning access?",
                "answer": "Next to the water carafe in the kitchen",
                "distractors": ["In the outdoor garden shed", "Behind the basement furnace", "Under the car seat"],
                "category": "Health & Care"
            }
        ]

        return {
            "status": "success",
            "people": people,
            "objects": objects,
            "anchors": sanctuary_anchors
        }
    except Exception as e:
        return {"status": "error", "people": [], "objects": [], "anchors": [], "error": str(e)}

class CreateTaskRequest(BaseModel):
    title: str
    time: Optional[str] = "Today"
    notes: Optional[str] = ""
    user_id: Optional[str] = "default_user"

@router.get("/tasks")
async def get_tasks(user_id: Optional[str] = Query(None)):
    """Retrieve today's gentle anchors and scheduled tasks scoped by user_id."""
    from app.services.task_service import task_service
    tasks = task_service.get_tasks(user_id=user_id)
    return {"status": "success", "tasks": tasks}

@router.post("/tasks")
async def create_task(req: CreateTaskRequest):
    """Add a scheduled task or gentle anchor routine."""
    from app.services.task_service import task_service
    task = task_service.add_task(
        title=req.title, 
        time=req.time or "Today", 
        notes=req.notes or "",
        user_id=req.user_id or "default_user"
    )
    return {"status": "success", "task": task, "message": f"Added '{task['title']}' to gentle anchors."}

@router.put("/tasks/{task_id}/toggle")
async def toggle_task_status(task_id: str, user_id: Optional[str] = Query(None)):
    """Toggle completed status of a gentle anchor task."""
    from app.services.task_service import task_service
    task = task_service.toggle_task(task_id, user_id=user_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "task": task}

@router.delete("/tasks/{task_id}")
async def delete_task_item(task_id: str, user_id: Optional[str] = Query(None)):
    """Delete a gentle anchor task."""
    from app.services.task_service import task_service
    success = task_service.delete_task(task_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "message": "Task deleted"}

# =========================================================================
# BIOMETRIC AUTHENTICATION & MULTI-TENANT USER ACCOUNT LIFECYCLE
# =========================================================================

@router.post("/auth/register-face")
async def register_user_face(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    name: str = Form(...),
    email: str = Form(""),
    phone: str = Form("")
):
    """
    Extract face embedding from user's signup camera snapshot and store in 'user_profiles'
    collection to enable Biometric Face Scan Login.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        img_np = np.array(image)
        
        vector = face_service.get_embedding(img_np)
        if vector is None:
            temp_f = TEMP_DIR / f"signup_{uuid.uuid4().hex}.jpg"
            image.save(temp_f)
            vector = face_service.generate_embedding(str(temp_f))
            try:
                temp_f.unlink()
            except Exception:
                pass
            
        if vector is None:
            return {"status": "error", "message": "No clear face detected in snapshot. Please ensure your face is clearly visible."}
        
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        img_data_uri = f"data:image/jpeg;base64,{img_base64}"
        
        try:
            memory_service.client.get_collection("user_profiles")
        except Exception:
            from qdrant_client.models import VectorParams, Distance
            memory_service.client.create_collection(
                collection_name="user_profiles",
                vectors_config=VectorParams(size=len(vector), distance=Distance.COSINE)
            )

        # --- FIX 3: Prevent duplicate registrations for same user_id ---
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            existing = memory_service.client.scroll(
                collection_name="user_profiles",
                scroll_filter=Filter(
                    must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
                ),
                limit=1,
                with_payload=False
            )
            if existing and existing[0]:
                # Update existing point's face embedding instead of creating duplicate
                existing_id = existing[0][0].id
                memory_service.client.upsert(
                    collection_name="user_profiles",
                    points=[
                        PointStruct(
                            id=existing_id,
                            vector=vector.tolist() if hasattr(vector, "tolist") else list(vector),
                            payload={
                                "user_id": user_id,
                                "name": name,
                                "email": email,
                                "phone": phone,
                                "image_base64": img_data_uri,
                                "created_at": datetime.now().isoformat()
                            }
                        )
                    ]
                )
                return {
                    "status": "success",
                    "message": "Face biometric updated for existing account.",
                    "user_id": user_id,
                    "image_base64": img_data_uri
                }
        except Exception as dup_err:
            print(f"Duplicate check note: {dup_err}")
            
        point_id = str(uuid.uuid4())
        memory_service.client.upsert(
            collection_name="user_profiles",
            points=[
                PointStruct(
                    id=point_id,
                    vector=vector.tolist() if hasattr(vector, "tolist") else list(vector),
                    payload={
                        "user_id": user_id,
                        "name": name,
                        "email": email,
                        "phone": phone,
                        "image_base64": img_data_uri,
                        "created_at": datetime.now().isoformat()
                    }
                )
            ]
        )
        return {
            "status": "success",
            "message": "User face registered successfully for biometric login.",
            "user_id": user_id,
            "image_base64": img_data_uri
        }
    except Exception as e:
        print(f"Face registration error: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/auth/face-login")
async def face_login(file: UploadFile = File(...)):
    """
    Perform Biometric Face Scan Login by matching captured camera frame against 'user_profiles' in Qdrant.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        img_np = np.array(image)
        
        vector = face_service.get_embedding(img_np)
        if vector is None:
            temp_f = TEMP_DIR / f"login_{uuid.uuid4().hex}.jpg"
            image.save(temp_f)
            vector = face_service.generate_embedding(str(temp_f))
            try:
                temp_f.unlink()
            except Exception:
                pass
            
        if vector is None:
            return {"status": "no_face", "message": "No face detected in camera scan. Please look directly at the camera."}
            
        try:
            query_vec = vector.tolist() if hasattr(vector, "tolist") else list(vector)
            search_res = []
            try:
                search_res = memory_service.client.query_points(
                    collection_name="user_profiles",
                    query=query_vec,
                    limit=5,
                    with_payload=True
                ).points
            except AttributeError:
                search_res = memory_service.client.search(
                    collection_name="user_profiles",
                    query_vector=query_vec,
                    limit=5,
                    with_payload=True
                )
            except Exception as q_err:
                print(f"query_points user_profiles warning: {q_err}")

            if not search_res:
                try:
                    search_res = memory_service.client.query_points(
                        collection_name="patients",
                        query=query_vec,
                        limit=5,
                        with_payload=True
                    ).points
                except Exception:
                    pass

            if search_res and len(search_res) > 0:
                for top in search_res:
                    if top.score >= 0.35:
                        payload = top.payload or {}
                        role = payload.get("role") or "patient"
                        cand_user_id = payload.get("user_id") or ""
                        # STRICT PATIENT-ONLY FACE LOGIN: Reject any caregiver face match
                        if role == "caregiver" or cand_user_id.startswith("cg_"):
                            print(f"Face matched a caregiver profile ({cand_user_id}), skipping since face login is strictly restricted to patients.")
                            continue

                        returned_uid = cand_user_id
                        patient_id = cand_user_id
                        return {
                            "status": "authenticated",
                            "user_id": returned_uid,
                            "patient_id": patient_id,
                            "name": payload.get("name"),
                            "email": payload.get("email"),
                            "phone": payload.get("phone"),
                            "role": "patient",
                            "is_caregiver": False,
                            "image_base64": payload.get("image_base64"),
                            "score": top.score
                        }
                    else:
                        print(f"Face login candidate score {top.score:.4f} is below 0.35 threshold.")
        except Exception as se:
            print(f"Face login search warning: {se}")
            
        return {"status": "not_recognized", "message": "Face not recognized. Please sign in with email and password."}
    except Exception as e:
        print(f"Face login error: {e}")
        return {"status": "error", "message": str(e)}

class CaregiverNotifyRequest(BaseModel):
    user_id: Optional[str] = "default_user"
    patient_name: Optional[str] = "Patient"
    query: str
    timestamp: Optional[str] = ""

class CaregiverLoginRequest(BaseModel):
    identifier: str
    password: str

@router.post("/auth/caregiver-login")
async def caregiver_login(req: CaregiverLoginRequest):
    """Log in an authorized caregiver using their email/phone and password."""
    # FIX 5: Reload from disk before authenticating so newly-added caregivers are visible
    caregiver_service._reload()
    cg = caregiver_service.authenticate_caregiver(req.identifier, req.password)
    if not cg:
        raise HTTPException(status_code=401, detail="Invalid caregiver credentials.")
    return {
        "status": "authenticated",
        # FIX 5: Wrap in 'user' key to match what AuthContext expects
        "user": {
            "id": cg.get("id"),
            "uid": cg.get("id"),
            "name": cg.get("name"),
            "email": cg.get("email"),
            "phone": cg.get("phone"),
            "patient_id": cg.get("user_id") or "default_user",
            "image_base64": cg.get("image_base64") or ""
        }
    }

@router.get("/caregivers")
async def get_caregivers(user_id: Optional[str] = Query(None)):
    """Retrieve all caregivers registered for a patient."""
    cgs = caregiver_service.get_caregivers(user_id=user_id)
    return {"status": "success", "caregivers": cgs}

@router.post("/caregivers")
async def add_caregiver_endpoint(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    relation: str = Form("Caregiver"),
    password: str = Form(""),
    user_id: Optional[str] = Form("default_user"),
    file: Optional[UploadFile] = File(None)
):
    """
    Register an authorized caregiver in the Caregiver Section with email and optional face photo
    for 1-click Biometric Face Scan Login.
    """
    img_b64 = ""
    vector = None
    if file:
        try:
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            img_np = np.array(image)
            vector = face_service.get_embedding(img_np)
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG", quality=85)
            img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        except Exception as e:
            print(f"Caregiver photo note: {e}")

    new_cg = caregiver_service.add_caregiver(
        name=name,
        email=email,
        phone=phone,
        relation=relation,
        password=password,
        user_id=user_id,
        image_base64=img_b64
    )

    # Store caregiver facial biometrics and knowledge in Qdrant & Semantic Memory so the Assistant recognizes them
    try:
        notes_text = f"{name} is your registered {relation or 'Caregiver'}. Email: {email}. Phone: {phone}."
        if vector is not None and len(vector) > 0:
            memory_service.store_face_memory(
                person_id=f"caregiver_{new_cg['id']}",
                embedding=vector,
                metadata={
                    "name": name,
                    "relation": relation or "Caregiver",
                    "role": "caregiver",
                    "type": "caregiver",
                    "email": email,
                    "phone": phone,
                    "notes": notes_text,
                    "image_base64": img_b64,
                    "user_id": user_id or "default_user",
                    "timestamp": datetime.now().isoformat()
                }
            )
        
        # Learn semantic knowledge
        semantic_memory.learn_person({
            "name": name,
            "relation": relation or "Caregiver",
            "role": "caregiver",
            "notes": notes_text,
            "image_base64": img_b64,
            "user_id": user_id or "default_user"
        })
        semantic_memory.learn_fact(
            fact_text=f"The patient's caregiver is {name}, who is their registered {relation or 'Caregiver'}. Contact email: {email}, phone: {phone}.",
            entity_name="caregiver",
            fact_type="caregiver_identity",
            metadata={"name": name, "relation": relation, "email": email, "phone": phone, "user_id": user_id}
        )
    except Exception as mem_err:
        print(f"Error enrolling caregiver into memory: {mem_err}")

    return {"status": "success", "caregiver": new_cg}

@router.post("/caregivers/{caregiver_id}/photo")
async def update_caregiver_photo_endpoint(
    caregiver_id: str,
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)
):
    """Update face photo data for an existing registered caregiver."""
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        img_np = np.array(image)
        vector = face_service.get_embedding(img_np)
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        cg = caregiver_service.update_caregiver_photo(caregiver_id, img_b64, user_id=user_id)
        if not cg:
            raise HTTPException(status_code=404, detail="Caregiver not found")

        # Update Qdrant face memory & semantic memory
        name = cg.get("name", "Caregiver")
        relation = cg.get("relation") or "Caregiver"
        email = cg.get("email", "")
        phone = cg.get("phone", "")
        effective_user_id = user_id or cg.get("user_id") or "default_user"
        notes_text = f"{name} is your registered {relation}. Email: {email}. Phone: {phone}."

        if vector is not None and len(vector) > 0:
            memory_service.store_face_memory(
                person_id=f"caregiver_{caregiver_id}",
                embedding=vector,
                metadata={
                    "name": name,
                    "relation": relation,
                    "role": "caregiver",
                    "type": "caregiver",
                    "email": email,
                    "phone": phone,
                    "notes": notes_text,
                    "image_base64": img_b64,
                    "user_id": effective_user_id,
                    "timestamp": datetime.now().isoformat()
                }
            )

        semantic_memory.learn_person({
            "name": name,
            "relation": relation,
            "role": "caregiver",
            "notes": notes_text,
            "image_base64": img_b64,
            "user_id": effective_user_id
        })
        semantic_memory.learn_fact(
            fact_text=f"The patient's caregiver is {name}, who is their registered {relation}. Contact email: {email}, phone: {phone}.",
            entity_name="caregiver",
            fact_type="caregiver_identity",
            metadata={"name": name, "relation": relation, "email": email, "phone": phone, "user_id": effective_user_id}
        )

        return {"status": "success", "caregiver": cg, "message": f"Successfully updated face data for {name}."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/caregivers/{caregiver_id}")
async def delete_caregiver_endpoint(caregiver_id: str, user_id: Optional[str] = Query(None)):
    """Delete a registered caregiver and purge their account and memory data."""
    caregiver_service._reload()
    cg_to_delete = None
    cid_str = str(caregiver_id).strip().lower()
    for c in caregiver_service.caregivers:
        if (str(c.get("id", "")).strip().lower() == cid_str 
            or str(c.get("email", "")).strip().lower() == cid_str 
            or cid_str == f"caregiver_{str(c.get('id', '')).strip().lower()}"
            or (c.get("id") and cid_str.endswith(str(c.get("id", "")).strip().lower()))
            or str(c.get("name", "")).strip().lower() == cid_str):
            cg_to_delete = c
            break

    actual_cg_id = cg_to_delete.get("id") if cg_to_delete else caregiver_id
    success = caregiver_service.delete_caregiver(actual_cg_id)
    if not success and not cg_to_delete:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    cg_email = cg_to_delete.get("email") if cg_to_delete else ""
    cg_name = cg_to_delete.get("name") if cg_to_delete else ""
    cg_user_id = cg_to_delete.get("user_id") if cg_to_delete else ""

    # 1. Purge caregiver points from Qdrant faces
    try:
        memory_service.client.delete(
            collection_name="faces",
            points_selector=Filter(
                must=[
                    FieldCondition(key="person_id", match=MatchValue(value=f"caregiver_{actual_cg_id}"))
                ]
            )
        )
    except Exception as del_err:
        print(f"Caregiver face delete note: {del_err}")

    # 2. Purge all Qdrant collections for this caregiver account
    for col in ["user_profiles", "faces", "objects", "patients", "text_knowledge"]:
        try:
            res = memory_service.client.scroll(collection_name=col, limit=500, with_payload=True)
            if res and res[0]:
                cg_points = [
                    p.id for p in res[0] 
                    if (p.payload or {}).get("user_id") == actual_cg_id 
                    or (p.payload or {}).get("person_id") == f"caregiver_{actual_cg_id}"
                    or (cg_email and str((p.payload or {}).get("email", "")).lower() == cg_email.lower())
                    or (cg_user_id and cg_user_id != "default_user" and (p.payload or {}).get("user_id") == cg_user_id and (p.payload or {}).get("role") == "caregiver")
                ]
                if cg_points:
                    memory_service.client.delete(
                        collection_name=col,
                        points_selector=PointIdsList(points=cg_points)
                    )
        except Exception as e:
            print(f"Purge col {col} note: {e}")

    # 3. Clean up tasks if any
    try:
        task_service.delete_user_tasks(actual_cg_id)
    except Exception:
        pass

    return {
        "status": "success",
        "message": f"Caregiver {cg_name or actual_cg_id} and associated account data deleted.",
        "caregiver_id": actual_cg_id,
        "email": cg_email
    }

@router.post("/caregiver/notify")
async def notify_caregivers(req: CaregiverNotifyRequest):
    """
    Send an email alert to all registered caregivers when the assistant
    has no data regarding what the patient asked.
    """
    caregivers = caregiver_service.get_caregivers(user_id=req.user_id)
    emails = [c.get("email") for c in caregivers if c.get("email")]
    
    # If no caregivers stored yet in caregivers.json, also check faces collection for contacts with email
    if not emails:
        try:
            res = memory_service.client.scroll(collection_name="faces", limit=50, with_payload=True)
            if res and res[0]:
                for p in res[0]:
                    p_email = (p.payload or {}).get("email")
                    if p_email and "@" in p_email:
                        emails.append(p_email)
        except Exception:
            pass

    if not emails:
        return {
            "status": "no_recipients",
            "message": "No caregiver email addresses found. Please add a caregiver in the Caregiver section.",
            "notified_caregivers": []
        }

    res = email_service.send_caregiver_alert(
        to_emails=emails,
        patient_name=req.patient_name or "Your Loved One",
        patient_query=req.query,
        timestamp=req.timestamp or datetime.now().strftime("%I:%M %p, %b %d")
    )
    return {
        "status": res.get("status", "success"),
        "notified_caregivers": emails,
        "count": len(emails),
        "message": f"Successfully notified {len(emails)} caregiver(s) via email.",
        "details": res
    }

@router.delete("/auth/user/{user_id}")
async def delete_user_account_data(user_id: str, email: Optional[str] = Query(None)):
    """
    Permanently delete all user-scoped data across Qdrant, caregivers.json, and gentle anchors when an account is deleted.
    """
    try:
        deleted_records = 0
        
        # 1. Purge from caregivers.json if this user is a caregiver or owns caregivers
        try:
            caregiver_service._reload()
            to_remove_ids = []
            target_id = str(user_id).strip().lower()
            target_email = str(email).strip().lower() if email else ""
            for c in caregiver_service.caregivers:
                cid = str(c.get("id", "")).strip().lower()
                cemail = str(c.get("email", "")).strip().lower()
                cuid = str(c.get("user_id", "")).strip().lower()
                if (cid == target_id 
                    or cemail == target_id 
                    or cuid == target_id 
                    or (target_email and cemail == target_email)
                    or (target_id.startswith("caregiver_") and cid == target_id.replace("caregiver_", ""))):
                    to_remove_ids.append(c.get("id"))
            for cid in to_remove_ids:
                caregiver_service.delete_caregiver(cid)
        except Exception as cg_err:
            print(f"Caregiver purge during user deletion note: {cg_err}")

        # 2. Purge from all Qdrant collections
        for col in ["user_profiles", "faces", "objects", "patients", "text_knowledge"]:
            try:
                res = memory_service.client.scroll(
                    collection_name=col,
                    limit=500,
                    with_payload=True
                )
                if res and res[0]:
                    user_points = [
                        p.id for p in res[0] 
                        if (p.payload or {}).get("user_id") == user_id 
                        or (p.payload or {}).get("person_id") == f"caregiver_{user_id}"
                        or (p.payload or {}).get("id") == user_id
                        or (email and str((p.payload or {}).get("email", "")).lower() == str(email).lower())
                    ]
                    if user_points:
                        memory_service.client.delete(
                            collection_name=col,
                            points_selector=PointIdsList(points=user_points)
                        )
                        deleted_records += len(user_points)
            except Exception as e:
                print(f"Clean {col} for user {user_id} warning: {e}")
                
        # 3. Delete gentle anchors
        try:
            task_service.delete_user_tasks(user_id)
        except Exception as t_err:
            print(f"Delete tasks note: {t_err}")
        
        return {"status": "success", "deleted_records": deleted_records, "message": f"Successfully deleted all data for user {user_id}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




