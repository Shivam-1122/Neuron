import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import io
import base64
from PIL import Image
import numpy as np
from app.services.face_service import face_service
from app.services.memory_service import memory_service
from qdrant_client.models import PointStruct

print("Re-indexing collections with VGGFace2 FaceNet...")

# 1. user_profiles
try:
    pts = memory_service.client.scroll(collection_name='user_profiles', limit=50, with_payload=True)[0]
    for p in pts:
        payload = p.payload or {}
        img_b64 = payload.get('image_base64')
        if img_b64:
            if ',' in img_b64:
                img_b64 = img_b64.split(',', 1)[1]
            try:
                img_bytes = base64.b64decode(img_b64)
                pil_img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
                vec = face_service.get_embedding(pil_img)
                if vec and len(vec) == 512:
                    memory_service.client.upsert(
                        collection_name='user_profiles',
                        points=[PointStruct(id=p.id, vector=vec, payload=payload)]
                    )
                    print(f"Re-indexed user_profile {p.id} ({payload.get('name')}) successfully.")
            except Exception as e:
                print(f"Error re-indexing user_profile {p.id}: {e}")
except Exception as e:
    print(f"Error scrolling user_profiles: {e}")

# 2. faces
try:
    pts = memory_service.client.scroll(collection_name='faces', limit=50, with_payload=True)[0]
    for p in pts:
        payload = p.payload or {}
        img_b64 = payload.get('image_base64')
        if img_b64:
            if ',' in img_b64:
                img_b64 = img_b64.split(',', 1)[1]
            try:
                img_bytes = base64.b64decode(img_b64)
                pil_img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
                vec = face_service.get_embedding(pil_img)
                if vec and len(vec) == 512:
                    memory_service.client.upsert(
                        collection_name='faces',
                        points=[PointStruct(id=p.id, vector=vec, payload=payload)]
                    )
                    print(f"Re-indexed face {p.id} ({payload.get('name')}) successfully.")
            except Exception as e:
                print(f"Error re-indexing face {p.id}: {e}")
except Exception as e:
    print(f"Error scrolling faces: {e}")

# 3. Fix unassigned objects
try:
    pts = memory_service.client.scroll(collection_name='objects', limit=50, with_payload=True)[0]
    for p in pts:
        payload = p.payload or {}
        if not payload.get('user_id'):
            payload['user_id'] = 'aacTZiaKvJSWFTpfVfpIF8f9o3w1'
            memory_service.client.set_payload(
                collection_name='objects',
                payload=payload,
                points=[p.id],
                wait=True
            )
            print(f"Assigned unowned object {p.id} ({payload.get('name')}) to aacTZiaKvJSWFTpfVfpIF8f9o3w1.")
except Exception as e:
    print(f"Error scrolling objects: {e}")

print("Re-indexing complete!")
