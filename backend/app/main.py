from __future__ import annotations

import logging
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from dataclasses import dataclass, field

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

# ============================================================
# Logging (stdout only — Render safe)
# ============================================================

logger = logging.getLogger("neurofit")
logging.basicConfig(level=logging.INFO)

def log_prediction(payload: dict):
    """
    Log one prediction as JSON to stdout.
    Render captures this automatically.
    """
    try:
        logger.info(json.dumps(payload))
    except Exception:
        pass


# ============================================================
# Model loading (bundled, read-only)
# ============================================================

MODEL_VERSION = "v1.0-synthetic"

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_FILE = MODEL_DIR / "ml_model.joblib"

_ml_model = None
try:
    if MODEL_FILE.exists():
        import joblib
        _ml_model = joblib.load(MODEL_FILE)
except Exception as e:
    logger.warning("Could not load ML model: %s", e)


# ============================================================
# Feature order (MUST match training)
# ============================================================

FEATURE_ORDER = [
    "sleep_hours",
    "energy_level",
    "stress_level",
    "avg_key_latency_ms",
    "total_duration_ms",
    "backspace_rate",
    "reaction_time_ms",
    "reaction_attempted",
]


# ============================================================
# Data structures
# ============================================================

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
    answers: Any
    typing_features: TypingFeatures = field(default_factory=TypingFeatures)
    task_performance: TaskPerformance = field(default_factory=TaskPerformance)


# ============================================================
# Feature extraction
# ============================================================

def answers_to_map(answers: Any) -> dict:
    if isinstance(answers, dict):
        return answers

    out = {}
    if isinstance(answers, list):
        for item in answers:
            if isinstance(item, dict):
                k = item.get("question_id")
                v = item.get("value")
                if k is not None:
                    out[k] = v
    return out


def extract_features(session: SessionData) -> list[float]:
    ans = answers_to_map(session.answers or {})

    f = []
    f.append(float(ans.get("sleep_hours", 0.0)))
    f.append(float(ans.get("energy_level", 0.0)))
    f.append(float(ans.get("stress_level", 0.0)))

    tf = session.typing_features
    f.append(float(tf.average_latency_ms))
    f.append(float(tf.total_duration_ms))
    f.append(float(tf.backspace_rate))

    tp = session.task_performance
    f.append(float(tp.reaction_time_ms or 0.0))
    f.append(1.0 if tp.reaction_attempted else 0.0)

    return f


# ============================================================
# FastAPI app
# ============================================================

app = FastAPI(title="NeuroFit+")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten for prod if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = Path(__file__).resolve().parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# ============================================================
# Health & meta endpoints
# ============================================================

@app.get("/")
def root():
    return {
        "message": "NeuroFit+ root",
        "model_status": {
            "loaded": bool(_ml_model),
            "path": str(MODEL_FILE),
            "version": MODEL_VERSION
        },
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": bool(_ml_model)
    }

@app.get("/model/features")
def model_features():
    return {
        "features": FEATURE_ORDER,
        "expected_features": len(FEATURE_ORDER),
        "model_loaded": bool(_ml_model),
    }


# ============================================================
# Request schemas
# ============================================================

class TypingModel(BaseModel):
    average_latency_ms: float
    total_duration_ms: float
    backspace_rate: float

class TaskPerfModel(BaseModel):
    reaction_time_ms: Optional[float]
    reaction_attempted: bool

class PredictRequest(BaseModel):
    timestamp: str
    answers: Any
    typing_features: TypingModel
    task_performance: TaskPerfModel


# ============================================================
# Prediction endpoint (LOCKED)
# ============================================================

@app.post("/predict_fatigue")
def predict_fatigue(req: PredictRequest):
    """
    Production-safe prediction endpoint.

    - ML inference only (no training)
    - Normalized output [0,1]
    - Deterministic risk mapping
    - Heuristic fallback
    - Logs every prediction
    """

    td = TypingFeatures(**req.typing_features.dict())
    tp = TaskPerformance(**req.task_performance.dict())

    session = SessionData(
        timestamp=req.timestamp,
        answers=req.answers,
        typing_features=td,
        task_performance=tp,
    )

    features = extract_features(session)

    def heuristic_score(f):
        sleep = f[0]
        stress = f[2]
        latency = f[3]
        score = (
            (1.0 - sleep / 9.0) * 0.6 +
            (stress / 10.0) * 0.3 +
            (latency / 1000.0) * 0.1
        )
        return max(0.0, min(1.0, score))

    # ---------------- ML PATH ----------------
    if _ml_model is not None:
        try:
            X = np.array([features], dtype=float)
            pred = float(_ml_model.predict(X)[0])
            fatigue_score = max(0.0, min(1.0, pred))

            risk = "high" if fatigue_score > 0.5 else "low"
            recs = ["rest"] if risk == "high" else ["keep going"]

            log_prediction({
                "ts": datetime.utcnow().isoformat(),
                "features": features,
                "fatigue_score": fatigue_score,
                "risk_level": risk,
                "model_used": "ml_model",
                "model_version": MODEL_VERSION
            })

            return {
                "fatigue_score": fatigue_score,
                "risk_level": risk,
                "recommendations": recs,
                "model_used": "ml_model",
                "model_type": "regressor",
                "model_version": MODEL_VERSION
            }

        except Exception as e:
            logger.exception("ML failed, falling back to heuristic: %s", e)

    # ---------------- FALLBACK ----------------
    score = heuristic_score(features)
    risk = "high" if score > 0.5 else "low"

    log_prediction({
        "ts": datetime.utcnow().isoformat(),
        "features": features,
        "fatigue_score": score,
        "risk_level": risk,
        "model_used": "heuristic",
        "model_version": MODEL_VERSION
    })

    return {
        "fatigue_score": score,
        "risk_level": risk,
        "recommendations": ["rest"] if risk == "high" else ["keep going"],
        "model_used": "heuristic",
        "model_type": "heuristic",
        "model_version": MODEL_VERSION
    }
