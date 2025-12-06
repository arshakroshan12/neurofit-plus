# NeuroFit+ Backend API

FastAPI backend for NeuroFit+ fatigue prediction service.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

**Option 1: Using Python module**
```bash
python -m app.main
```

**Option 2: Using uvicorn directly**
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## Endpoints

### `POST /predict_fatigue`
Predicts fatigue level based on session data.

**Request Body:**
```json
{
  "user_id": "optional_user_id",
  "timestamp": "2024-01-15T10:30:00",
  "answers": [
    {"question_id": "sleep_hours", "value": 7.5},
    {"question_id": "energy_level", "value": 6},
    {"question_id": "stress_level", "value": 3}
  ],
  "typing_features": {
    "average_latency_ms": 150.5,
    "total_duration_ms": 5000,
    "accuracy": 0.95
  },
  "task_performance": {
    "reaction_time_ms": 250.0,
    "reaction_times": [240, 250, 260]
  }
}
```

**Response:**
```json
{
  "fatigue_score": 45.5,
  "risk_level": "medium",
  "recommendations": ["...", "..."],
  "timestamp": "2024-01-15T10:30:00",
  "model_used": "heuristic"
}
```

### `POST /save_session`
Saves session data to `data/sessions.jsonl` for later training.

**Request Body:** Same as `/predict_fatigue`

**Response:**
```json
{
  "status": "saved",
  "timestamp": "2024-01-15T10:30:00",
  "file": "data/sessions.jsonl"
}
```

## Model Loading

The backend attempts to load `models/fatigue_model.pkl` on startup. If the model is found, it will be used for predictions via `predict_proba`. If not found, the system falls back to a deterministic heuristic scoring method.

## Development

- Model file location: `models/fatigue_model.pkl`
- Session data storage: `data/sessions.jsonl`
- The `save_session` endpoint stores only `user_id` (optional, no PII)
