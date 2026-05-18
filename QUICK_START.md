# NeuroFit+ Quick Start Guide

## 🚀 Running the App

```bash
cd /Users/arshakroshan/neurofit-plus/frontend-next
npm run dev
```

The app will be available at **http://localhost:3000**

## 📱 User Flow

### Dashboard (/)
Your starting point. Shows a summary of your cognitive state:
- **Fatigue Score** - Your current fatigue level (0-100%)
- **Risk Level** - Low, Medium, or High
- **Workout Recommendation** - Personalized based on fatigue
- **Weekly Trend** - Your fatigue scores over 7 days
- **"Run Fatigue Analysis" Button** - Primary CTA

### Fatigue Analysis (/analysis)
The core interactive experience. 4 sequential steps:

#### Step 1: Quick Assessment (30 seconds)
Answer about your current state:
- How many hours did you sleep? (0-12)
- How's your energy level? (1-10 slider)
- How stressed are you? (1-10 slider)

Click **Continue** → Step 2

#### Step 2: Reaction Time Test (1-2 minutes)
Measure your cognitive speed:
- Wait for a green circle to appear
- Tap it as fast as you can
- 2 trials are averaged automatically
- Measures in milliseconds

Click **Start** to begin

#### Step 3: Typing Test (9 seconds)
Capture your typing patterns:
- You'll see a sentence
- Type it naturally for ~9 seconds
- We measure keystroke latency and accuracy
- No scoring shown (non-stressful)

Click **Start Test** to begin

#### Step 4: Get Results (1 second)
Review your analysis metrics and get personalized recommendations:
- Fatigue Score (0-100%)
- Risk Level assessment
- Workout suggestions
- Tips for recovery

Click **Analyze Results** → Backend processes → Returns to Dashboard

## 🎨 Design

- **Colors:** White background with blue accents
- **Style:** Clean, minimal, health-tech aesthetic
- **Components:** Rounded cards, soft shadows, smooth interactions
- **Typography:** Clear hierarchy, readable on all devices

## 💾 Data Persistence

- Results saved in localStorage
- Automatically updates dashboard
- Weekly scores accumulated (newest first)
- Persists across browser sessions

## 🔌 Backend Integration

All data is sent to: `https://neurofit-plus.onrender.com/predict_fatigue`

The backend returns:
- Fatigue Score (normalized 0-100%)
- Risk Level (low/medium/high)

## ✨ Key Features

✅ No fake data - All metrics are measured in real-time
✅ Gamified tests - Green stimulus makes reaction test engaging
✅ Private by default - No personal data required
✅ Fast analysis - ~2 seconds from click to results
✅ Mobile responsive - Works on phones, tablets, desktops
✅ Persistent results - History maintained in browser

## 🛠️ File Structure

```
frontend-next/
├── app/
│   ├── page.tsx              # Dashboard (Summary view)
│   ├── analysis/page.tsx     # 4-step Analysis flow
│   ├── login/page.tsx        # Login page
│   ├── profile/page.tsx      # Profile setup
│   ├── chatbot/page.tsx      # Chatbot page
│   └── globals.css           # Color system
├── components/
│   ├── header.tsx            # Navigation
│   ├── reaction-test.tsx     # Reaction test (reused)
│   ├── typing-test.tsx       # Typing test (reused)
│   ├── fatigue-overview.tsx  # Display fatigue
│   ├── workout-recommendation.tsx
│   ├── weekly-trend.tsx      # Weekly chart
│   └── results-display.tsx   # (Unused now)
└── lib/
    └── api.tsx               # Backend API wrapper
```

## 🧪 Testing the Complete Flow

1. **Start:** Open http://localhost:3000
   - See dashboard with empty state

2. **Navigate:** Click "Run Fatigue Analysis"
   - Go to /analysis page
   - See Step 1 form

3. **Complete Step 1:**
   - Adjust sliders to your current state
   - Click "Continue"
   - See Step 2 (Reaction Test)

4. **Complete Step 2:**
   - Click "Start"
   - Wait for green circle
   - Tap 2 times (averaging ~300-500ms)
   - Move to Step 3

5. **Complete Step 3:**
   - Click "Start Test"
   - Type the sentence for 9 seconds
   - Click "Finish"
   - Move to Step 4

6. **Complete Step 4:**
   - Review metrics summary
   - Click "Analyze Results"
   - Wait for backend (1-2 seconds)
   - Redirected to Dashboard

7. **See Results:**
   - Dashboard now shows your Fatigue Score
   - Risk Level displayed
   - Weekly Trend updated
   - Workout recommendation personalized

## 📊 Example Results

```
Fatigue Score: 65%
Risk Level: Medium

Recommendation:
- Focus on moderate intensity workouts
- Ensure 7-8 hours of sleep tonight
- Take regular breaks (5 min/hour)
- Stay hydrated
```

## 🎯 For Your Viva

This refactored architecture demonstrates:
- **Clean separation of concerns** - Dashboard vs. Analysis
- **Real interactive components** - No mock data
- **Scalable design** - Easy to add new tests/metrics
- **Production-ready** - Error handling, loading states
- **Professional UX** - Smooth flow, helpful feedback
- **Backend integration** - Real ML predictions
- **State management** - localStorage for persistence
- **Modern stack** - Next.js 16, React 19, TypeScript

## 🚦 Troubleshooting

**Port 3000 already in use?**
```bash
pkill -f "next dev"
npm run dev
```

**Build errors?**
```bash
rm -rf .next node_modules
npm install
npm run dev
```

**Results not showing on dashboard?**
- Check browser DevTools → Application → localStorage
- Look for `neurofit_last_result` key
- Verify it has `fatigue_score` and `risk_level` properties

**Reaction test timing seems off?**
- Uses `performance.now()` (microsecond precision)
- Network latency may affect measurements
- Retest for more consistent results

---

**Questions?** Check `ARCHITECTURE_REFACTOR.md` for detailed technical documentation.
