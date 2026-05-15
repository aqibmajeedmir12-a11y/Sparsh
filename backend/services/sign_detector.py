import os
import sys
import base64
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from mediapipe import Image as mpImage, ImageFormat

# Configuration
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"
# Use absolute path to the models or assume they are copied to backend folder
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../Niral AI Model/Niral AI Model"))
PYTORCH_MODEL_PATH = os.path.join(MODEL_DIR, "best_sign_model.pth")
LANDMARK_MODEL_PATH = os.path.join(MODEL_DIR, "hand_landmarker.task")

IMG_SIZE = 224
PAD = 30
CONF_THRESH = 35.0

# 51 classes
CLASSES = sorted([
    "01_palm", "02_l", "03_fist", "04_fist_moved", "05_thumb", "06_index", "07_ok", "08_palm_moved", "09_c", "1", "10_down", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "del", "nothing", "paper", "rock", "scissors", "space"
], key=str.lower)

class SignDetector:
    def __init__(self):
        self.ready = False
        if not os.path.exists(PYTORCH_MODEL_PATH) or not os.path.exists(LANDMARK_MODEL_PATH):
            print(f"[SignDetector] Models not found at {MODEL_DIR}")
            return
            
        print(f"[SignDetector] Loading model on {DEVICE}...")
        self.model = models.mobilenet_v3_small(weights=None)
        self.model.classifier[3] = nn.Linear(self.model.classifier[3].in_features, len(CLASSES))
        self.model.load_state_dict(torch.load(PYTORCH_MODEL_PATH, map_location=DEVICE))
        self.model.to(DEVICE).eval()
        
        self.tf = transforms.Compose([
            transforms.Resize((IMG_SIZE, IMG_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        
        base_opts = mp_python.BaseOptions(model_asset_path=LANDMARK_MODEL_PATH)
        lm_opts = mp_vision.HandLandmarkerOptions(
            base_options=base_opts,
            running_mode=mp_vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=0.55,
            min_hand_presence_confidence=0.55
        )
        self.landmarker = mp_vision.HandLandmarker.create_from_options(lm_opts)
        self.ready = True
        print("[SignDetector] Ready.")

    def predict_base64(self, b64_str: str) -> dict:
        if not self.ready:
            return {"error": "Models not loaded"}
            
        try:
            # Decode base64
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            img_bytes = base64.b64decode(b64_str)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
            if frame is None:
                return {"error": "Invalid image"}
                
            H, W = frame.shape[:2]
            
            # MediaPipe
            mp_img = mpImage(image_format=ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            result = self.landmarker.detect(mp_img)
            
            if not result.hand_landmarks:
                return {"sign": None, "confidence": 0, "message": "No hand detected"}
                
            pts = [(lm.x, lm.y) for lm in result.hand_landmarks[0]]
            
            # Bounding box
            xs = [p[0] * W for p in pts]
            ys = [p[1] * H for p in pts]
            x1 = max(0, int(min(xs)) - PAD)
            y1 = max(0, int(min(ys)) - PAD)
            x2 = min(W, int(max(xs)) + PAD)
            y2 = min(H, int(max(ys)) + PAD)
            
            roi = frame[y1:y2, x1:x2]
            if roi.size == 0 or roi.shape[0] < 10 or roi.shape[1] < 10:
                return {"sign": None, "confidence": 0, "message": "Hand too close to edge"}
                
            rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
            x = self.tf(Image.fromarray(rgb)).unsqueeze(0).to(DEVICE)
            with torch.no_grad():
                probs = torch.softmax(self.model(x), dim=1)
            conf, idx = torch.max(probs, 1)
            
            conf_val = conf.item() * 100
            sign = CLASSES[idx.item()]
            
            return {
                "sign": sign,
                "confidence": conf_val,
                "is_confident": conf_val >= CONF_THRESH
            }
            
        except Exception as e:
            print(f"[SignDetector] Error: {e}")
            return {"error": str(e)}

# Singleton instance
detector = SignDetector()
