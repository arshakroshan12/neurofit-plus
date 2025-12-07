# Data Flow & Lifecycle

## 1. Session Collection

Frontend gathers keystroke timings, reaction times, and user self-reported metrics.

Sent to `/predict_fatigue`.

## 2. Feature Extraction

`extract_features()` computes the 8 features, in exact order:

1. sleep_hours

2. energy_level

3. stress_level

4. avg_key_latency_ms

5. total_duration_ms

6. backspace_rate

7. reaction_time_ms

8. reaction_attempted

## 3. Online Prediction

FastAPI loads the model at startup, validates it, then returns:

* prediction (0/1)

* probability matrix

## 4. Session Storage

Optional: session data appended to CSV for re-training.

## 5. Training Cycle

`train_baseline.py`:

* trains RandomForest

* saves `fatigue_model.pkl` (with feature_names)

* generates `model_manifest.json`

## 6. Deployment / CI Validation

CI checks:

* model + manifest exist

* feature count matches

* numpy/sklearn versions match

