import torch
import torchvision.transforms as transforms
from torchvision.models import resnet18, ResNet18_Weights
from PIL import Image
import numpy as np
import os
from ultralytics import YOLO

class FaceService:
    def __init__(self, model_path="yolov8n.pt"):
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

    def generate_embedding(self, image_path: str) -> list:
        try:
            if not os.path.exists(image_path):
                print(f"Image not found: {image_path}")
                return []

            pil_img = Image.open(image_path).convert("RGB")
            img_w, img_h = pil_img.size
            
            # Detect persons using YOLO
            results = self.detector(image_path, verbose=False)
            person_crop = None
            
            for r in results:
                for box in r.boxes:
                    cls_name = self.detector.names[int(box.cls[0])]
                    if cls_name == "person":
                        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                        bw = x2 - x1
                        bh = y2 - y1
                        
                        # If person takes up most of frame, use upper 75% for head/face
                        # If full standing person, take upper 40%
                        ratio = bh / max(img_h, 1)
                        if ratio > 0.6:
                            face_y2 = y1 + int(bh * 0.75)
                        else:
                            face_y2 = y1 + int(bh * 0.5)
                            
                        # Add slight margin
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
        from scipy.spatial.distance import cosine
        score = cosine(emb1, emb2)
        return score < 0.4

    def analyze(self, img_path):
        return [{
            "age": 25, 
            "gender": "unknown", 
            "dominant_emotion": "neutral",
            "race": "unknown"
        }]

face_service = FaceService()
