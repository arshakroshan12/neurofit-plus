#!/bin/bash
#
# Smoke test script for NeuroFit+ frontend
# Tests end-to-end flow by posting sample JSON to backend endpoints
#

set -e

BACKEND_URL="http://localhost:8000"
TEST_USER_ID="smoke_test_$(date +%s)"

echo "🧪 NeuroFit+ Frontend Smoke Test"
echo "=================================="
echo ""

# Check if backend is running
echo "Checking if backend is running..."
if ! curl -s -f "${BACKEND_URL}/health" > /dev/null; then
    echo "❌ Error: Backend is not running at ${BACKEND_URL}"
    echo "   Please start the backend first:"
    echo "   cd backend && python -m app.main"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# Sample session data matching frontend schema
SAMPLE_SESSION=$(cat <<EOF
{
  "user_id": "${TEST_USER_ID}",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S")",
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
EOF
)

echo "📤 Testing /save_session endpoint..."
SAVE_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/save_session" \
    -H "Content-Type: application/json" \
    -d "${SAMPLE_SESSION}")

if echo "${SAVE_RESPONSE}" | grep -q '"status":"saved"'; then
    echo "✅ /save_session: Success"
    echo "   Response: ${SAVE_RESPONSE}"
else
    echo "❌ /save_session: Failed"
    echo "   Response: ${SAVE_RESPONSE}"
    exit 1
fi
echo ""

echo "🔮 Testing /predict_fatigue endpoint..."
PREDICT_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/predict_fatigue" \
    -H "Content-Type: application/json" \
    -d "${SAMPLE_SESSION}")

if echo "${PREDICT_RESPONSE}" | grep -q '"fatigue_score"'; then
    echo "✅ /predict_fatigue: Success"
    echo "   Response: ${PREDICT_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "   ${PREDICT_RESPONSE}"
    
    # Extract fatigue score
    FATIGUE_SCORE=$(echo "${PREDICT_RESPONSE}" | python3 -c "import sys, json; print(json.load(sys.stdin)['fatigue_score'])" 2>/dev/null || echo "N/A")
    RISK_LEVEL=$(echo "${PREDICT_RESPONSE}" | python3 -c "import sys, json; print(json.load(sys.stdin)['risk_level'])" 2>/dev/null || echo "N/A")
    MODEL_USED=$(echo "${PREDICT_RESPONSE}" | python3 -c "import sys, json; print(json.load(sys.stdin)['model_used'])" 2>/dev/null || echo "N/A")
    
    echo ""
    echo "   📊 Results:"
    echo "      Fatigue Score: ${FATIGUE_SCORE}"
    echo "      Risk Level: ${RISK_LEVEL}"
    echo "      Model Used: ${MODEL_USED}"
else
    echo "❌ /predict_fatigue: Failed"
    echo "   Response: ${PREDICT_RESPONSE}"
    exit 1
fi
echo ""

echo "✅ All smoke tests passed!"
echo ""
echo "Test user ID: ${TEST_USER_ID}"
echo "Session data saved to: data/sessions.jsonl"

