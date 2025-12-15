#!/usr/bin/env bash
set -e
echo "Root:"
curl -s http://127.0.0.1:8000/ | jq
echo
echo "Health:"
curl -s http://127.0.0.1:8000/health | jq
echo
echo "Predict (example):"
curl -s -X POST http://127.0.0.1:8000/predict_fatigue \
  -H "Content-Type: application/json" \
  -d '{"timestamp":"2025-01-01T10:00:00Z","answers":[{"question_id":"sleep_hours","value":6},{"question_id":"energy_level","value":3},{"question_id":"stress_level","value":2}],"typing_features":{"average_latency_ms":120,"total_duration_ms":2000,"backspace_rate":0.03},"task_performance":{"reaction_time_ms":300,"reaction_attempted":true}}' | jq
