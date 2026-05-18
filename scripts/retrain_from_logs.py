import json
from pathlib import Path
from datetime import datetime

import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingRegressor

# ---------- CONFIG ----------
LOG_FILE = Path("backend/data/predictions.log")
MODEL_DIR = Path("backend/models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "ml_model.joblib"
META_PATH = MODEL_DIR / "model_metadata.json"

MIN_SAMPLES = 20   # minimum logs needed to retrain
# ----------------------------


def load_logs():
    X, y = [], []

    if not LOG_FILE.exists():
        raise FileNotFoundError("predictions.log not found")

    with open(LOG_FILE, "r") as f:
        for line in f:
            try:
                row = json.loads(line)
                X.append(row["features"])
                y.append(row["fatigue_score"])
            except Exception:
                continue

    return np.array(X, dtype=float), np.array(y, dtype=float)


def retrain():
    X, y = load_logs()

    if len(X) < MIN_SAMPLES:
        raise ValueError(
            f"Not enough samples to retrain (found {len(X)}, need {MIN_SAMPLES})"
        )

    print(f"🔁 Retraining model on {len(X)} samples")

    model = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=3,
        random_state=42,
    )

    model.fit(X, y)

    joblib.dump(model, MODEL_PATH)

    metadata = {
        "version": "v2-from-logs",
        "trained_on": len(X),
        "trained_at": datetime.utcnow().isoformat(),
        "model_type": "GradientBoostingRegressor",
        "features": [
            "sleep_hours",
            "energy_level",
            "stress_level",
            "avg_key_latency_ms",
            "total_duration_ms",
            "backspace_rate",
            "reaction_time_ms",
            "reaction_attempted",
        ],
    }

    with open(META_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    print("✅ Retraining complete")
    print(f"📦 Model saved to: {MODEL_PATH}")
    print(f"📝 Metadata saved to: {META_PATH}")


if __name__ == "__main__":
    retrain()
