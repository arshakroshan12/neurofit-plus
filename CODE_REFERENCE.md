# Code Structure Reference

## Component Hierarchy

### Dashboard Page (`/app/page.tsx`)
```
Page (use client)
├── Header
├── Main Content
│   ├── Title & Subtitle
│   ├── Grid Layout (3 columns)
│   │   ├── Column 1 (2 cols wide)
│   │   │   ├── Cards Row
│   │   │   │   ├── FatigueOverview
│   │   │   │   └── WorkoutRecommendation
│   │   │   ├── "Run Fatigue Analysis" Button
│   │   │   └── Last Session Card
│   │   └── Column 2 (1 col)
│   │       └── WeeklyTrend
```

**Key Props:**
- `FatigueOverview` ← `fatigueScore: number | null, riskLevel: string`
- `WorkoutRecommendation` ← `fatigueScore: number | null, riskLevel: string`
- `WeeklyTrend` ← `scores: (number | null)[]` (7 elements)

**State Management:**
```typescript
const [fatigue, setFatigue] = useState<number | null>(null)
const [risk, setRisk] = useState<"low" | "medium" | "high">("low")
const [weeklyScores, setWeeklyScores] = useState<(number | null)[]>(...)

useEffect(() => {
  // Load from localStorage.getItem("neurofit_last_result")
}, [])
```

---

### Analysis Page (`/app/analysis/page.tsx`)

#### Page Structure
```
Page (use client)
├── Header
├── Title "Fatigue Analysis" + Step Counter
├── Step Renderer (Conditional)
│   ├── Step 1: SubjectiveForm
│   ├── Step 2: ReactionTestStep
│   ├── Step 3: TypingTestStep
│   └── Step 4: Summary & Analyze Button
```

#### Step 1: SubjectiveForm Component
```typescript
interface Props {
  onComplete: (data: {
    sleep_hours: number
    energy_level: number
    stress_level: number
  }) => void
}

State:
  - sleep: number (0-12, default 7)
  - energy: number (1-10, default 5)
  - stress: number (1-10, default 5)
  - submitted: boolean

UI:
  - Card with 3 sliders
  - Each slider shows current value
  - "Continue" button (disabled after submit)
```

#### Step 2: ReactionTestStep Component
```typescript
interface Props {
  onComplete: (data: {
    reaction_time_ms: number
    reaction_attempted: number
  }) => void
}

State:
  - phase: "idle" | "waiting" | "stimulus" | "done"
  - current: number (trial counter)
  - times: number[] (recorded reaction times)
  - stimulusAt: number (timestamp of stimulus)
  - trials: 2

Flow:
  1. User clicks "Start" → phase = "waiting"
  2. Random delay (800-2400ms)
  3. Green circle appears → phase = "stimulus"
  4. User taps → reaction time recorded
  5. Repeat for 2 trials
  6. Calculate average → onComplete()

UI:
  - Large green circle (stimulus)
  - Start/Reset buttons
  - Trial counter (e.g., "1 / 2")
  - "Start" disabled if done
```

#### Step 3: TypingTestStep Component
```typescript
interface Props {
  onComplete: (data: {
    average_latency_ms: number
    backspace_rate: number
    total_duration_ms: number
  }) => void
}

State:
  - sentence: string (randomly selected)
  - text: string (user input)
  - running: boolean
  - done: boolean
  - keyTimes: number[] (keystroke timestamps)
  - backspaces: number
  - total: number
  - startAt: number

Flow:
  1. Display random sentence from 5 options
  2. User clicks "Start Test"
  3. Textarea becomes enabled, capture keystrokes
  4. Auto-finish after 9 seconds
  5. Calculate metrics:
     - average_latency_ms = mean(keydown deltas)
     - backspace_rate = backspaces / total_keystrokes
     - total_duration_ms = finish_time - start_time
  6. onComplete(metrics)

UI:
  - Sentence preview box
  - Textarea for typing
  - Start/Finish/Reset buttons
  - Textarea disabled until Start clicked
```

#### Step 4: Review Card
```
Card Display:
  - Title: "Ready to Analyze"
  - Subtitle: "All tests complete..."
  - Checklist:
    ✓ Subjective inputs collected
    ✓ Reaction time measured: {ms}ms
    ✓ Typing patterns captured
  - "Analyze Results" Button
  - "Start Over" Button

On "Analyze Results":
  1. Combine all data into payload
  2. Call predictFatigue(payload)
  3. On success:
     - localStorage.setItem("neurofit_last_result", ...)
     - router.push("/")
  4. On error:
     - alert("Prediction service failed...")
```

---

## Data Flow Diagram

```
Dashboard (/)
    |
    v [User clicks "Run Fatigue Analysis"]
Analysis (/analysis)
    |
    v [Step 1: Input sliders]
    { sleep_hours: 7, energy_level: 5, stress_level: 5 }
    |
    v [Step 2: Reaction test]
    { reaction_time_ms: 425, reaction_attempted: 1 }
    |
    v [Step 3: Typing test]
    { average_latency_ms: 185, backspace_rate: 0.05, total_duration_ms: 9000 }
    |
    v [Step 4: Combine & Submit]
    Payload = {
      timestamp: "2025-12-18T10:30:00.000Z",
      answers: { sleep_hours, energy_level, stress_level },
      task_performance: { reaction_time_ms, reaction_attempted },
      typing_features: { average_latency_ms, backspace_rate, total_duration_ms }
    }
    |
    v [POST to backend]
    https://neurofit-plus.onrender.com/predict_fatigue
    |
    v [Backend returns]
    { fatigue_score: 65, risk_level: "medium" }
    |
    v [Store in localStorage]
    localStorage.setItem("neurofit_last_result", {
      fatigue_score: 65,
      risk_level: "medium",
      timestamp: "..."
    })
    |
    v [Navigate home]
    router.push("/")
    |
    v Dashboard (/)
    |
    v [useEffect detects localStorage change]
    setFatigue(65)
    setRisk("medium")
    setWeeklyScores([65, ...previous 6])
    |
    v [Render updated dashboard]
    Shows fatigue score, recommendation, weekly trend
```

---

## Component Integration

### Reused Components

**ReactionTest Component**
- Located: `/components/reaction-test.tsx`
- Used In: `/app/analysis/page.tsx` (Step 2)
- Props: `onComplete: (data) => void`
- Behavior: Unchanged from original

**TypingTest Component**
- Located: `/components/typing-test.tsx`
- Used In: `/app/analysis/page.tsx` (Step 3)
- Props: `onComplete: (data) => void`
- Behavior: Unchanged from original

**FatigueOverview Component**
- Located: `/components/fatigue-overview.tsx`
- Used In: `/app/page.tsx` (Dashboard)
- Props: `fatigueScore: number | null, riskLevel: string`
- Shows: Circular progress with fatigue score

**WorkoutRecommendation Component**
- Located: `/components/workout-recommendation.tsx`
- Used In: `/app/page.tsx` (Dashboard)
- Props: `fatigueScore: number | null, riskLevel: string`
- Shows: Personalized workout advice

**WeeklyTrend Component**
- Located: `/components/weekly-trend.tsx`
- Used In: `/app/page.tsx` (Dashboard)
- Props: `scores: (number | null)[]`
- Shows: 7-day history

**Header Component**
- Located: `/components/header.tsx`
- Used In: All pages
- Shows: Navigation links (Dashboard, Chatbot, Login)

---

## API Integration

### predictFatigue Function
**Location:** `/lib/api.tsx`

```typescript
async function predictFatigue(payload: {
  timestamp: string
  answers: {
    sleep_hours: number
    energy_level: number
    stress_level: number
  }
  task_performance: {
    reaction_time_ms: number
    reaction_attempted: number
  }
  typing_features: {
    average_latency_ms: number
    backspace_rate: number
    total_duration_ms: number
  }
}): Promise<{
  fatigue_score: number
  risk_level: "low" | "medium" | "high"
}>
```

**Endpoint:** `POST https://neurofit-plus.onrender.com/predict_fatigue`

**Error Handling:**
```typescript
try {
  const res = await predictFatigue(payload)
  // Success
} catch (err) {
  console.error("Analysis failed:", err)
  alert("Prediction service failed. Please try again.")
}
```

---

## State Management Pattern

### Dashboard Page
```typescript
// 1. Load initial state
useEffect(() => {
  const saved = localStorage.getItem("neurofit_last_result")
  if (saved) {
    const { fatigue_score, risk_level } = JSON.parse(saved)
    setFatigue(fatigue_score)
    setRisk(risk_level)
    setWeeklyScores(prev => [fatigue_score, ...prev.slice(0, 6)])
  }
}, []) // Run once on mount

// 2. Render with current state
return (
  <FatigueOverview fatigueScore={fatigue} riskLevel={risk} />
  // ... etc
)
```

### Analysis Page
```typescript
// 1. Maintain step state
const [step, setStep] = useState(1)

// 2. Collect data from each step
const [subjectiveData, setSubjectiveData] = useState(null)
const [reactionData, setReactionData] = useState(null)
const [typingData, setTypingData] = useState(null)

// 3. On step completion
const handleStepComplete = (data) => {
  setSubjectiveData(data)
  setStep(2) // Move to next step
}

// 4. On analyze
async function handleAnalyze() {
  const payload = {
    timestamp: new Date().toISOString(),
    answers: subjectiveData,
    task_performance: reactionData,
    typing_features: typingData,
  }
  
  try {
    const res = await predictFatigue(payload)
    localStorage.setItem("neurofit_last_result", JSON.stringify({
      fatigue_score: res.fatigue_score,
      risk_level: res.risk_level,
      timestamp: new Date().toISOString(),
    }))
    router.push("/")
  } catch (err) {
    alert("Prediction service failed. Please try again.")
  }
}
```

---

## CSS Classes Used

### Layout
- `min-h-screen` - Full viewport height
- `bg-background` - Page background (near-white)
- `max-w-4xl` / `max-w-6xl` - Content width
- `mx-auto` - Center content
- `p-8` - Padding

### Components
- `rounded-2xl` - Rounded corners on cards
- `border border-border` - Card borders
- `bg-card` - Card background (white)
- `p-10` - Card padding
- `shadow-sm` - Subtle shadow

### Typography
- `text-3xl font-bold` - Page title
- `text-muted-foreground` - Subtitle color
- `text-sm` - Help text

### Forms
- `w-full` - Full width inputs
- `rounded-lg` - Input corners
- `border-input` - Input border
- `bg-input` - Input background
- `focus:ring-2 focus:ring-ring` - Focus state
- `accent-primary` - Slider thumb color

### Buttons
- `bg-primary` - Primary button color
- `text-primary-foreground` - Button text
- `hover:opacity-90` - Hover effect
- `disabled:opacity-50` - Disabled state
- `px-4 py-2` - Button padding
- `rounded-lg` - Button corners

### Grid
- `grid grid-cols-1 md:grid-cols-2` - 2-column grid
- `gap-6` - Spacing between items

---

## Color Variables (from globals.css)

```css
--primary: oklch(0.55 0.18 210)       /* Blue */
--secondary: oklch(0.6 0.15 195)      /* Teal */
--accent: oklch(0.58 0.16 200)        /* Blue */
--background: oklch(0.98 0.005 240)   /* Near white */
--card: oklch(1 0 0)                  /* White */
--border: oklch(0.95 0.002 220)       /* Light gray */
--input: oklch(0.98 0.005 240)        /* Near white */
--ring: oklch(0.55 0.18 210)          /* Blue */
--foreground: oklch(0 0 0)            /* Black */
--muted-foreground: oklch(0.5 0 0)    /* Gray */
```

---

## Key Files Summary

| File | Type | Size | Purpose |
|------|------|------|---------|
| `/app/page.tsx` | Component | ~150 LOC | Dashboard (Summary) |
| `/app/analysis/page.tsx` | Component | ~400 LOC | Analysis (4-step) |
| `/components/header.tsx` | Component | ~60 LOC | Navigation |
| `/components/reaction-test.tsx` | Component | ~120 LOC | Reaction test |
| `/components/typing-test.tsx` | Component | ~150 LOC | Typing test |
| `/lib/api.tsx` | Function | ~30 LOC | Backend wrapper |
| `/app/globals.css` | Styles | ~80 LOC | Color system |

**Total New/Modified Code:** ~800 LOC

---

## Deployment Checklist

- [ ] Run `npm run build` (production build)
- [ ] Run `npm run start` (test production)
- [ ] Test on http://localhost:3000
- [ ] Verify all pages load
- [ ] Test complete flow (dashboard → analysis → results)
- [ ] Check DevTools for console errors
- [ ] Verify localStorage persistence
- [ ] Test on mobile (portrait/landscape)
- [ ] Deploy to Vercel/Netlify
- [ ] Set backend URL to production if needed

---

**This document is a quick reference for code structure and integration points.**  
**For detailed explanations, see ARCHITECTURE_REFACTOR.md and QUICK_START.md**
