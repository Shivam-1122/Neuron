import os
from PIL import Image
import numpy as np

try:
    import torch
    import torchvision.transforms as transforms
    from torchvision.models import resnet18, ResNet18_Weights
    from ultralytics import YOLO
    _CV_AVAILABLE = True
except (ImportError, OSError, Exception) as e:
    _CV_AVAILABLE = False
    print(f"[WARNING] PyTorch/Ultralytics not available ({e}). Running FaceService in fallback mode.", flush=True)

class FaceService:
    def __init__(self, model_path="yolov8n.pt"):
        self.detector = None
        self.model = None
        self.transform = None
        if _CV_AVAILABLE:
            try:
                print("DEBUG: Loading Face Detector (YOLO) and PyTorch Model...", flush=True)
                self.detector = YOLO(model_path)
                self.model = resnet18(weights=ResNet18_Weights.DEFAULT)
                self.model.fc = torch.nn.Identity()
                self.model.eval()
                self.transform = transforms.Compose([
                    transforms.Resize((160, 160)),
                    transforms.ToTensor(),
                    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
                ])
                print("DEBUG: Face Models Loaded.", flush=True)
            except Exception as e:
                print(f"[WARNING] Face model load error: {e}", flush=True)


    def get_embedding(self, img_input) -> list:
        try:
            if isinstance(img_input, str):
                return self.generate_embedding(img_input)
            
            if isinstance(img_input, np.ndarray):
                pil_img = Image.fromarray(img_input.astype('uint8')).convert("RGB")
            elif isinstance(img_input, Image.Image):
                pil_img = img_input.convert("RGB")
            else:
                return []

            if not _CV_AVAILABLE or self.model is None or self.transform is None:
                # Deterministic fallback
                import hashlib
                buf = io.BytesIO() if 'io' in globals() else None
                import io
                buf = io.BytesIO()
                pil_img.save(buf, format='JPEG')
                digest = hashlib.sha256(buf.getvalue()).hexdigest()
                vec = np.zeros(512, dtype=np.float32)
                for i, c in enumerate(digest):
                    vec[i % 512] += ord(c)
                norm = np.linalg.norm(vec)
                return (vec / norm if norm > 0 else vec).tolist()

            img_w, img_h = pil_img.size
            person_crop = None
            if self.detector:
                results = self.detector(pil_img, verbose=False)
                for r in results:
                    for box in r.boxes:
                        cls_name = self.detector.names[int(box.cls[0])]
                        if cls_name == "person":
                            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                            bw = x2 - x1
                            bh = y2 - y1
                            ratio = bh / max(img_h, 1)
                            face_y2 = y1 + int(bh * 0.75) if ratio > 0.6 else y1 + int(bh * 0.5)
                            x1 = max(0, x1 - int(bw * 0.05))
                            x2 = min(img_w, x2 + int(bw * 0.05))
                            y1 = max(0, y1)
                            face_y2 = min(img_h, face_y2)
                            person_crop = pil_img.crop((x1, y1, x2, face_y2))
                            break
                    if person_crop:
                        break

            target_img = person_crop if person_crop else pil_img
            tensor = self.transform(target_img).unsqueeze(0)
            with torch.no_grad():
                embedding = self.model(tensor).squeeze(0).cpu().numpy()
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            return embedding.tolist()
        except Exception as e:
            print(f"Error in get_embedding: {e}")
            return []

    def generate_embedding(self, image_path: str) -> list:
        try:
            if not os.path.exists(image_path):
                print(f"Image not found: {image_path}")
                return []

            if not _CV_AVAILABLE or self.model is None or self.transform is None:
                # Deterministic 512-d hash embedding fallback
                import hashlib
                with open(image_path, "rb") as f:
                    digest = hashlib.sha256(f.read()).hexdigest()
                vec = np.zeros(512, dtype=np.float32)
                for i, c in enumerate(digest):
                    vec[i % 512] += ord(c)
                norm = np.linalg.norm(vec)
                return (vec / norm if norm > 0 else vec).tolist()

            pil_img = Image.open(image_path).convert("RGB")
            img_w, img_h = pil_img.size
            
            # Detect persons using YOLO
            person_crop = None
            if self.detector:
                results = self.detector(image_path, verbose=False)
                for r in results:
                    for box in r.boxes:
                        cls_name = self.detector.names[int(box.cls[0])]
                        if cls_name == "person":
                            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                            bw = x2 - x1
                            bh = y2 - y1
                            ratio = bh / max(img_h, 1)
                            face_y2 = y1 + int(bh * 0.75) if ratio > 0.6 else y1 + int(bh * 0.5)
                            x1 = max(0, x1 - int(bw * 0.05))
                            x2 = min(img_w, x2 + int(bw * 0.05))
                            y1 = max(0, y1)
                            face_y2 = min(img_h, face_y2)
                            person_crop = pil_img.crop((x1, y1, x2, face_y2))
                            break
                    if person_crop:
                        break
            
            target_img = person_crop if person_crop else pil_img
            
            # Transform and embed with standard ResNet18
            tensor = self.transform(target_img).unsqueeze(0)
            
            with torch.no_grad():
                embedding = self.model(tensor).squeeze(0).cpu().numpy()
            
            # L2 Normalization for Cosine distance
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            return embedding.tolist()
            
        except Exception as e:
            print(f"Error generating face embedding: {e}")
            return []

    def verify(self, img1_path, img2_path):
        emb1 = self.generate_embedding(img1_path)
        emb2 = self.generate_embedding(img2_path)
        if not emb1 or not emb2:
            return False
        v1, v2 = np.array(emb1), np.array(emb2)
        denom = (np.linalg.norm(v1) * np.linalg.norm(v2))
        if denom == 0:
            return False
        cosine_sim = np.dot(v1, v2) / denom
        return cosine_sim > 0.6


    def analyze(self, img_path):
        return [{
            "age": 25, 
            "gender": "unknown", 
            "dominant_emotion": "neutral",
            "race": "unknown"
        }]

face_service = FaceService()
