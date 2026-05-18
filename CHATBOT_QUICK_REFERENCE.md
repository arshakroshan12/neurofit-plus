# NeuroFit+ Chatbot Redesign - Quick Reference

## 🚀 Quick Start (30 seconds)

### Files to Review
1. **`lib/workoutData.ts`** — Workout library (30 workouts)
2. **`lib/chatbotService.ts`** — Conversation logic
3. **`app/chatbot/page.tsx`** — UI component
4. **`CHATBOT_REDESIGN_QUICKSTART.md`** — Testing guide

### What Changed
- ✅ Chatbot now asks multi-turn questions
- ✅ Recommends workouts by focus area + fatigue
- ✅ High fatigue = recovery only
- ✅ Low/Moderate fatigue = user chooses area

---

## 🎯 The 3 Conversation Paths

### Path 1: High Fatigue (Score ≥ 0.67)
```
Bot: "Recovery is priority. Here's restorative yoga..."
→ Always shows recovery workouts
→ Ignores focus area requests
```

### Path 2: Moderate Fatigue (0.33–0.67)
```
Bot: "What area? (arms, chest, legs, core, full body)"
User: "legs"
Bot: "Here's moderate-intensity leg workouts..."
```

### Path 3: Low Fatigue (Score < 0.33)
```
Bot: "What area would you like?"
User: "full body"
Bot: "You can handle high-intensity training..."
→ Shows challenging workouts
```

---

## 📝 Key Functions

### In `chatbotService.ts`

**Main Function:**
```typescript
processChatMessage(userMessage, context, state)
→ { response, newState, workouts? }
```

**Parsing:**
```typescript
parseFocusAreaFromInput("I want to do shoulders")
→ "arms"  // Via alias matching
```

**Generation:**
```typescript
generateInitialResponse(context, state)
→ "Your fatigue level is low. What area..."
```

---

## 💾 Key Data Structures

### Fatigue Levels
```
0.0 → 0.33: "low"      (🟢 green)
0.33 → 0.67: "moderate" (🟡 yellow)
0.67 → 1.0: "high"      (🔴 red)
```

### Focus Areas
- "arms" | "chest" | "legs" | "core" | "full_body"

### Conversation State
```typescript
{
  waitingForWorkoutFocus: boolean,
  selectedFocusArea: string | null,
  selectedWorkouts: Workout[]
}
```

---

## 🧪 Test These Scenarios

| Scenario | What to Test | Expected Result |
|----------|-------------|-----------------|
| High Fatigue | Ask for workout | Recovery suggestions only |
| Moderate | Type "legs" | Moderate leg workouts |
| Low | Type "full body" | High-intensity workouts |
| Alias | Type "quads" | Maps to "legs" |
| Safety | Type "depressed" | Shows medical disclaimer |
| Switch | Change focus area | Updates workout list |

---

## 🔑 Focus Area Aliases

```
→ "arms": shoulder, biceps, tricep
→ "chest": pecs, breast
→ "legs": quad, hamstring, glute, calf, thigh
→ "core": abs, abdominal, abdomen
→ "full_body": back, upper, everything, overall
```

---

## ⚙️ How It Works (Flow)

```
1. User runs fatigue analysis
2. Fatigue score saved to localStorage
3. Chatbot component loads score
4. If high → show recovery message
5. If low/moderate → ask for focus area
6. User types: "legs" (or "quads", etc.)
7. Parser detects focus area
8. Fetch workouts for: area + fatigueLevel
9. Display 2–3 workout recommendations
10. User can switch areas or ask questions
```

---

## 📦 File Sizes & Import

```typescript
// Import in any component
import { processChatMessage } from '@/lib/chatbotService'
import { Workout, getWorkoutsForFocusArea } from '@/lib/workoutData'

// Bundle size impact
workoutData.ts: ~25 KB (one-time load)
chatbotService.ts: ~10 KB (one-time load)
Total: ~35 KB added (minimal)
```

---

## 🎨 UI Layout

```
┌─────────────────────────────────┐
│     NeuroFit Coach              │
│  Status: Moderate (yellow)      │
├─────────────────────────────────┤
│                                 │
│  Bot: "What area?"              │
│                                 │
│  You: "legs"                    │
│                                 │
│  Bot: "I recommend..."          │
│  ┌─ Lower Body Strength ─┐      │
│  │ 18 min | medium       │      │
│  │ ▶ View steps          │      │
│  └───────────────────────┘      │
├─────────────────────────────────┤
│ [Type message...]   [Send]      │
└─────────────────────────────────┘
```

---

## ✅ Verification Checklist

- [x] No TypeScript errors
- [x] All imports resolve
- [x] Fatigue-aware gating works
- [x] Multi-turn flow functional
- [x] State management correct
- [x] Safety constraints active
- [x] UI responsive
- [x] No console errors
- [x] Documentation complete

---

## 🚨 Safety Guards

These will **block** the chatbot:
- "depression", "adhd", "anxiety"
- "disorder", "sick", "disease"
- "diagnose", "injury", "pain"

Response:
```
"I cannot diagnose medical conditions.
Please consult a healthcare professional."
```

---

## 💬 Response Templates

### Initial (Moderate)
```
"Your fatigue level is moderate. I can help you find a 
suitable workout. What area would you like to focus on 
today? Choose from: arms, chest, legs, core, or full body."
```

### Recommendation (Moderate)
```
"Since your fatigue level is moderate, I've selected 
workouts with moderate intensity and good recovery breaks 
to match your current state."
```

### Recovery Only (High)
```
"Your fatigue level is high. Your body needs recovery more 
than intense training. I recommend:
• Gentle stretching (10-15 minutes)
• Recovery yoga or restorative flow
• Light mobility work
• Breathing and mindfulness exercises"
```

---

## 🔧 Debugging Tips

**Chatbot not responding?**
1. Check browser console for errors
2. Verify `localStorage.getItem("neurofit_last_result")` exists
3. Run fatigue analysis again
4. Clear localStorage and reload

**Wrong workouts shown?**
1. Verify focus area parsed correctly
2. Check fatigue score range (0–1)
3. Confirm `workoutData.ts` imported
4. Check browser DevTools Network tab

**State not updating?**
1. Check ChatbotState interface
2. Verify `setChatState()` called
3. Ensure `processChatMessage()` returns newState
4. Check React DevTools for hook updates

---

## 📚 More Information

- **Full Architecture**: See `CHATBOT_ARCHITECTURE.md`
- **Test Cases**: See `CHATBOT_REDESIGN_FLOWS.md`
- **Testing Guide**: See `CHATBOT_REDESIGN_QUICKSTART.md`
- **Implementation Details**: Check JSDoc comments in source files

---

## 🎓 Code Examples

### Use the service directly:
```typescript
import { processChatMessage } from '@/lib/chatbotService'

const result = processChatMessage(
  "I want to train legs",
  { fatigueScore: 0.5, riskLevel: "medium" },
  { waitingForWorkoutFocus: true, selectedFocusArea: null, selectedWorkouts: [] }
)

console.log(result.response)      // Recommended leg workouts...
console.log(result.newState)      // { selectedFocusArea: "legs", ... }
console.log(result.workouts)      // [Workout[], Workout[]]
```

### Get workouts for an area:
```typescript
import { getWorkoutsForFocusArea } from '@/lib/workoutData'

const workouts = getWorkoutsForFocusArea("arms", "moderate")
// Returns 2 arm workouts for moderate fatigue
```

### Get all recovery workouts:
```typescript
import { getAllRecoveryWorkouts } from '@/lib/workoutData'

const recovery = getAllRecoveryWorkouts()
// Returns all high-fatigue recovery workouts (unique by ID)
```

---

## 🎯 Remember

- **Fatigue is King**: High fatigue always overrides user requests
- **State Matters**: Always update conversational state
- **No Hallucination**: Workouts only from predefined library
- **Multi-Turn**: Bot asks questions, doesn't just respond
- **Professional**: No emojis, qualitative language only
- **Safe**: Always check for medical terms first

---

## 📞 Status

**Version**: 1.0
**Status**: ✅ Production Ready
**Last Updated**: 2025-12-19
**Files**: 3 core + 4 documentation
**Test Coverage**: 6 main scenarios documented

---

**Ready to deploy! 🚀**
