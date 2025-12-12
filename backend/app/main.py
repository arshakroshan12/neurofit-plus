"""
NeuroFit+ test-compatible app — corrected feature vector and model loading.
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass, field
import joblib
import numpy as np
from datetime import datetime, timezone
from fastapi import FastAPI
from pydantic import BaseModel

# --- model dir: prefer repo-local backend/models (tests expect this) ---
repo_models = Path(__file__).resolve().parent.parent / "models"
if not repo_models.exists():
    try:
        repo_models.mkdir(parents=True, exist_ok=True)
    except Exception:
        # best-effort; don't fail import
        pass
_MODEL_DIR = repo_models
_MODEL_FILE = _MODEL_DIR / "ml_model.joblib"

_ml_model = None
if _MODEL_FILE.exists():
    try:
        _ml_model = joblib.load(_MODEL_FILE)
    except Exception:
        _ml_model = None

def _model_exists() -> bool:
    return _MODEL_FILE.exists()

# Data classes with defaults matching tests
@dataclass
class TypingFeatures:
    average_latency_ms: float = 0.0
    total_duration_ms: float = 0.0
    backspace_rate: float = 0.0

@dataclass
class TaskPerformance:
    reaction_time_ms: Optional[float] = None
    reaction_attempted: bool = False

@dataclass
class SessionData:
    timestamp: str
    answers: Union[List[Dict[str, Any]], Dict[str, float]] = field(default_factory=list)
    typing_features: TypingFeatures = field(default_factory=TypingFeatures)
    task_performance: TaskPerformance = field(default_factory=TaskPerformance)

# Feature order expected by tests (8 features). Last feature is reaction_attempted (0/1)
_FEATURE_ORDER = [
    "sleep_hours",
    "energy_level",
    "stress_level",
    "avg_latency",
    "total_typing_ms",
    "backspace_rate",
    "reaction_time_ms",
    "reaction_attempted",
]

def _normalize_answers(answers: Union[List[Dict[str, Any]], Dict[str, float]]) -> Dict[str, float]:
    """Normalize answers into a question_id -> float map. Defaults won't be applied here."""
    if isinstance(answers, dict):
        return {k: float(v) for k, v in answers.items()}
    out = {}
    for a in answers:
        if isinstance(a, dict):
            q = a.get("question_id")
            v = a.get("value")
            if q is not None:
                try:
                    out[q] = float(v)
                except Exception:
                    out[q] = 0.0
        else:
            try:
                q = getattr(a, "question_id", None)
                v = getattr(a, "value", None)
                if q is not None:
                    out[q] = float(v)
            except Exception:
                continue
    return out

def extract_features(session: SessionData) -> np.ndarray:
    """
    Produce numpy array shaped (1, len(_FEATURE_ORDER)).
    Default values are 0.0 (tests expect zeros for missing answers).
    reaction_attempted is 1.0 if True else 0.0.
    """
    ans_map = _normalize_answers(session.answers)
    # defaults are 0.0 (tests expect minimal/defaults to be zero)
    sleep = float(ans_map.get("sleep_hours", 0.0))
    energy = float(ans_map.get("energy_level", 0.0))
    stress = float(ans_map.get("stress_level", 0.0))
    avg_latency = float(session.typing_features.average_latency_ms or 0.0)
    total_typing = float(session.typing_features.total_duration_ms or 0.0)
    backspace = float(session.typing_features.backspace_rate or 0.0)
    reaction = float(session.task_performance.reaction_time_ms or 0.0)
    reaction_attempted = 1.0 if bool(session.task_performance.reaction_attempted) else 0.0
    vals = [sleep, energy, stress, avg_latency, total_typing, backspace, reaction, reaction_attempted]
    return np.array([vals], dtype=float)

# FastAPI app
app = FastAPI(title="NeuroFit+ Test App")

@app.get("/")
def root():
    return {
        "message": "NeuroFit+ root",
        "endpoints": ["/", "/health", "/model/features", "/predict_fatigue"],
        "model_status": {"loaded": bool(_ml_model), "path": str(_MODEL_FILE)},
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_loaded": bool(_ml_model),
    }

@app.get("/model/features")
def model_features():
    # include both 'features' and 'expected_features' keys to satisfy tests
    return {
        "features": _FEATURE_ORDER,
        "expected_features": _FEATURE_ORDER,
        "model_loaded": bool(_ml_model),
    }

# Pydantic models
class AnswerModel(BaseModel):
    question_id: str
    value: float

class TypingModel(BaseModel):
    average_latency_ms: float = 0.0
    total_duration_ms: float = 0.0
    backspace_rate: float = 0.0

class TaskPerfModel(BaseModel):
    reaction_time_ms: Optional[float] = None
    reaction_attempted: bool = False

class PredictRequest(BaseModel):
    timestamp: str
    answers: Union[List[AnswerModel], Dict[str, float]]
    typing_features: TypingModel
    task_performance: TaskPerfModel

@app.post("/predict_fatigue")
def predict_fatigue(req: PredictRequest):
    # Normalize answers both into dict and list formats
    answers_in = req.answers
    if isinstance(answers_in, dict):
        answers_map = {k: float(v) for k, v in answers_in.items()}
        answers_list = [{"question_id": k, "value": v} for k, v in answers_map.items()]
    else:
        answers_list = [a.dict() for a in answers_in]
        answers_map = _normalize_answers(answers_list)

    session = SessionData(
        timestamp=req.timestamp,
        answers=answers_list,
        typing_features=TypingFeatures(
            average_latency_ms=req.typing_features.average_latency_ms,
            total_duration_ms=req.typing_features.total_duration_ms,
            backspace_rate=req.typing_features.backspace_rate,
        ),
        task_performance=TaskPerformance(
            reaction_time_ms=req.task_performance.reaction_time_ms,
            reaction_attempted=req.task_performance.reaction_attempted,
        ),
    )

    X = extract_features(session)  # shape (1,8)

    # ML model path: prefer repository file we created earlier
    if _ml_model is not None:
        try:
            if hasattr(_ml_model, "predict_proba"):
                probs = _ml_model.predict_proba(X.tolist())
                score = float(probs[0][-1]) if probs and len(probs[0]) > 0 else 0.0
            else:
                pred = _ml_model.predict(X.tolist())
                score = float(pred[0]) if pred else 0.0
            return {
                "fatigue_score": float(score),
                "risk_level": "low" if score < 0.5 else "high",
                "recommendations": ["rest" if score > 0.5 else "keep going"],
                "model_used": "ml_model",
            }
        except Exception:
            # fall through to heuristic fallback
            pass

    # Heuristic fallback (if ML model failed)
    sleep = X[0, 0]
    stress = X[0, 2]
    latency = X[0, 3]
    score = max(0.0, min(1.0, (1.0 - (sleep / 9.0)) * 0.6 + (stress / 10.0) * 0.3 + (latency / 1000.0) * 0.1))
    return {
        "fatigue_score": float(score),
        "risk_level": "low" if score < 0.5 else "high",
        "recommendations": ["rest" if score > 0.5 else "keep going"],
        "model_used": "heuristic",
    }

# helper for tests
def get_feature_order() -> List[str]:
    return _FEATURE_ORDER
