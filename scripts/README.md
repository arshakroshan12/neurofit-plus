# NeuroFit+ Scripts

Utility scripts for data processing and testing.

## convert_sessions_to_csv.py

Converts session JSONL logs to CSV format for model training.

### Usage

```bash
# Basic usage (reads data/sessions.jsonl, writes data/processed/features.csv)
python scripts/convert_sessions_to_csv.py

# Custom input/output paths
python scripts/convert_sessions_to_csv.py \
  --input data/sessions.jsonl \
  --output data/processed/features.csv

# Exclude the label column if your dataset is unlabeled
python scripts/convert_sessions_to_csv.py --no-label
```

### Features

- Supports list answers (`[{"question_id": "...", "value": ...}]`) and dict answers (`{"sleep_hours": ...}`)
- Extracts all required numeric columns and fills missing values with `0`
- Automatically creates the output directory if missing
- Leaves label optional—if absent, `label` is set to `0`

### Output Columns

- `sleep_hours`: Hours of sleep (0-24)
- `energy_level`: Energy level (0-10)
- `stress_level`: Stress level (0-10)
- `avg_key_latency_ms`: Average typing latency in milliseconds
- `total_duration_ms`: Total typing duration in milliseconds
- `backspace_rate`: Backspace rate (if available, else 0)
- `reaction_time_ms`: Reaction time in milliseconds
- `reaction_attempted`: Whether reaction test was attempted (0 or 1)
- `label`: Optional fatigue label/score

## smoke_test_frontend.sh

End-to-end smoke test for backend API endpoints.

### Usage

```bash
./scripts/smoke_test_frontend.sh
```

### Requirements

- Backend must be running on `http://localhost:8000`
- `curl` and `python3` must be available

