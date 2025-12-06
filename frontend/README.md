# NeuroFit+ Frontend

React frontend for NeuroFit+ fatigue assessment tool built with Vite.

## Features

- **Consent Modal**: Data collection consent before starting assessment
- **Questionnaire**: Collects 3 answers (sleep hours, energy level, stress level)
- **Typing Latency Test**: Measures typing speed and accuracy
- **Reaction Time Test**: Measures reaction time with 3 test rounds
- **Results Display**: Shows fatigue score, risk level, and recommendations
- **Input Validation**: Validates all form inputs before submission
- **Session Saving**: Automatically saves session data to backend after completion

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure the FastAPI backend is running on `http://localhost:8000`

## Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal).

## Building for Production

```bash
npm run build
```

## Preview Production Build

```bash
npm start
```

## Configuration

The backend URL is configured in `src/api.js`:
- `BACKEND_URL = "http://localhost:8000"`

Change this if your backend is running on a different host/port.

## Data Flow

1. User accepts data collection consent
2. User completes questionnaire (3 questions)
3. User completes typing latency test
4. User completes reaction time test (3 rounds)
5. Session data is saved to backend `/save_session` endpoint
6. Fatigue prediction is requested from `/predict_fatigue` endpoint
7. Results are displayed to user

## Session Schema

The frontend sends data in the following format:

```json
{
  "user_id": null,
  "timestamp": "2024-01-15T10:30:00",
  "answers": [
    {"question_id": "sleep_hours", "value": 7.5},
    {"question_id": "energy_level", "value": 6},
    {"question_id": "stress_level", "value": 3}
  ],
  "typing_features": {
    "average_latency_ms": 150.5,
    "total_duration_ms": 5000,
    "accuracy": 0.95
  },
  "task_performance": {
    "reaction_time_ms": 250.0,
    "reaction_times": [240, 250, 260]
  }
}
```
