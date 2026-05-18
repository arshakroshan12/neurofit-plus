# NeuroFit+ AI Coding Guidelines

## Project Overview

**NeuroFit+** is a full-stack fatigue-prediction system with:
- **Backend**: FastAPI service using RandomForest model for fatigue classification (low/medium/high)
- **Frontend**: Next.js (React 19) with TailwindCSS for interactive analysis and chatbot UI
- **Core Workflow**: Capture subjective + behavioral metrics → Send to backend → Display personalized recommendations

Model predicts fatigue from: sleep hours, energy/stress levels, reaction time, typing latency, backspace rate.

---

## Architecture & Critical Integration Points

### Three-Tier Data Flow
1. **Frontend** (`frontend-next/`) collects metrics → Calls `/predict_fatigue` endpoint
2. **Backend** (`backend/app/main.py`) loads ML model, validates integrity, returns prediction
3. **Result** stored in localStorage, dashboard updates automatically

**Key Files**:
- [frontend-next/app/analysis/page.tsx](../frontend-next/app/analysis/page.tsx) - 4-step input flow (subjective, reaction test, typing test, submit)
- [frontend-next/app/page.tsx](../frontend-next/app/page.tsx) - Dashboard summary view
- [backend/app/main.py](../backend/app/main.py) - REST API with model loading & prediction
- [frontend-next/lib/chatbotService.ts](../frontend-next/lib/chatbotService.ts) - Conversation state machine
- [frontend-next/lib/workoutData.ts](../frontend-next/lib/workoutData.ts) - Structured workout library by fatigue level

### Important: Feature Order Consistency
The **exact feature order** must match training. In `main.py`:
```python
FEATURE_ORDER = [
    "sleep_hours", "energy_level", "stress_level",
    "avg_key_latency_ms", "total_duration_ms", "backspace_rate",
    "reaction_time_ms", "reaction_attempted",
]
```
Any reordering breaks predictions. Request features in **this exact order** when calling the API.

### Model Integrity Pattern
Backend validates model manifest on startup:
- `model_manifest.json` tracks training timestamp, numpy/sklearn versions, dataset hash
- If model file is missing, `/predict_fatigue` fails gracefully (returns error, doesn't crash)
- Model loaded via `joblib.load()`, not pickle (joblib preferred for sklearn models)

---

## Frontend Architecture Patterns

### Page Hierarchy
- **Dashboard** (`/`) - Read-only summary (fatigue score, risk level, weekly trend, CTA)
- **Analysis** (`/analysis`) - 4-step sequential wizard → Calls backend → Redirects to `/`
- **Chatbot** (`/chatbot`) - Conversational UI for workout recommendations
- **Login/Profile** (`/login`, `/profile`) - User context (optional)

### State Management
- **localStorage key**: `neurofit_last_result` — stores `{ fatigue_score, risk_level, timestamp }`
- **useEffect hook** on dashboard detects localStorage changes → Updates UI
- **No Redux/Context** - Simple localStorage is intentional (reduces complexity, works offline)

### Component Patterns
- **Workout Cards** - Reusable component in chatbot; displays title, duration, intensity, expandable steps
- **Form Controls** - Sliders with specific ranges (sleep: 0-12, energy: 1-10, stress: 1-10)
- **Typing/Reaction Tests** - Use `performance.now()` for high-precision timing (not `Date.now()`)
- **Color System** - OKLch-based custom CSS (not Tailwind defaults); defined in `globals.css`

### API Contract (Frontend → Backend)
**POST** `/predict_fatigue`
```json
{
  "sleep_hours": 7.5,
  "energy_level": 5,
  "stress_level": 3,
  "avg_key_latency_ms": 120,
  "total_duration_ms": 180000,
  "backspace_rate": 0.03,
  "reaction_time_ms": 350,
  "reaction_attempted": 1
}
```
**Response**:
```json
{
  "fatigue_score": 45,
  "risk_level": "medium"
}
```

---

## Backend Patterns

### FastAPI Structure
- **Main entry**: `backend/app/main.py` — defines routes, loads model on startup
- **Model directory**: `backend/models/` — stores `ml_model.joblib` (not `.pkl`)
- **Feature extraction**: Built into `main.py` (no separate service)
- **CORS enabled** for frontend communication

### Startup Validation
On app boot, main.py performs:
1. Check if model file exists (`ml_model.joblib`)
2. Load model via joblib
3. Load manifest (`model_manifest.json`)
4. Validate feature order matches training
5. If validation fails, log warning but **don't crash** — `/health` endpoint still responds

### Test Patterns
- **Test file**: [tests/test_workout_engine.py](../tests/test_workout_engine.py)
- **Test runner**: pytest with conftest.py shim
- **conftest.py** monkeypatches `pathlib.Path.mkdir()` to handle read-only CI environments
- **Flexible function detection** — tests look for functions by multiple candidate names (prefer `personalize_and_rank()`)

---

## Developer Workflows

### Local Setup
```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend-next
npm install
npm run dev  # runs on :3000
```

### Testing
```bash
# Run pytest (includes model validation)
pytest tests/test_workout_engine.py -v

# Run CI checks locally
black --check .
isort --check .
ruff check .
pytest
```

### Docker Deployment
- `Dockerfile` runs on port 8000, uses Python 3.11-slim, creates non-root `neuro` user
- `docker-compose.yml` mounts `backend/models/` as writable volume (for external model injection)
- Health check runs every 30s: `GET /health`

### Model Retraining
```bash
python backend/models/train_baseline.py
# Generates: ml_model.joblib, model_manifest.json
```
Then redeploy or restart app — model loads automatically on next boot.

---

## Project-Specific Conventions

### Naming & Structure
- **Python**: snake_case for functions/variables, UPPER_CASE for constants
- **TypeScript**: PascalCase for components/types, camelCase for functions
- **Feature branches**: `feature/chatbot-redesign`, `fix/model-loading`, etc.

### Error Handling
- **Frontend**: Wrap API calls in try-catch, show user-friendly alerts (no console errors)
- **Backend**: Return HTTP status codes properly (200 for success, 400 for bad request, 500 for server error)
- **Model loading**: Graceful degradation — if model missing, log warning, don't crash app

### Code Style
- **Backend**: Use type hints (`from typing import ...`), dataclasses for data structures
- **Frontend**: Functional components only (React 19), hooks for state
- **No magic numbers** — define slider ranges, durations, thresholds as constants

### Chatbot-Specific Patterns
- **Workout library** is in [frontend-next/lib/workoutData.ts](../frontend-next/lib/workoutData.ts) (not backend)
- **Fatigue-gated responses** — High fatigue (>60%) blocks intense workouts automatically
- **No hallucinated workouts** — All recommendations from predefined library
- **Conversational state** tracked in `ChatbotState` object (tracks which step user is on)

---

## Critical "Why" Decisions

### Why localStorage, not a real database?
- Capstone project scope — simple storage sufficient
- Works offline, no authentication complexity
- Results persist across sessions naturally
- Can be swapped for real DB without changing UI logic

### Why RandomForest, not neural network?
- Interpretability — can explain feature importance
- Small training dataset — RandomForest doesn't overfit easily
- Fast inference — meets <100ms API requirement
- Production-ready without GPU

### Why split Dashboard and Analysis?
- **Concerns separation** — read-only view vs. interactive testing
- **Mental model clarity** — users know where to analyze, where to view
- **Performance** — dashboard lightweight, analysis page can be heavy

### Why joblib instead of pickle?
- Joblib handles sklearn model serialization better (preserves metadata)
- Safer for distributed scenarios (Render deployment)

---

## Known Gotchas & Edge Cases

1. **Model path inconsistency**: If `NEUROFIT_MODEL_DIR` env var is set but model isn't there, prediction fails. Check for both absolute and relative paths.

2. **Feature order bug**: If frontend sends features in wrong order, predictions are silently wrong (no error). Always validate feature order in both frontend + backend.

3. **localStorage nullability**: Frontend checks `fatigueScore === null` to detect "no data yet". Don't set it to `undefined` or empty string.

4. **Typing test timing**: Uses `performance.now()` which returns high-resolution timer. Different browsers may have different precision (Chrome: microseconds, Safari: lower). Acceptable variance ~±50ms.

5. **CORS on Render**: If backend deployed to Render, CORS headers must allow frontend domain. Check `ALLOWED_ORIGINS` in main.py.

6. **Conftest.py CI quirks**: The monkeypatched `Path.mkdir()` silently ignores `/app` writes. If tests create files outside `/app`, they work fine. If they try to write to `/app`, they fail silently.

---

## When to Dig Deeper

| Task | Start Here | Then Read |
|------|-----------|-----------|
| Add new ML feature | [backend/app/main.py](../backend/app/main.py#L45-L55) | FEATURE_ORDER definition + retrain script |
| Modify workout library | [frontend-next/lib/workoutData.ts](../frontend-next/lib/workoutData.ts) | Chatbot type definitions |
| Change API contract | [backend/app/main.py](../backend/app/main.py#L150-180) | Frontend predict call in api.ts |
| Debug prediction mismatch | [FEATURE_ORDER](../backend/app/main.py#L45-L55) + frontend form | Check feature mapping both sides |
| Deploy to production | [Dockerfile](../Dockerfile) | docker-compose.yml + Render docs |

---

## Debugging Tips

- **Backend startup issues**: Check `backend/models/` for `ml_model.joblib` + `model_manifest.json`
- **Prediction returns null**: Verify feature order + all fields provided in request
- **Frontend won't call backend**: Check CORS headers + backend port (8000 by default)
- **Tests fail on CI**: Likely `conftest.py` path issue — check if `/app` directory exists in test env
- **localStorage not updating**: Verify dashboard mounts useEffect that listens for `neurofit_last_result` key

---

## Quick Commands Reference

```bash
# Backend
uvicorn backend.app.main:app --reload --port 8000
python backend/models/train_baseline.py
pytest tests/ -v

# Frontend
npm run dev          # dev server on :3000
npm run build        # production build
npm run lint         # ESLint check

# Docker
docker build -t neurofit .
docker-compose up -d
docker logs -f <container_id>

# Testing
black . && isort . && ruff check .  # auto-format
pytest --co                          # list all tests
```

---

## Last Updated
January 4, 2026
