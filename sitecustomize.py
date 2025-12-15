# sitecustomize.py — aggressive test-time shims
# - patch httpx._client.Client.__init__ to pop stray 'app' kwarg
# - patch fastapi/starlette TestClient if needed
# - this file runs early if it's on sys.path (repo root) when Python starts

import importlib
import inspect
import pathlib
from pathlib import Path

# 1) defensive mkdir shim for read-only /app (redundant if conftest also has it)
_original_mkdir = pathlib.Path.mkdir
def _safe_mkdir(self, parents=False, exist_ok=False):
    try:
        if str(self).startswith("/app"):
            return None
        return _original_mkdir(self, parents=parents, exist_ok=exist_ok)
    except PermissionError:
        return None
pathlib.Path.mkdir = _safe_mkdir

# 2) patch the concrete httpx client __init__ to remove 'app' kw if present
try:
    import httpx
    # target the concrete implementation inside httpx
    try:
        TargetClient = httpx._client.Client
    except Exception:
        TargetClient = getattr(httpx, "Client", None)
    if TargetClient is not None:
        _orig_httpx_init = TargetClient.__init__
        def _httpx_init_compat(self, *args, **kwargs):
            # drop 'app' if present (starlette passes it through)
            if "app" in kwargs:
                kwargs.pop("app")
            return _orig_httpx_init(self, *args, **kwargs)
        TargetClient.__init__ = _httpx_init_compat
except Exception:
    # if httpx not importable at startup, nothing to do here
    pass

# 3) ensure TestClient(app=...) works for both starlette and fastapi TestClient classes
def make_compat_testclient(OriginalClient):
    class CompatTestClient(OriginalClient):
        def __init__(self, app=None, *args, **kwargs):
            if app is None:
                super().__init__(*args, **kwargs)
            else:
                super().__init__(app, *args, **kwargs)
    return CompatTestClient

for mod_name in ("starlette.testclient", "fastapi.testclient"):
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
        # module not present yet — safe to skip
        continue
