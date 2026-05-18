# NeuroFit+ Chatbot State Machine - Quick Reference

## 🎯 Core Files

| File | Purpose | Key Exports |
|------|---------|-------------|
| `/lib/chatbotEngine.ts` | State machine + intent detection | `ChatMode` enum, `processChatMessageAsync()` |
| `/app/chatbot/page.tsx` | UI component | React component using state machine |
| `/lib/exerciseDbService.ts` | ExerciseDB API integration | `getExercisesForFocusArea()` |
| `/lib/workoutData.ts` | Local workout library (fallback) | `WORKOUT_LIBRARY`, `getWorkoutsForFocusArea()` |

---

## 🧠 State Machine Map

```
                    ┌─────────────────┐
                    │   ONBOARDING    │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
           User says "why"      User says "yes"
                    │                 │
                    ▼                 ▼
        ┌───────────────────┐  ┌─────────────────┐
        │ FATIGUE_EXPLANATION│  │ FOCUS_SELECTION │
        └──────────┬─────────┘  └────────┬────────┘
                   │                     │
         User says "okay"        User picks area
                   │                     │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │  WORKOUT_DELIVERY    │
                   └──────┬───────┬───────┘
                          │       │
                   ┌──────┘       └──────┐
            "proceed"              "adjust" or
                  │                 "change_focus"
                  │                      │
                  ▼                      ▼
            ┌──────────┐          ┌────────────┐
            │ SUMMARY  │◄────────┤ ADJUSTMENT │
            └──────────┘          └────────────┘
```

**Special Case - High Fatigue:**
- Direct to `WORKOUT_DELIVERY` with recovery-only workouts
- Skip `FOCUS_SELECTION` entirely
- All recovery mode responses

---

## 🎨 Using ChatMode

### Get Current Mode
```typescript
const mode = chatState.mode  // ChatMode.WORKOUT_DELIVERY
```

### Check Mode
```typescript
if (chatState.mode === ChatMode.SUMMARY) {
  // Show "Start New Session" button
}
```

### Valid ChatMode Values
```typescript
ChatMode.ONBOARDING
ChatMode.FATIGUE_EXPLANATION
ChatMode.WORKOUT_TYPE_SELECTION
ChatMode.FOCUS_SELECTION
ChatMode.WORKOUT_DELIVERY
ChatMode.DOUBT_HANDLING
ChatMode.ADJUSTMENT
ChatMode.SUMMARY
```

---

## 🔍 Intent Detection

### How It Works
```typescript
const intent = detectIntent(userMessage)
// Returns: WHY | SAFE | ADJUST | CHANGE_FOCUS | PROCEED | EXPLAIN_FATIGUE | GENERAL
```

### Pattern Matching
| Intent | Patterns |
|--------|----------|
| `WHY` | "why", "explain", "tell me", "how come" |
| `SAFE` | "safe", "okay", "injury", "hurt" |
| `ADJUST` | "adjust", "change", "harder", "easier" |
| `CHANGE_FOCUS` | "other", "try different", "switch" |
| `PROCEED` | "yes", "okay", "go", "ready", "start" |
| `EXPLAIN_FATIGUE` | "fatigue", "tired", "exhausted", "energy" |
| `GENERAL` | (fallback - anything else) |

---

## 📨 Message Processor

### Sync (Local Only)
```typescript
const result = processChatMessage(userInput, context, chatState)
// Returns: { response: string, newState: ChatbotState, workouts?: Workout[] }
```

### Async (With ExerciseDB)
```typescript
const result = await processChatMessageAsync(userInput, context, chatState)
// Same return type, but queries ExerciseDB if available
// Falls back to local data if API fails
```

---

## 🧪 Common Conversation Patterns

### Pattern 1: Help → Explanation → Workout
```
User: "why should I exercise?"
Bot:  → FATIGUE_EXPLANATION mode
Bot:  [Explains fatigue and benefits]
      [Asks to continue]

User: "okay, let's go"
Bot:  → FOCUS_SELECTION mode
Bot:  "What area would you like?"
```

### Pattern 2: Direct Workout Request
```
User: "I want to work on my arms"
Bot:  → FOCUS_SELECTION mode (detected "arms" focus area)
Bot:  → WORKOUT_DELIVERY mode (memory.selectedFocusArea = "arms")
Bot:  [Shows arm workouts for user's fatigue level]
```

### Pattern 3: Adjustment
```
User: "these are too hard"
Bot:  → ADJUSTMENT mode
Bot:  "I can find lighter workouts. Is moderate intensity better?"

User: "yes"
Bot:  → WORKOUT_DELIVERY mode
Bot:  [Shows moderate intensity workouts]
```

### Pattern 4: High Fatigue Recovery
```
[User has high fatigue (>70%)]
Bot:  → ONBOARDING
Bot:  "Your fatigue is HIGH. Recovery is key."

User: "okay"
Bot:  → WORKOUT_DELIVERY mode (skips FOCUS_SELECTION)
Bot:  [Shows recovery workouts only - no intense options]
```

---

## 💾 Session Memory Structure

```typescript
interface SessionMemory {
  selectedFocusArea: "arms" | "chest" | "legs" | "core" | "full_body" | null
  lastIntensity: "easy" | "medium" | "hard" | null
  selectedWorkouts: Workout[]
  askedAboutFatigue: boolean
  askedAboutFocus: boolean
}
```

### Initialize
```typescript
const initialState = initializeChatbotState()
// Returns ChatbotState with empty memory, mode = ONBOARDING
```

### Reset
```typescript
const freshState = resetChatbotState(oldState)
// Returns fresh ChatbotState for new session
```

---

## 🔗 Context Structure

```typescript
interface ChatbotContext {
  fatigueScore: number | null      // 0.0-1.0 from backend
  riskLevel: "low" | "medium" | "high" | null  // Backend classification
  timestamp?: string
}
```

### Load from Backend
```typescript
const stored = localStorage.getItem("neurofit_last_result")
const { fatigue_score, risk_level } = JSON.parse(stored)
const context: ChatbotContext = { fatigueScore: fatigue_score, riskLevel: risk_level }
```

---

## 🎙️ Response Builders (For Customization)

### Available Builders
```typescript
buildOnboardingResponse(context)              // Initial greeting
buildFatigueExplanation(context)              // Why fatigue matters
buildFocusSelectionPrompt(context, memory)    // What area to focus?
buildWorkoutDeliveryResponse(workouts, ...)   // Here are workouts
buildDoubtResponse(question)                   // Address concerns
buildSessionSummary(...)                       // Wrap-up
```

### Example: Customize a Response
```typescript
const greeting = buildOnboardingResponse(context)
const customGreeting = greeting + "\n\nTip: Start with your strongest area!"
```

---

## 🚀 Workflow: Add New Intent Type

1. Add to Intent enum:
```typescript
enum Intent {
  // ... existing intents
  MY_NEW_INTENT = "my_new_intent",
}
```

2. Add detection pattern in `detectIntent()`:
```typescript
if (/\b(my|keywords|here)\b/.test(normalized)) return Intent.MY_NEW_INTENT
```

3. Add state transition in `getNextMode()`:
```typescript
case ChatMode.WORKOUT_DELIVERY:
  if (intent === Intent.MY_NEW_INTENT) return ChatMode.DOUBT_HANDLING
  // ...
```

4. Handle in response builder or processor

---

## ⚡ Performance Tips

### Optimize Message Processing
```typescript
// ❌ Avoid: Multiple API calls per message
for (let i = 0; i < 3; i++) {
  await getExercisesForFocusArea(...)  // Too many API calls!
}

// ✅ Good: Single focused call
const exercises = await getExercisesForFocusArea(focusArea, fatigueLevel)
```

### Cache Workout Selections
```typescript
// Store in memory to avoid refetching
memory.selectedWorkouts = workouts

// Later, display from memory
result.workouts = memory.selectedWorkouts
```

---

## 🛡️ Safety: High Fatigue Rules

**NEVER BREAK THESE:**

```typescript
// If fatigue is HIGH, always show recovery only
if (fatigueScore > 0.70) {
  return getAllRecoveryWorkouts()  // ✅ Correct
  // NOT: return getWorkoutsForFocusArea(area, "high")  // ❌ Wrong
}

// If user asks for intense workout with HIGH fatigue
if (fatigueScore > 0.70 && userWantsIntenseWorkout) {
  return "Your fatigue is high. Recovery first. Let's do some gentle stretching instead."  // ✅ Correct
  // NOT: "Sure! Here's a HIIT workout"  // ❌ Wrong
}
```

---

## 📊 State Transition Rules

| From | Intent | To | Condition |
|------|--------|-----|-----------|
| ONBOARDING | PROCEED | FOCUS_SELECTION | Always |
| ONBOARDING | WHY | FATIGUE_EXPLANATION | Always |
| FOCUS_SELECTION | (focus picked) | WORKOUT_DELIVERY | memory.selectedFocusArea set |
| WORKOUT_DELIVERY | PROCEED | SUMMARY | Always |
| WORKOUT_DELIVERY | ADJUST | ADJUSTMENT | Always |
| WORKOUT_DELIVERY | CHANGE_FOCUS | FOCUS_SELECTION | Always |
| ADJUSTMENT | PROCEED | SUMMARY | Always |
| ADJUSTMENT | CHANGE_FOCUS | FOCUS_SELECTION | Always |
| SUMMARY | CHANGE_FOCUS | FOCUS_SELECTION | Always |
| SUMMARY | (new session) | ONBOARDING | Click button |

---

## 🧠 FatigueLevel Mapping

**Backend → Local:**
```
Backend "low"    → Local "low"      (fatigueScore < 0.35)
Backend "medium" → Local "moderate" (0.35 ≤ fatigueScore < 0.70)
Backend "high"   → Local "high"     (fatigueScore ≥ 0.70)
```

**Use:** `getRiskLevelLabel(riskLevel)` to convert

---

## 🔗 Import Quick Reference

```typescript
// State machine
import {
  ChatMode,
  Intent,
  type ChatbotContext,
  type ChatbotState,
  type SessionMemory,
  processChatMessage,
  processChatMessageAsync,
  detectIntent,
  getNextMode,
  initializeChatbotState,
  resetChatbotState,
  getRiskLevelLabel,
  getFatigueDescription,
} from "@/lib/chatbotEngine"

// Workouts
import {
  type Workout,
  getWorkoutsForFocusArea,
  getAllRecoveryWorkouts,
} from "@/lib/workoutData"

// ExerciseDB (optional)
import {
  getExercisesForFocusArea,
} from "@/lib/exerciseDbService"
```

---

## 🐛 Debug: Check Current State

```typescript
// In console
console.log("Mode:", chatState.mode)
console.log("Memory:", chatState.memory)
console.log("Context:", context)
console.log("Messages:", messages)

// Check localStorage
console.log(JSON.parse(localStorage.getItem("neurofit_last_result")))
```

---

## ✅ Testing Your Changes

```bash
# Type check
npm run build

# Run with dev server
npm run dev

# Check console for errors
# Open DevTools → Console tab
```

---

**Version:** 1.0  
**Status:** Production Ready ✅  
**Last Update:** January 9, 2026
