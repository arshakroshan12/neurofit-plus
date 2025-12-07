# NeuroFit+

[![CI](https://github.com/arshakroshan12/neurofit-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/arshakroshan12/neurofit-plus/actions)

[![Python](https://img.shields.io/badge/python-3.11%2F3.12-blue)](https://www.python.org/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

NeuroFit+ is a fatigue-prediction backend (FastAPI) using a RandomForest classifier trained on keyboard dynamics and reaction-time metrics. The backend includes automated model integrity validation, CI checks, manifest-based metadata tracking, and a test suite ensuring safe, reproducible deployments.

---

## 🚀 Features

- FastAPI backend with startup-time **model + manifest integrity validation**

- RandomForest classifier saved with **feature_names** and reproducible metadata

- Automatically generated `model_manifest.json` (training date, versions, dataset hash)

- CI pipeline running:

  - pre-commit (black, isort, ruff)

  - pytest

  - model validation

  - FastAPI import check

- Full test suite for feature extraction + API

- Clean repository (model binaries ignored, manifest tracked)

---

## 🧪 Quickstart (developer)

```bash
python3 -m venv .venv-neurofit
source .venv-neurofit/bin/activate
pip install -r requirements.txt

# Retrain model
python backend/models/train_baseline.py

# Start API
uvicorn backend.app.main:app --reload --port 8000
```

---

## 📡 API Endpoints

### `GET /health`

Service + model load status.

### `GET /model/features`

Exact feature order used during training.

### `GET /model/manifest`

Read the model manifest generated during training.

### `POST /predict_fatigue`

Example payload:

```json
{
  "sleep_hours": 7,
  "energy_level": 3,
  "stress_level": 2,
  "avg_key_latency_ms": 120,
  "total_duration_ms": 180000,
  "backspace_rate": 0.03,
  "reaction_time_ms": 350,
  "reaction_attempted": 1
}
```

---

## 🧠 Model + Manifest

* Model: `backend/models/fatigue_model.pkl`

* Manifest: `backend/models/model_manifest.json`

Manifest ensures:

* training timestamp

* dataset hash

* numpy/sklearn versions

* feature_names

* reproducibility

Both CI and FastAPI enforce validation.

---

## 🧪 Testing

```bash
cd backend
pytest -q
```

Includes both feature extraction + API tests.

---

## 🛠 Pre-commit Hooks

```bash
pre-commit install
pre-commit run --all-files
```

CI also runs pre-commit on every push.

---

## 🧱 CI Pipeline

Workflow: `.github/workflows/ci.yml`

Runs:

* dependency install

* pre-commit

* pytest

* model validator

* FastAPI import check

Badge at top reflects latest build status.

---

## 🤝 Contributing

1. Fork → branch → implement

2. Run pre-commit + pytest

3. Open PR

4. CI must pass

---

## 📄 License

This project is under the MIT License. See `LICENSE`.

---

## 👤 Author

**Arshak Roshan**

GitHub: [https://github.com/arshakroshan12](https://github.com/arshakroshan12)



[![API Docs](https://img.shields.io/badge/docs-Redoc-blue)](https://arshakroshan12.github.io/neurofit-plus/)
