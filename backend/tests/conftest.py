import joblib
from pathlib import Path
from pytest import fixture

@fixture(scope="session", autouse=True)
def ensure_dummy_model():
    M = Path("backend/models/ml_model.joblib")
    M.parent.mkdir(parents=True, exist_ok=True)
    if not M.exists():
        try:
            from sklearn.dummy import DummyClassifier
            model = DummyClassifier(strategy="constant", constant=1)
            model.fit([[0]*8], [1])
        except Exception:
            class ModelStub:
                def predict(self, X): return [1 for _ in X]
                def predict_proba(self, X): return [[0.0,1.0] for _ in X]
            model = ModelStub()
        joblib.dump(model, M)
