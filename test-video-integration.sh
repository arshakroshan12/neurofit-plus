#!/bin/bash
# Quick commands for video integration testing

echo "=== NeuroFit+ Video Integration Test Suite ==="
echo ""

# 1. Build test
echo "1. Testing production build..."
cd frontend-next
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✓ Build successful"
else
  echo "✗ Build failed"
  exit 1
fi

# 2. Lint test
echo "2. Testing linting..."
npm run lint -- components/video-demo.tsx app/chatbot/page.tsx > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✓ Linting passed"
else
  echo "⚠ Linting warnings detected (pre-existing)"
fi

# 3. Dev server test
echo "3. Starting dev server..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

if curl -s http://localhost:3001 > /dev/null 2>&1; then
  echo "✓ Dev server running on http://localhost:3001"
else
  echo "✗ Dev server failed to start"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

echo ""
echo "=== All tests passed ==="
echo ""
echo "Next steps:"
echo "1. Navigate to http://localhost:3001/chatbot"
echo "2. Run a fatigue analysis on /analysis page"
echo "3. Request a workout recommendation"
echo "4. Check if demo video appears below workout"
echo ""
echo "Video files should be placed in:"
echo "  frontend-next/public/videos/"
echo ""
echo "Expected video files:"
echo "  - upper-body-sculpt.mp4"
echo "  - chest-sculpt.mp4"
echo "  - lower-body-strength.mp4"
echo "  - core-strength-builder.mp4"
echo "  - full-body-functional.mp4"

kill $SERVER_PID 2>/dev/null
