import numpy as np
import pytest
from app.main import extract_features, SessionData, TypingFeatures, TaskPerformance

# Expected feature count (matches training)
EXPECTED_FEATURE_COUNT = 8

def test_extract_features_minimal():
    """Test feature extraction with minimal valid session data"""
    session = SessionData(
        timestamp="2024-01-15T10:30:00",
        answers=[
            {"question_id": "sleep_hours", "value": 6.0},
            {"question_id": "energy_level", "value": 4.0},
            {"question_id": "stress_level", "value": 1.0}
        ],
        typing_features=TypingFeatures(
            average_latency_ms=120.0,
            total_duration_ms=5000.0,
            backspace_rate=0.05
        ),
        task_performance=TaskPerformance(
            reaction_time_ms=300.0,
            reaction_attempted=True
        )
    )
    X = extract_features(session)
    assert isinstance(X, np.ndarray)
    assert X.shape == (1, EXPECTED_FEATURE_COUNT)
    assert not np.isnan(X).any()
    assert not np.isinf(X).any()
    # Verify feature values
    assert X[0, 0] == 6.0  # sleep_hours
    assert X[0, 1] == 4.0  # energy_level
    assert X[0, 2] == 1.0  # stress_level
    assert X[0, 3] == 120.0  # avg_key_latency_ms
    assert X[0, 4] == 5000.0  # total_duration_ms
    assert X[0, 5] == 0.05  # backspace_rate
    assert X[0, 6] == 300.0  # reaction_time_ms
    assert X[0, 7] == 1  # reaction_attempted

def test_extract_features_defaults():
    """Test feature extraction with minimal/default values"""
    session = SessionData(
        timestamp="2024-01-15T10:30:00",
        answers={}  # Empty dict
    )
    X = extract_features(session)
    assert X.shape == (1, EXPECTED_FEATURE_COUNT)
    assert not np.isnan(X).any()
    # All should default to 0.0 or 0
    assert X[0, 0] == 0.0  # sleep_hours
    assert X[0, 1] == 0.0  # energy_level
    assert X[0, 2] == 0.0  # stress_level
    assert X[0, 7] == 0  # reaction_attempted (False -> 0)

def test_extract_features_dict_answers():
    """Test feature extraction with dict format answers"""
    session = SessionData(
        timestamp="2024-01-15T10:30:00",
        answers={
            "sleep_hours": 7.5,
            "energy_level": 5.0,
            "stress_level": 2.0
        },
        typing_features=TypingFeatures(
            average_latency_ms=150.0
        ),
        task_performance=TaskPerformance(
            reaction_time_ms=250.0,
            reaction_attempted=True
        )
    )
    X = extract_features(session)
    assert X.shape == (1, EXPECTED_FEATURE_COUNT)
    assert X[0, 0] == 7.5  # sleep_hours
    assert X[0, 1] == 5.0  # energy_level
    assert X[0, 2] == 2.0  # stress_level
    assert X[0, 3] == 150.0  # avg_key_latency_ms
    assert X[0, 7] == 1  # reaction_attempted

