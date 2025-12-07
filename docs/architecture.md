# NeuroFit+ — Architecture

```mermaid
flowchart TD
  subgraph Client
    A[Frontend (React/Vite)] -->|session JSON| B[API Gateway / FastAPI]
  end

  subgraph Backend
    B --> C1[Feature Extraction (extract_features)]
    C1 --> C2[Prediction Service (RandomForest)]
    C2 --> R[Prediction Response]
    C1 --> Store[Session Store / CSV]
    Store --> Trainer[Model Trainer]
    Trainer --> Manifest[model_manifest.json]
    Trainer --> ModelFile[fatigue_model.pkl]
  end

  subgraph CI/CD
    Repo[GitHub Repo] -->|push| CI[GitHub Actions]
    CI --> Tests[pytest + pre-commit]
    CI --> Validate[validate_model.py]
  end

  Trainer -->|artifact| Artifacts[Artifact Storage (optional)]
  Manifest --> CI
  ModelFile --> CI
```

## Components

* **Frontend (React/Vite)**: Collects session metrics and calls `/predict_fatigue`.

* **FastAPI Backend**:

  * Loads model + manifest at startup.

  * Performs integrity validation.

  * Hosts endpoints: `/health`, `/model/features`, `/model/manifest`, `/predict_fatigue`.

* **Model Trainer** (`train_baseline.py`):

  * Trains RandomForest.

  * Saves model + manifest.

* **Model Manifest**:

  * Tracks numpy/sklearn versions, dataset hash, training timestamp, feature names.

* **GitHub Actions CI**:

  * Runs pre-commit, pytest, model validation, and import checks.

