from __future__ import annotations

import logging
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from dataclasses import dataclass

import sklearn
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# Logging
# ============================================================

logger = logging.getLogger("neurofit")
logging.basicConfig(level=logging.INFO)

def log_prediction(payload: dict):
    try:
        logger.info(json.dumps(payload))
    except Exception:
        pass

# ============================================================
# Model loading
# ============================================================

MODEL_VERSION = "v2.0-ml-primary-reaction-53pct"

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_FILE = MODEL_DIR / "ml_model.joblib"

_ml_model = None

if not MODEL_FILE.exists():
    raise RuntimeError("ML model file not found at expected path.")

try:
    import joblib

    model_data = joblib.load(MODEL_FILE)

    if isinstance(model_data, dict):
        _ml_model = model_data.get("model")
        logger.info("Loaded ML model from dict structure")
    else:
        _ml_model = model_data
        logger.info("Loaded ML model directly")

    logger.info(f"MODEL TYPE: {type(_ml_model)}")

except Exception as e:
    logger.warning("Could not load ML model: %s", e)

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
    reaction_lapses: int = 0

# ============================================================
# Request schemas
# ============================================================

class TypingModel(BaseModel):
    average_latency_ms: float
    total_duration_ms: float
    backspace_rate: float

class TaskPerfModel(BaseModel):
    reaction_time_ms: Optional[float]
    reaction_lapses: int = 0

class PredictRequest(BaseModel):
    timestamp: str
    answers: Any
    typing_features: TypingModel
    task_performance: TaskPerfModel

# ============================================================
# FastAPI app
# ============================================================

app = FastAPI(title="NeuroFit+")

@app.on_event("startup")
async def startup_event():
    logger.info("--- FASTAPI STARTUP ---")
    logger.info(f"Model Version: {MODEL_VERSION}")
    logger.info(f"Model Path: {MODEL_FILE}")
    logger.info(f"sklearn Version: {sklearn.__version__}")
    success = _ml_model is not None
    logger.info(f"Model loaded successfully: {success}")
    logger.info("-----------------------")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": bool(_ml_model)}

# ============================================================
# Prediction endpoint
# ============================================================

@app.post("/predict_fatigue")
def predict_fatigue(req: PredictRequest):

    logger.error("RAW REQUEST task_performance = %s", req.task_performance.dict())

    tp = TaskPerformance(**req.task_performance.dict())
    td = TypingFeatures(**req.typing_features.dict())

    # ========================================================
    # ML MODEL PREDICTION (PRIMARY METHOD)
    # ========================================================

    if _ml_model is not None:
        try:
            answers = req.answers if isinstance(req.answers, dict) else {}

            sleep = float(answers.get("sleep_hours", 0.0))
            energy = float(answers.get("energy_level", 0.0))
            stress = float(answers.get("stress_level", 0.0))

            # Reaction features
            reaction_time = float(tp.reaction_time_ms) if tp.reaction_time_ms else 0.0
            reaction_attempted = 1 if (tp.reaction_time_ms and tp.reaction_time_ms > 0) else 0

            # Feature vector
            X = np.array([[sleep, energy, stress, reaction_time, reaction_attempted]], dtype=float)

            # ====================================================
            # 🔥 HYBRID FATIGUE COMPUTATION (ML + NORMALIZATION)
            # ====================================================

            # Step 1: ML probability
            proba = _ml_model.predict_proba(X)[0][1]

            # Step 2: Reaction-time normalization
            rt = reaction_time if reaction_time > 0 else 400

            normalized_rt = (rt - 300) / 400
            normalized_rt = max(0.0, min(1.0, normalized_rt))

            # Step 3: Combine ML + rule-based smoothing
            fatigue = 0.6 * float(proba) + 0.4 * normalized_rt

            # Step 4: Add lapse effect
            fatigue += min(0.15, tp.reaction_lapses * 0.05)

            # Step 5: Final clamp + rounding
            fatigue = round(min(1.0, max(0.0, fatigue)), 2)

            # ====================================================
            # Risk mapping
            # ====================================================

            if fatigue < 0.4:
                risk = "low"
            elif fatigue < 0.7:
                risk = "moderate"
            else:
                risk = "high"

            log_prediction({
                "ts": datetime.utcnow().isoformat(),
                "fatigue_score": fatigue,
                "risk_level": risk,
                "model_used": "ml_model",
                "model_version": MODEL_VERSION
            })

            return {
                "fatigue_score": fatigue,
                "risk_level": risk,
                "model_used": "ml_model",
                "model_version": MODEL_VERSION
            }

        except Exception as e:
            logger.exception("ML failed: %s", e)

    # ========================================================
    # FALLBACK
    # ========================================================

    return {
        "fatigue_score": 0.5,
        "risk_level": "moderate",
        "model_used": "fallback",
        "model_version": MODEL_VERSION
    }