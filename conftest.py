# conftest.py — robust test shim for NeuroFit+
# - Adds backend/ to sys.path
# - Sets NEUROFIT_MODEL_DIR to a writable temp dir
# - Monkeypatches pathlib.Path.mkdir to ignore /app writes (read-only CI)
# - Provides TestClient compatibility wrappers for fastapi/starlette

import sys
import os
import tempfile
from pathlib import Path
import pathlib
import importlib
import inspect

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

tmp_models = Path(tempfile.mkdtemp(prefix="neurofit_models_"))
os.environ.setdefault("NEUROFIT_MODEL_DIR", str(tmp_models))

_original_mkdir = pathlib.Path.mkdir
def _safe_mkdir(self, parents=False, exist_ok=False):
    try:
        if str(self).startswith("/app"):
            return None
        return _original_mkdir(self, parents=parents, exist_ok=exist_ok)
    except PermissionError:
        return None
pathlib.Path.mkdir = _safe_mkdir

def make_compat_testclient(OriginalClient):
    class CompatTestClient(OriginalClient):
        def __init__(self, app=None, *args, **kwargs):
            if app is None:
                super().__init__(*args, **kwargs)
            else:
                super().__init__(app, *args, **kwargs)
    return CompatTestClient

for mod_name in ("fastapi.testclient", "starlette.testclient"):
    try:
        mod = importlib.import_module(mod_name)
        if hasattr(mod, "TestClient"):
            Orig = getattr(mod, "TestClient")
            try:
                sig = inspect.signature(Orig.__init__)
                if "app" not in sig.parameters:
                    Compat = make_compat_testclient(Orig)
                    setattr(mod, "TestClient", Compat)
            except (TypeError, ValueError):
                Compat = make_compat_testclient(Orig)
                setattr(mod, "TestClient", Compat)
    except Exception:
        continue
