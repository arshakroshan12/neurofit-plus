"""
Train a synthetic-data baseline fatigue model and save it to backend/models/ml_model.joblib.

Usage:
  python scripts/train_synthetic_model.py --n 5000 --seed 42

Outputs:
  - backend/models/ml_model.joblib
  - backend/models/model_metadata.json
  - optionally prints evaluation metrics to stdout
"""
import json
from pathlib import Path
import argparse
import numpy as np
import pandas as pd

# sklearn
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, roc_auc_score
import joblib

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

def clamp(a, lo, hi):
    return max(lo, min(hi, a))

def generate_sample(rng):
    """
    Generate one synthetic session sample.
    Returns dict matching features.
    """
    # sleep: typical 4-9 with tails
    sleep = clamp(rng.normal(6.5, 1.6), 0.0, 12.0)

    # energy correlates with sleep + noise
    energy = clamp( (sleep / 12.0) * 10.0 + rng.normal(0,1.2), 0.0, 10.0 )

    # stress inversely correlated with sleep and energy
    stress = clamp( max(0.0, 10.0 - (sleep/12.0)*8.0 + rng.normal(0,1.8)), 0.0, 10.0 )

    # typing latency: better (lower) when rested, but with noise
    avg_latency = clamp( rng.normal(150 + (7.5 - sleep)*15, 40), 20, 2000 )  # ms

    # total typing duration (ms) roughly related to task complexity
    total_dur = clamp( rng.normal(2000 + rng.normal(0,600), 500), 200, 20000 )

    # backspace rate: small fraction
    backspace_rate = clamp( rng.beta(1.2, 30.0) , 0.0, 1.0 )

    # reaction time: slower when fatigued / stressed
    reaction_time = clamp( rng.normal(300 + (7.0 - sleep)*35 + stress*8, 80), 100, 3000 )

    # reaction attempted: sometimes user didn't do the test
    reaction_attempted = bool(rng.random() > 0.08)

    # Construct sample
    return {
        "sleep_hours": float(sleep),
        "energy_level": float(energy),
        "stress_level": float(stress),
        "avg_key_latency_ms": float(avg_latency),
        "total_duration_ms": float(total_dur),
        "backspace_rate": float(backspace_rate),
        "reaction_time_ms": float(reaction_time) if reaction_attempted else 0.0,
        "reaction_attempted": 1.0 if reaction_attempted else 0.0,
    }

def compute_ground_truth(sample):
    """
    Create a continuous fatigue score in [0,1].
    Heuristic combining features — used as 'label' for synthetic training.
    Lower sleep, higher stress, slower typing & reaction => higher fatigue.
    """
    # Normalize / scale terms to roughly comparable ranges
    sleep_term = 1.0 - (sample["sleep_hours"] / 9.0)          # 0 when 9h, >0 when less
    stress_term = sample["stress_level"] / 10.0              # 0..1
    latency_term = sample["avg_key_latency_ms"] / 1000.0     # e.g., 0.15 for 150ms
    reaction_term = (sample["reaction_time_ms"] / 2000.0) if sample["reaction_attempted"] else 0.7

    # Weighted sum (these weights define how the synthetic label behaves)
    score = 0.55 * sleep_term + 0.25 * stress_term + 0.12 * latency_term + 0.08 * reaction_term

    # add a bit of noise and clamp
    score = score + np.random.normal(0, 0.03)
    score = float(max(0.0, min(1.0, score)))
    return score

def build_dataset(n=2000, seed=42):
    rng = np.random.default_rng(seed)
    rows = []
    for _ in range(n):
        s = generate_sample(rng)
        label = compute_ground_truth(s)
        s["fatigue_score"] = label
        rows.append(s)
    df = pd.DataFrame(rows)
    return df

def train_and_save(df, out_dir: Path, random_seed=42):
    X = df[FEATURE_ORDER].values
    y = df["fatigue_score"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.18, random_state=random_seed)

    # regressor baseline
    model = GradientBoostingRegressor(n_estimators=150, learning_rate=0.08, max_depth=4, random_state=random_seed)

    model.fit(X_train, y_train)

    # eval
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    # also compute AUC by thresholding at 0.5 (for convenience)
    try:
        auc = roc_auc_score((y_test > 0.5).astype(int), y_pred)
    except Exception:
        auc = None

    # save model + metadata
    out_dir.mkdir(parents=True, exist_ok=True)
    model_file = out_dir / "ml_model.joblib"
    joblib.dump(model, model_file)

    meta = {
        "feature_order": FEATURE_ORDER,
        "model_type": "GradientBoostingRegressor",
        "n_features": len(FEATURE_ORDER),
        "mse": mse,
        "r2": r2,
        "auc_at_0.5": auc,
        "notes": "Synthetic-data baseline. Replace with real data and retrain for production."
    }
    with open(out_dir / "model_metadata.json", "w") as f:
        json.dump(meta, f, indent=2)

    return model_file, meta

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--n", type=int, default=3000, help="Number of synthetic samples to generate")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--out", type=str, default="backend/models", help="Output model directory")
    args = p.parse_args()

    out_dir = Path(args.out)
    print("Generating synthetic dataset (n=%d, seed=%d)..." % (args.n, args.seed))
    df = build_dataset(n=args.n, seed=args.seed)
    print("Sample rows:")
    print(df.head().to_dict(orient="records")[:3])
    print("Training model...")
    model_file, meta = train_and_save(df, out_dir, random_seed=args.seed)
    print("Saved model to:", model_file)
    print("Metadata:")
    print(json.dumps(meta, indent=2))
    print("Done.")
