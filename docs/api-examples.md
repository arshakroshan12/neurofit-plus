# NeuroFit+ — API Examples

This document provides ready-to-run examples for all NeuroFit+ API endpoints.

---

## 🔍 Health Check — GET /health

### Curl Example

```bash
curl -X GET http://localhost:8000/health
```

### Response

```json
{
  "status": "healthy",
  "timestamp": "2025-12-07T16:00:00.000000",
  "model_loaded": true
}
```

### Python Example

```python
import requests

response = requests.get("http://localhost:8000/health")
print(response.json())
```

---

## 📊 Root Endpoint — GET /

### Curl Example

```bash
curl -X GET http://localhost:8000/
```

### Response

```json
{
  "message": "Welcome to NeuroFit+ API",
  "version": "1.0.0",
  "model_status": "loaded",
  "endpoints": {
    "predict_fatigue": "POST /predict_fatigue",
    "save_session": "POST /save_session"
  }
}
```

---

## 🎯 Model Features — GET /model/features

### Curl Example

```bash
curl -X GET http://localhost:8000/model/features
```

### Response (Model Loaded)

```json
{
  "model_loaded": true,
  "model_type": "RandomForestClassifier",
  "feature_names": [
    "sleep_hours",
    "energy_level",
    "stress_level",
    "avg_key_latency_ms",
    "total_duration_ms",
    "backspace_rate",
    "reaction_time_ms",
    "reaction_attempted"
  ],
  "expected_feature_count": 8,
  "expected_features": [
    "sleep_hours",
    "energy_level",
    "stress_level",
    "avg_key_latency_ms",
    "total_duration_ms",
    "backspace_rate",
    "reaction_time_ms",
    "reaction_attempted"
  ]
}
```

### Response (Model Not Loaded)

```json
{
  "model_loaded": false,
  "message": "Model not loaded - using heuristic",
  "expected_features": [
    "sleep_hours",
    "energy_level",
    "stress_level",
    "avg_key_latency_ms",
    "total_duration_ms",
    "backspace_rate",
    "reaction_time_ms",
    "reaction_attempted"
  ],
  "expected_feature_count": 8
}
```

---

## 📋 Model Manifest — GET /model/manifest

### Curl Example

```bash
curl -X GET http://localhost:8000/model/manifest
```

### Response

```json
{
  "model_version": "2025-12-06T16:32:55.484185Z",
  "train_date": "2025-12-06T16:32:55.484401Z",
  "dataset_hash": "3e636b4a4f1accce8d15b0729bae7bbce2b5a8ced527acef635c54f6cce26264",
  "numpy_version": "1.26.4",
  "sklearn_version": "1.4.2",
  "feature_names": [
    "sleep_hours",
    "energy_level",
    "stress_level",
    "avg_key_latency_ms",
    "total_duration_ms",
    "backspace_rate",
    "reaction_time_ms",
    "reaction_attempted"
  ],
  "notes": "RandomForestClassifier trained on NeuroFit+ session data"
}
```

### Error Response (404)

```json
{
  "detail": "Model manifest not available. Model may not be loaded."
}
```

---

## 🧠 Predict Fatigue — POST /predict_fatigue

### Curl Example (List Format Answers)

```bash
curl -X POST http://localhost:8000/predict_fatigue \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2024-01-15T10:30:00",
    "answers": [
      {"question_id": "sleep_hours", "value": 7.0},
      {"question_id": "energy_level", "value": 3.0},
      {"question_id": "stress_level", "value": 2.0}
    ],
    "typing_features": {
      "average_latency_ms": 120.0,
      "total_duration_ms": 5000.0,
      "backspace_rate": 0.03
    },
    "task_performance": {
      "reaction_time_ms": 350.0,
      "reaction_attempted": true
    }
  }'
```

### Curl Example (Dict Format Answers)

```bash
curl -X POST http://localhost:8000/predict_fatigue \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2024-01-15T10:30:00",
    "answers": {
      "sleep_hours": 6.0,
      "energy_level": 4.0,
      "stress_level": 1.0
    },
    "typing_features": {
      "average_latency_ms": 150.0,
      "total_duration_ms": 6000.0,
      "backspace_rate": 0.05
    },
    "task_performance": {
      "reaction_time_ms": 300.0,
      "reaction_attempted": true
    }
  }'
```

### Response

```json
{
  "fatigue_score": 19.0,
  "risk_level": "low",
  "recommendations": [
    "Low fatigue levels - you're well recovered",
    "Aim for 7-9 hours of sleep for optimal recovery"
  ],
  "timestamp": "2025-12-07T16:00:00.000000",
  "model_used": "ml_model"
}
```

### Python Example

```python
import requests

payload = {
    "timestamp": "2024-01-15T10:30:00",
    "answers": [
        {"question_id": "sleep_hours", "value": 7.0},
        {"question_id": "energy_level", "value": 3.0},
        {"question_id": "stress_level", "value": 2.0}
    ],
    "typing_features": {
        "average_latency_ms": 120.0,
        "total_duration_ms": 5000.0,
        "backspace_rate": 0.03
    },
    "task_performance": {
        "reaction_time_ms": 350.0,
        "reaction_attempted": True
    }
}

response = requests.post("http://localhost:8000/predict_fatigue", json=payload)
print(response.json())
```

### Error Response (500)

```json
{
  "detail": "Prediction error: X has 7 features, but RandomForestClassifier is expecting 8"
}
```

---

## 💾 Save Session — POST /save_session

### Curl Example

```bash
curl -X POST http://localhost:8000/save_session \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "timestamp": "2024-01-15T10:30:00",
    "answers": [
      {"question_id": "sleep_hours", "value": 7.5},
      {"question_id": "energy_level", "value": 6.0},
      {"question_id": "stress_level", "value": 3.0}
    ],
    "typing_features": {
      "average_latency_ms": 150.5,
      "total_duration_ms": 5000.0,
      "backspace_rate": 0.05
    },
    "task_performance": {
      "reaction_time_ms": 250.0,
      "reaction_attempted": true
    }
  }'
```

### Response

```json
{
  "status": "saved",
  "timestamp": "2025-12-07T16:00:00.000000",
  "file": "/path/to/data/sessions.jsonl"
}
```

### Python Example

```python
import requests

payload = {
    "user_id": "user123",
    "timestamp": "2024-01-15T10:30:00",
    "answers": {
        "sleep_hours": 7.5,
        "energy_level": 6.0,
        "stress_level": 3.0
    },
    "typing_features": {
        "average_latency_ms": 150.5,
        "total_duration_ms": 5000.0,
        "backspace_rate": 0.05
    },
    "task_performance": {
        "reaction_time_ms": 250.0,
        "reaction_attempted": True
    }
}

response = requests.post("http://localhost:8000/save_session", json=payload)
print(response.json())
```

---

## 📝 Request Schema

### SessionData

```json
{
  "user_id": "string (optional)",
  "timestamp": "string (required, ISO format)",
  "answers": "array or object (required)",
  "typing_features": {
    "average_latency_ms": "number (optional, default: 0.0)",
    "total_duration_ms": "number (optional, default: 0.0)",
    "backspace_rate": "number (optional, default: 0.0)"
  },
  "task_performance": {
    "reaction_time_ms": "number (optional, default: 0.0)",
    "reaction_attempted": "boolean (optional, default: false)"
  }
}
```

### Answers Format

**List Format:**
```json
"answers": [
  {"question_id": "sleep_hours", "value": 7.0},
  {"question_id": "energy_level", "value": 3.0},
  {"question_id": "stress_level", "value": 2.0}
]
```

**Dict Format:**
```json
"answers": {
  "sleep_hours": 7.0,
  "energy_level": 3.0,
  "stress_level": 2.0
}
```

---

## 🔒 Response Codes

- `200 OK` - Successful request
- `404 Not Found` - Resource not found (e.g., manifest not available)
- `500 Internal Server Error` - Server error (e.g., prediction failure)

---

## 🌐 Base URL

- **Local Development**: `http://localhost:8000`
- **Production**: Configure based on deployment

---

## 📚 Interactive API Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

