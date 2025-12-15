"""
Retrain fatigue model from prediction logs.

Reads:
  backend/data/predictions.log (JSONL)

Writes:
  backend/models/ml_model.joblib
  backend/models/model_metadata.json
"""

import json
from pathlib import Path
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

LOG_FILE = Path("backend/data/predictions.log")
MODEL_DIR = Path("backend/models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

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

def load_dataset():
    if not LOG_FILE.exists():
        raise RuntimeError("No prediction log found. Cannot retrain.")

    X, y = [], []

    with open(LOG_FILE, "r") as f:
        for line in f:
            try:
                row = json.loads(line)
                features = row.get("features")
                score = row.get("fatigue_score")

                if features is None or score is None:
                    continue

                if len(features) != len(FEATURE_ORDER):
                    continue

                X.append(features)
                y.append(score)
            except Exception:
                continue

    if len(X) < 20:
        raise RuntimeError("Not enough data to retrain (need at least ~20 samples)")

    return np.array(X, dtype=float), np.array(y, dtype=float)

def main():
    print("Loading dataset from logs...")
    X, y = load_dataset()
    print(f"Loaded {len(X)} samples")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=4,
        random_state=42
    )

    print("Training model...")
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mse = mean_squared_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    joblib.dump(model, MODEL_DIR / "ml_model.joblib")

    metadata = {
        "trained_from": "predictions.log",
        "samples": int(len(X)),
        "mse": mse,
        "r2": r2,
        "model_type": "GradientBoostingRegressor"
    }

    with open(MODEL_DIR / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("✅ Retraining complete")
    print(json.dumps(metadata, indent=2))

if __name__ == "__main__":
    main()
