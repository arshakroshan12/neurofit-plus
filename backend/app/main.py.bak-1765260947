"""
NeuroFit+ Backend API

FastAPI application for fatigue prediction based on session data.
"""
import json
import os
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
import joblib
import numpy as np
import sklearn
import requests

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# --- START: runtime-safe model path fallback (added) ---
from pathlib import Path as _P

# Prefer env var, else use the backend-owned folder
_ENV_PATH = os.environ.get("NEUROFIT_MODEL_PATH", "/app/backend/models/fatigue_model.pkl")

# if older code attempted to create /app/backend/models (permission issue), prefer backend path
# set a module-level alias the rest of the file can use (MODEL_PATH)
MODEL_PATH = _ENV_PATH
_MODEL_DIR = _P(MODEL_PATH).parent

try:
    _MODEL_DIR.mkdir(parents=True, exist_ok=True)
except PermissionError:
    # fallback to /app/backend/models which should be writable in image
    MODEL_PATH = "/app/backend/models/fatigue_model.pkl"
    _MODEL_DIR = _P(MODEL_PATH).parent
    _MODEL_DIR.mkdir(parents=True, exist_ok=True)

print(f"[neurofit] Using MODEL_PATH={MODEL_PATH}")
# --- END: runtime-safe model path fallback ---

# ----------------------------
# Models / Schemas
# ----------------------------

class AnswerItem(BaseModel):
    question_id: str
    value: float

class TypingFeatures(BaseModel):
    # optional fields with sane defaults for backwards compatibility
    average_latency_ms: Optional[float] = Field(0.0, ge=0)
    total_duration_ms: Optional[float] = Field(0.0, ge=0)
    backspace_rate: Optional[float] = Field(0.0, ge=0)

class TaskPerformance(BaseModel):
    reaction_time_ms: Optional[float] = Field(0.0, ge=0)
    reaction_attempted: Optional[bool] = Field(False)

class SessionData(BaseModel):
    """Flexible session schema: accepts either list or dict for answers"""
    user_id: Optional[str] = None
    timestamp: str = Field(..., description="ISO timestamp")
    answers: Union[List[AnswerItem], Dict[str, float]] = Field(..., description="Answers as list or dict")
    typing_features: TypingFeatures = Field(default_factory=TypingFeatures)
    task_performance: TaskPerformance = Field(default_factory=TaskPerformance)

    def normalized_answers(self) -> List[AnswerItem]:
        """Return answers always as a list[AnswerItem], whether input was dict or list."""
        if isinstance(self.answers, list):
            return self.answers
        else:
            return [AnswerItem(question_id=k, value=float(v)) for k, v in self.answers.items()]

class FatiguePredictionResponse(BaseModel):
    """Response model for fatigue prediction"""
    fatigue_score: float = Field(..., ge=0, le=100, description="Fatigue score (0-100)")
    risk_level: str = Field(..., description="Risk level: low, medium, or high")
    recommendations: List[str] = Field(..., description="Personalized recommendations")
    timestamp: str = Field(..., description="Prediction timestamp")
    model_used: str = Field(..., description="Model type used: 'ml_model' or 'heuristic'")

# ----------------------------
# App & paths
# ----------------------------

app = FastAPI(
    title="NeuroFit+ API",
    description="Fatigue prediction API for NeuroFit+",
    version="1.0.0"
)

# Allow local frontend origins (adjust if your frontend runs elsewhere)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # repo-root
DATA_DIR = BASE_DIR / "data"
MODEL_SEARCH_PATHS = [
    BASE_DIR / "models" / "fatigue_model.pkl",
    BASE_DIR / "backend" / "models" / "fatigue_model.pkl",
]
MANIFEST_SEARCH_PATHS = [
    BASE_DIR / "models" / "model_manifest.json",
    BASE_DIR / "backend" / "models" / "model_manifest.json",
]
SESSIONS_FILE = DATA_DIR / "sessions.jsonl"

DATA_DIR.mkdir(parents=True, exist_ok=True)
for model_dir in {path.parent for path in MODEL_SEARCH_PATHS}:
    model_dir.mkdir(parents=True, exist_ok=True)

MODEL_FILE = next((path for path in MODEL_SEARCH_PATHS if path.exists()), None)
MANIFEST_FILE = next((path for path in MANIFEST_SEARCH_PATHS if path.exists()), None)

# --- START: download model on startup if missing ---
MODEL_URL = os.environ.get("MODEL_URL")
MODEL_AUTH_HEADER = os.environ.get("MODEL_AUTH_HEADER")  # optional token for private URLs

def _download_model_if_missing():
    """
    Downloads the model from MODEL_URL if:
    - MODEL_URL is set
    - MODEL_PATH does not already exist
    """
    try:
        if os.path.exists(MODEL_PATH):
            print(f"[neurofit] Model already exists at {MODEL_PATH}")
            return

        if not MODEL_URL:
            print("[neurofit] MODEL_URL not set; cannot download model. Continuing...")
            return

        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        print(f"[neurofit] Downloading model from {MODEL_URL} -> {MODEL_PATH}")

        headers = {}
        if MODEL_AUTH_HEADER:
            headers["Authorization"] = MODEL_AUTH_HEADER

        resp = requests.get(MODEL_URL, stream=True, headers=headers, timeout=60)
        resp.raise_for_status()

        with open(MODEL_PATH, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

        print("[neurofit] Model download complete.")
    except Exception as e:
        print(f"[neurofit] ERROR: Failed to download model: {e}")
        raise

# Trigger model download BEFORE model load occurs
_download_model_if_missing()
# --- END: download model on startup ---

# Global state
_fatigue_model = None
_model_manifest = None

def _load_model_and_manifest():
    """
    Load and validate model + manifest on startup.
    Raises RuntimeError if validation fails.
    """
    global _fatigue_model, _model_manifest
    
    if MODEL_FILE is None:
        print("Model file not found. Using heuristic.")
        return
    
    if not MODEL_FILE.exists():
        print(f"Model file not found at {MODEL_FILE}. Using heuristic.")
        return
    
    # Load manifest
    if MANIFEST_FILE is None or not MANIFEST_FILE.exists():
        raise RuntimeError(
            f"Model manifest not found at {MANIFEST_FILE}. "
            "Model requires manifest for validation."
        )
    
    try:
        with open(MANIFEST_FILE, "r") as f:
            _model_manifest = json.load(f)
        print(f"Loaded manifest from {MANIFEST_FILE}")
    except Exception as e:
        raise RuntimeError(f"Failed to load manifest: {e}")
    
    # Load model
    try:
        _fatigue_model = joblib.load(MODEL_FILE)
        print(f"Loaded model from {MODEL_FILE}")
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {e}")
    
    # Validate model structure
    if not isinstance(_fatigue_model, dict):
        raise RuntimeError("Model must be a dict with 'model' and 'feature_names' keys")
    
    if "model" not in _fatigue_model:
        raise RuntimeError("Model dict missing 'model' key")
    
    if "feature_names" not in _fatigue_model:
        raise RuntimeError("Model dict missing 'feature_names' key")
    
    clf = _fatigue_model["model"]
    feature_names = _fatigue_model["feature_names"]
    
    # Validate feature count
    if not hasattr(clf, "n_features_in_"):
        raise RuntimeError("Model does not have n_features_in_ attribute")
    
    if clf.n_features_in_ != len(feature_names):
        raise RuntimeError(
            f"Feature count mismatch: model expects {clf.n_features_in_} features, "
            f"but feature_names has {len(feature_names)}"
        )
    
    # Validate manifest versions
    manifest_numpy = _model_manifest.get("numpy_version")
    manifest_sklearn = _model_manifest.get("sklearn_version")
    runtime_numpy = np.__version__
    runtime_sklearn = sklearn.__version__
    
    if manifest_numpy != runtime_numpy:
        raise RuntimeError(
            f"NumPy version mismatch: manifest={manifest_numpy}, runtime={runtime_numpy}"
        )
    
    if manifest_sklearn != runtime_sklearn:
        raise RuntimeError(
            f"sklearn version mismatch: manifest={manifest_sklearn}, runtime={runtime_sklearn}"
        )
    
    # Validate manifest feature names match
    manifest_features = _model_manifest.get("feature_names", [])
    if manifest_features != feature_names:
        raise RuntimeError(
            f"Feature names mismatch: manifest={manifest_features}, model={feature_names}"
        )
    
    print("✅ Model and manifest validation passed")

@app.on_event("startup")
async def startup_load_model():
    """Load and validate model on FastAPI startup"""
    try:
        _load_model_and_manifest()
    except RuntimeError as e:
        print(f"❌ Model validation failed: {e}")
        print("Falling back to heuristic scoring")
        _fatigue_model = None
        _model_manifest = None
# ----------------------------
# Feature extraction helpers
# ----------------------------

def extract_features(session: SessionData) -> np.ndarray:
    """
    Extract features from session data for model prediction.
    Returns feature array suitable for sklearn model predict_proba.
    Feature vector order (matches training): [sleep_hours, energy_level, stress_level, avg_key_latency_ms, total_duration_ms, backspace_rate, reaction_time_ms, reaction_attempted]
    """
    answers_list = session.normalized_answers()
    
    # Extract individual question answers (matching training feature set)
    def get_answer_value(question_id: str) -> float:
        for answer in answers_list:
            if answer.question_id == question_id:
                return float(answer.value)
        return 0.0
    
    sleep_hours = get_answer_value("sleep_hours")
    energy_level = get_answer_value("energy_level")
    stress_level = get_answer_value("stress_level")

    # Typing features - use avg_key_latency_ms or fallback to average_latency_ms
    avg_key_latency_ms = float(session.typing_features.average_latency_ms or 0.0)
    total_duration_ms = float(session.typing_features.total_duration_ms or 0.0)
    backspace_rate = float(session.typing_features.backspace_rate or 0.0)

    reaction_time_ms = float(session.task_performance.reaction_time_ms or 0.0)
    reaction_attempted = 1 if bool(session.task_performance.reaction_attempted) else 0

    features = np.array([[sleep_hours, energy_level, stress_level, avg_key_latency_ms, total_duration_ms, backspace_rate, reaction_time_ms, reaction_attempted]])
    return features

def extract_raw_features(session: SessionData) -> Dict[str, Any]:
    answers_list = session.normalized_answers()
    answers_vals = [float(a.value) for a in answers_list] if answers_list else []
    answers_mean = float(sum(answers_vals) / len(answers_vals)) if answers_vals else 0.0
    return {
        "answers_mean": answers_mean,
        "answers_count": len(answers_vals),
        "avg_latency": float(session.typing_features.average_latency_ms or 0.0),
        "total_duration": float(session.typing_features.total_duration_ms or 0.0),
        "backspace_rate": float(session.typing_features.backspace_rate or 0.0),
        "reaction_time": float(session.task_performance.reaction_time_ms or 0.0),
        "reaction_attempted": bool(session.task_performance.reaction_attempted)
    }

# ----------------------------
# Prediction logic
# ----------------------------

def predict_fatigue_heuristic(session: SessionData) -> float:
    """
    Deterministic heuristic fatigue score calculation (0-100).
    """
    raw = extract_raw_features(session)
    sleep_hours = raw.get("answers_mean", 7.0)  # if your answers_mean actually encodes sleep_hours, adapt later
    # The heuristic below preserves the original spirit but uses normalized features.
    # NOTE: For now we assume questionnaire maps such that answers_mean is meaningful.
    # Use convert_sessions_to_csv/training to create a model for real use.
    activity_level = 10 - raw.get("answers_mean", 5.0)  # fallback behavior

    score = 0.0
    # Sleep factor (approx)
    if sleep_hours < 7:
        score += (7 - sleep_hours) * 8
    elif sleep_hours > 9:
        score += (sleep_hours - 9) * 3

    score += activity_level * 4
    # typing latency penalty (ms -> units)
    latency_penalty = min(raw["avg_latency"] / 50.0, 20.0)
    score += latency_penalty
    # reaction penalty
    reaction_penalty = min(raw["reaction_time"] / 30.0, 20.0)
    score += reaction_penalty

    return max(0, min(100, score))

def predict_fatigue_ml(session: SessionData) -> float:
    """
    Predict fatigue using loaded ML model. Returns 0-100.
    """
    if _fatigue_model is None:
        raise ValueError("ML model not loaded")

    features = extract_features(session)
    # Determine clf object if artifact was a dict
    if isinstance(_fatigue_model, dict) and "model" in _fatigue_model:
        clf = _fatigue_model["model"]
    else:
        clf = _fatigue_model

    try:
        if hasattr(clf, "predict_proba"):
            proba = clf.predict_proba(features)[0]
            # use probability of positive class if present
            if len(proba) >= 2:
                fatigue_score = float(proba[1]) * 100.0
            else:
                fatigue_score = float(proba[0]) * 100.0
        else:
            pred = clf.predict(features)[0]
            fatigue_score = float(pred)
            if fatigue_score < 0:
                fatigue_score = 0.0
            if fatigue_score > 100:
                fatigue_score = 100.0
        return fatigue_score
    except Exception as e:
        # Bubble up with helpful message
        print("Error during ML prediction:", e)
        raise

def get_risk_level(score: float) -> str:
    if score < 30:
        return "low"
    elif score < 60:
        return "medium"
    else:
        return "high"

def get_recommendations(score: float, session: SessionData) -> List[str]:
    recommendations: List[str] = []
    if score >= 60:
        recommendations.append("High fatigue detected - consider taking a rest day")
        recommendations.append("Prioritize recovery and hydration")
    elif score >= 30:
        recommendations.append("Moderate fatigue - consider reducing workout intensity")
        recommendations.append("Ensure adequate sleep and nutrition")
    else:
        recommendations.append("Low fatigue levels - you're well recovered")

    # Check sleep-like metric and other cues
    raw = extract_raw_features(session)
    if raw.get("answers_mean", 7.0) < 7:
        recommendations.append("Aim for 7-9 hours of sleep for optimal recovery")
    if raw.get("avg_latency", 0.0) > 200:
        recommendations.append("Elevated typing latency detected - monitor your cognitive load")
    if raw.get("reaction_time", 0.0) > 400:
        recommendations.append("Slower reaction times observed - ensure adequate rest")

    return recommendations

# ----------------------------
# Endpoints
# ----------------------------

@app.get("/")
async def root():
    """Root endpoint"""
    model_status = "loaded" if _fatigue_model is not None else "heuristic"
    return {
        "message": "Welcome to NeuroFit+ API",
        "version": "1.0.0",
        "model_status": model_status,
        "endpoints": {
            "predict_fatigue": "POST /predict_fatigue",
            "save_session": "POST /save_session"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": _fatigue_model is not None
    }

@app.get("/model/features")
async def model_features():
    """Get information about model features"""
    if _fatigue_model is None:
        return {
            "model_loaded": False,
            "message": "Model not loaded - using heuristic",
            "expected_features": [
                "sleep_hours",
                "energy_level",
                "stress_level",
                "avg_key_latency_ms",
                "total_duration_ms",
                "backspace_rate",
                "reaction_time_ms",
                "reaction_attempted"
            ],
            "expected_feature_count": 8
        }
    
    # Get feature names if available
    feature_names = None
    if isinstance(_fatigue_model, dict) and "feature_names" in _fatigue_model:
        feature_names = _fatigue_model["feature_names"]
    
    # Get model type
    if isinstance(_fatigue_model, dict) and "model" in _fatigue_model:
        clf = _fatigue_model["model"]
    else:
        clf = _fatigue_model
    
    return {
        "model_loaded": True,
        "model_type": type(clf).__name__,
        "feature_names": feature_names,
        "expected_feature_count": clf.n_features_in_ if hasattr(clf, "n_features_in_") else None,
        "expected_features": [
            "sleep_hours",
            "energy_level",
            "stress_level",
            "avg_key_latency_ms",
            "total_duration_ms",
            "backspace_rate",
            "reaction_time_ms",
            "reaction_attempted"
        ]
    }

@app.get("/model/manifest")
async def model_manifest():
    """Get the model manifest JSON"""
    if _model_manifest is None:
        raise HTTPException(
            status_code=404,
            detail="Model manifest not available. Model may not be loaded."
        )
    return _model_manifest

@app.post("/predict_fatigue", response_model=FatiguePredictionResponse)
async def predict_fatigue(session: SessionData):
    """
    Predict fatigue level based on session data.
    Uses ML model if available, otherwise falls back to heuristic scoring.
    """
    try:
        if _fatigue_model is not None:
            fatigue_score = predict_fatigue_ml(session)
            model_used = "ml_model"
        else:
            fatigue_score = predict_fatigue_heuristic(session)
            model_used = "heuristic"

        risk_level = get_risk_level(fatigue_score)
        recommendations = get_recommendations(fatigue_score, session)

        response = FatiguePredictionResponse(
            fatigue_score=round(float(fatigue_score), 2),
            risk_level=risk_level,
            recommendations=recommendations,
            timestamp=datetime.now().isoformat(),
            model_used=model_used
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/save_session")
async def save_session(session: SessionData):
    """
    Save session data to JSONL file.
    """
    try:
        session_dict = session.model_dump()
        # Optionally, only keep non-PII fields (here we keep the whole session)
        with open(SESSIONS_FILE, "a", encoding="utf-8") as f:
            json.dump(session_dict, f, ensure_ascii=False)
            f.write("\n")
        return {
            "status": "saved",
            "timestamp": datetime.now().isoformat(),
            "file": str(SESSIONS_FILE)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save error: {str(e)}")

# ----------------------------
# Run
# ----------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
        