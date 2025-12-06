#!/usr/bin/env python3
"""
Verbose debug trainer for NeuroFit+
This prints environment info, CSV preview, and any exceptions so we can see why training is silent.
"""

import os
import sys
import traceback
import json
import hashlib
from datetime import datetime, timezone
import joblib

def safe_imports():
    try:
        import pandas as pd
        import numpy as np
        import sklearn
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
        return {
            "pd": pd, "np": np, "sklearn": sklearn,
            "RandomForestClassifier": RandomForestClassifier,
            "train_test_split": train_test_split,
            "accuracy_score": accuracy_score,
            "roc_auc_score": roc_auc_score,
            "classification_report": classification_report
        }
    except Exception as e:
        print("IMPORT ERROR:", e)
        traceback.print_exc()
        sys.exit(2)

libs = safe_imports()
pd = libs["pd"]
np = libs["np"]
RandomForestClassifier = libs["RandomForestClassifier"]
train_test_split = libs["train_test_split"]
accuracy_score = libs["accuracy_score"]
roc_auc_score = libs["roc_auc_score"]
classification_report = libs["classification_report"]

print("PYTHON executable:", sys.executable)
print("PYTHON version:", sys.version.replace('\\n',' '))
print("pandas version:", pd.__version__)
print("sklearn version:", libs["sklearn"].__version__)
print("joblib version:", joblib.__version__)
print("cwd:", os.getcwd())

# Determine paths (use backend/ as ROOT)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FEATURES_CSV = os.path.join(ROOT, "data", "processed", "features.csv")
MODEL_DIR = os.path.join(ROOT, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "fatigue_model.pkl")

print("Expecting FEATURES_CSV at:", FEATURES_CSV)
print("MODEL_PATH will be:", MODEL_PATH)
print("Exists FEATURES_CSV?", os.path.exists(FEATURES_CSV))
print("Exists MODEL_DIR?", os.path.exists(MODEL_DIR))
print("MODEL_DIR writable?", os.access(MODEL_DIR, os.W_OK))

def load_features(csv_path):
    print("Loading CSV:", csv_path)
    try:
        df = pd.read_csv(csv_path)
        print("CSV shape:", df.shape)
        print("CSV columns:", list(df.columns))
        print("CSV head:")
        print(df.head().to_string(index=False))
        return df
    except Exception as e:
        print("ERROR reading CSV:", e)
        traceback.print_exc()
        sys.exit(3)

def prepare_xy(df):
    print("Preparing X,y...")
    if "label" not in df.columns:
        print("ERROR: 'label' column not found in CSV - rows:", len(df))
        raise ValueError("CSV must contain 'label' column")
    y = df["label"].astype(int)
    X = df.drop(columns=["label"])
    for c in X.columns:
        if X[c].dtype == object:
            try:
                X[c] = pd.to_numeric(X[c])
            except Exception:
                X[c] = X[c].apply(lambda v: hash(str(v)) % 1000)
    print("Prepared X shape:", X.shape, "y shape:", y.shape)
    return X.values, y.values, list(X.columns)

def main():
    try:
        df = load_features(FEATURES_CSV)
        X, y, feature_names = prepare_xy(df)
        print("Unique labels:", np.unique(y))
        if len(y) < 4:
            print("Warning: very few samples (<4)")

        strat = y if len(np.unique(y)) > 1 else None
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=strat
        )
        print("Train size:", len(y_train), "Val size:", len(y_val))

        clf = RandomForestClassifier(n_estimators=100, random_state=42)
        print("Fitting classifier...")
        clf.fit(X_train, y_train)
        print("Fit complete.")

        if len(y_val) > 0:
            y_pred = clf.predict(X_val)
            y_prob = clf.predict_proba(X_val)[:, 1] if hasattr(clf, "predict_proba") else None
            print("Validation accuracy:", accuracy_score(y_val, y_pred))
            if y_prob is not None and len(np.unique(y_val)) > 1:
                print("Validation AUC:", roc_auc_score(y_val, y_prob))
            print("Classification report:\n", classification_report(y_val, y_pred))
        else:
            print("No validation set (too few rows).")

        os.makedirs(MODEL_DIR, exist_ok=True)
        print("Saving model to:", MODEL_PATH)
        joblib.dump({"model": clf, "feature_names": feature_names}, MODEL_PATH)
        print("Saved model successfully.")
        
        # Generate and save manifest
        MANIFEST_PATH = os.path.join(MODEL_DIR, "model_manifest.json")
        
        # Compute dataset hash if CSV exists
        dataset_hash = None
        if os.path.exists(FEATURES_CSV):
            with open(FEATURES_CSV, "rb") as f:
                dataset_hash = hashlib.sha256(f.read()).hexdigest()
        
        manifest = {
            "model_version": datetime.now(timezone.utc).isoformat(),
            "train_date": datetime.now(timezone.utc).isoformat(),
            "dataset_hash": dataset_hash,
            "numpy_version": np.__version__,
            "sklearn_version": libs["sklearn"].__version__,
            "feature_names": feature_names,
            "notes": "RandomForestClassifier trained on NeuroFit+ session data"
        }
        
        with open(MANIFEST_PATH, "w") as f:
            json.dump(manifest, f, indent=2)
        print(f"Saved manifest to: {MANIFEST_PATH}")
    except Exception as e:
        print("Unhandled exception during training:", e)
        traceback.print_exc()
        sys.exit(4)

if __name__ == "__main__":
    main()
