# NeuroFit+ — System Overview

## Purpose

AI system that predicts cognitive fatigue based on user interaction metrics.

## Components

* FastAPI backend

* RandomForest model

* Model manifest

* GitHub Actions CI

* Pre-commit hooks

* Full test suite

## Dev Workflow

```bash
source .venv-neurofit/bin/activate

pip install -r requirements.txt

python backend/models/train_baseline.py

python backend/ci/validate_model.py

uvicorn backend.app.main:app --reload --port 8000
```

## Notes

* `model_manifest.json` is always tracked.

* `fatigue_model.pkl` is ignored (not stored in Git).

* CI ensures model integrity before allowing deployment.

Public API docs: https://arshakroshan12.github.io/neurofit-plus/ (generated from OpenAPI on each push)

