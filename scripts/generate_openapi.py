# File: scripts/generate_openapi.py
import json, sys, os

# allow importing backend package
sys.path.insert(0, os.getcwd())

try:
    # try the backend.app.main import path
    from backend.app.main import app
except Exception:
    # fallback to app.main
    from app.main import app

spec = app.openapi()

os.makedirs("docs", exist_ok=True)

with open("docs/openapi.json", "w", encoding="utf-8") as f:
    json.dump(spec, f, indent=2)

print("Wrote docs/openapi.json")

