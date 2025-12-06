import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app

# Model path relative to backend directory
MODEL_PATH = Path(__file__).parent.parent / "models" / "fatigue_model.pkl"

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def _model_exists():
    return os.path.exists(MODEL_PATH)

def test_health_endpoint(client):
    """Test the health check endpoint"""
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert "status" in body
    assert body["status"] == "healthy"
    assert "model_loaded" in body
    assert "timestamp" in body

def test_model_features_endpoint(client):
    """Test the model features endpoint"""
    r = client.get("/model/features")
    assert r.status_code == 200
    body = r.json()
    assert "model_loaded" in body
    assert "expected_features" in body
    assert len(body["expected_features"]) == 8

def test_predict_endpoint_smoke(client):
    """Test the predict endpoint with valid payload"""
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

    if not _model_exists():
        pytest.skip("Model missing; skipping predict endpoint test.")

    r = client.post("/predict_fatigue", json=payload)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    body = r.json()
    assert "fatigue_score" in body
    assert "risk_level" in body
    assert "recommendations" in body
    assert "model_used" in body
    assert body["model_used"] == "ml_model"
    assert 0 <= body["fatigue_score"] <= 100

def test_predict_endpoint_dict_answers(client):
    """Test predict endpoint with dict format answers"""
    payload = {
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
            "reaction_attempted": True
        }
    }

    if not _model_exists():
        pytest.skip("Model missing; skipping predict endpoint test.")

    r = client.post("/predict_fatigue", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "fatigue_score" in body
    assert body["model_used"] in ["ml_model", "heuristic"]

def test_root_endpoint(client):
    """Test the root endpoint"""
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert "message" in body
    assert "model_status" in body
    assert "endpoints" in body

