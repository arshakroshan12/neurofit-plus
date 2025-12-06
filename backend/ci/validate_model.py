#!/usr/bin/env python3
"""
Model validation script for CI/CD.

Validates that:
- Model file exists and can be loaded
- Manifest file exists and can be loaded
- Feature count matches between model and manifest
- NumPy and sklearn versions match between manifest and runtime
"""

import sys
import json
import os
from pathlib import Path
import joblib
import numpy as np
import sklearn

# Determine paths
ROOT = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = ROOT / "backend" / "models" / "fatigue_model.pkl"
MANIFEST_PATH = ROOT / "backend" / "models" / "model_manifest.json"

def validate_model():
    """Validate model and manifest integrity"""
    errors = []
    
    # Check model file exists
    if not MODEL_PATH.exists():
        errors.append(f"Model file not found: {MODEL_PATH}")
        return errors
    
    # Check manifest file exists
    if not MANIFEST_PATH.exists():
        errors.append(f"Manifest file not found: {MANIFEST_PATH}")
        return errors
    
    # Load manifest
    try:
        with open(MANIFEST_PATH, "r") as f:
            manifest = json.load(f)
    except Exception as e:
        errors.append(f"Failed to load manifest: {e}")
        return errors
    
    # Load model
    try:
        model_data = joblib.load(MODEL_PATH)
    except Exception as e:
        errors.append(f"Failed to load model: {e}")
        return errors
    
    # Validate model structure
    if not isinstance(model_data, dict):
        errors.append("Model must be a dict with 'model' and 'feature_names' keys")
        return errors
    
    if "model" not in model_data:
        errors.append("Model dict missing 'model' key")
        return errors
    
    if "feature_names" not in model_data:
        errors.append("Model dict missing 'feature_names' key")
        return errors
    
    clf = model_data["model"]
    feature_names = model_data["feature_names"]
    
    # Validate feature count
    if not hasattr(clf, "n_features_in_"):
        errors.append("Model does not have n_features_in_ attribute")
        return errors
    
    if clf.n_features_in_ != len(feature_names):
        errors.append(
            f"Feature count mismatch: model expects {clf.n_features_in_} features, "
            f"but feature_names has {len(feature_names)}"
        )
        return errors
    
    # Validate manifest versions
    manifest_numpy = manifest.get("numpy_version")
    manifest_sklearn = manifest.get("sklearn_version")
    runtime_numpy = np.__version__
    runtime_sklearn = sklearn.__version__
    
    if manifest_numpy != runtime_numpy:
        errors.append(
            f"NumPy version mismatch: manifest={manifest_numpy}, runtime={runtime_numpy}"
        )
    
    if manifest_sklearn != runtime_sklearn:
        errors.append(
            f"sklearn version mismatch: manifest={manifest_sklearn}, runtime={runtime_sklearn}"
        )
    
    # Validate manifest feature names match
    manifest_features = manifest.get("feature_names", [])
    if manifest_features != feature_names:
        errors.append(
            f"Feature names mismatch: manifest={manifest_features}, model={feature_names}"
        )
    
    return errors

def main():
    """Main entry point"""
    errors = validate_model()
    
    if errors:
        print("❌ Model validation failed:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    else:
        print("✅ Model validation passed")
        sys.exit(0)

if __name__ == "__main__":
    main()

