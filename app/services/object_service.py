from ultralytics import YOLO
import numpy as np
from PIL import Image
import os
import torch
import torchvision.transforms as transforms
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights

# Global model instance (lazy load)
_embedding_model = None
_transform = None

def get_embedding_model():
    global _embedding_model, _transform
    if _embedding_model is None:
        print("🧠 Loading MobileNetV2 for Objects (PyTorch)...")
        _embedding_model = mobilenet_v2(weights=MobileNet_V2_Weights.DEFAULT)
        _embedding_model.eval()
        _transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    return _embedding_model, _transform

class ObjectDetector:
    def __init__(self, model_path="yolov8n.pt"):
        print(f"DEBUG: Loading YOLO model '{model_path}'...", flush=True)
        self.detector = YOLO(model_path)
        print("DEBUG: YOLO loaded.", flush=True)
    
    def detect_objects(self, image_path: str):
        """Returns YOLO detections."""
        results = self.detector(image_path)
        detections = []
        for r in results:
            for box in r.boxes:
                detections.append({
                    "object": self.detector.names[int(box.cls[0])],
                    "confidence": float(box.conf[0]),
                    "box": box.xyxy[0].tolist()
                })
        return detections

    def generate_embedding(self, image_path: str):
        """Generates 1280-d embedding for the full image (or crop)."""
        model, transform = get_embedding_model()
        
        try:
            img = Image.open(image_path).convert("RGB")
            tensor = transform(img).unsqueeze(0)
            
            with torch.no_grad():
                features = model.features(tensor).mean([2, 3]).squeeze(0).cpu().numpy()
            
            norm = np.linalg.norm(features)
            if norm > 0:
                features = features / norm
            return features.tolist() # 1280-dim list of floats
        except Exception as e:
            print(f"Error generating object embedding: {e}")
            return [0.0] * 1280

# Global instance
detector = ObjectDetector()
