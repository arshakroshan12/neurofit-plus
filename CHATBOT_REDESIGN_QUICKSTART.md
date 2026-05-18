# NeuroFit+ Adaptive Chatbot Redesign - Quick Start

## Overview

The chatbot has been redesigned to support **adaptive, user-driven workout selection** based on fatigue level. It now provides multi-turn conversations instead of static responses.

## Key Features

### 1. **Fatigue-Aware Gating**
- **High Fatigue (≥0.67)**: Bot suggests recovery workouts only (stretching, yoga, breathing)
- **Moderate Fatigue (0.33–0.67)**: Bot asks for focus area, recommends moderate intensity workouts
- **Low Fatigue (<0.33)**: Bot asks for focus area, recommends challenging workouts

### 2. **Multi-Turn Conversation Flow**
1. User runs fatigue analysis
2. Bot shows current fatigue level and asks: "What area would you like to focus on?"
3. User responds with: arms, chest, legs, core, or full body
4. Bot recommends appropriate workouts for that focus area + fatigue level

### 3. **Predefined Workout Library**
All workouts are predefined by focus area and fatigue level—no hallucination. Workouts include:
- Title & description
- Duration & intensity level
- Step-by-step instructions

### 4. **Safety Constraints**
- ❌ Won't diagnose medical/mental health conditions
- ❌ Never suggests extreme workouts
- ❌ Always respects fatigue limits
- ✓ Only respects user intent within safe limits

### 5. **Professional Tone**
- No emojis
- No numeric fatigue values
- Qualitative labels: "Low", "Moderate", "High"
- Supportive, calm, concise language

---

## File Structure

```
frontend-next/lib/
├── workoutData.ts          # Structured workout library by focus area & fatigue
├── chatbotService.ts       # Conversation logic & state management

frontend-next/app/chatbot/
└── page.tsx                # Updated UI component with multi-turn support
```

---

## Testing the Chatbot

### Test Case 1: High Fatigue
1. In the fatigue analysis, set fatigue score to **0.8+**
2. Navigate to the chatbot page
3. **Expected**: Bot shows recovery guidance, offers recovery workouts only

```
Bot: "Your fatigue level is high. Recovery is the priority today..."
```

### Test Case 2: Moderate Fatigue – Multi-Turn Flow
1. Set fatigue score to **0.5**
2. Navigate to chatbot
3. **Expected**: Bot asks "What area would you like to focus on?"
4. Type: "legs"
5. **Expected**: Bot recommends moderate-intensity leg workouts

### Test Case 3: Low Fatigue – High Intensity
1. Set fatigue score to **0.2**
2. Type: "full body"
3. **Expected**: Bot recommends high-intensity full-body workouts

### Test Case 4: Focus Area Aliases
Try different ways to say the same area:
- "shoulders" → interpreted as "arms"
- "quads" → interpreted as "legs"
- "glutes" → interpreted as "legs"
- "abs" → interpreted as "core"
- "pecs" → interpreted as "chest"

### Test Case 5: Safety Constraints
Try these phrases:
- "I have depression" → Should show medical disclaimer
- "I'm injured" → Should show injury disclaimer
- Any medical term → Should refuse diagnosis

---

## Conversation States

The chatbot tracks these states:

```typescript
{
  waitingForWorkoutFocus: boolean   // Waiting for user to pick focus area
  selectedFocusArea: FocusArea | null  // Which area user selected
  selectedWorkouts: Workout[]       // Current recommendations
}
```

These states update as the user interacts.

---

## Workout Recommendations by Fatigue Level

### High Fatigue
- Gentle Stretching Routine (10 min, easy)
- Recovery Yoga Flow (20 min, easy)
- Breathing & Mindfulness Reset (8 min, easy)
- Low-Impact Recovery Circuit (12 min, easy)

### Moderate Fatigue
- Beginner Bodyweight Circuit (15 min, medium)
- Strength & Stability Mix (20 min, medium)
- Lower-Body Strength (18 min, medium with 2 min rest)
- Core Strength Builder (15 min, medium)

### Low Fatigue
- Full-Body Functional Workout (22 min, hard)
- Upper-Body Sculpt (15 min, medium to hard)
- Complex strength circuits with minimal rest

---

## UI Improvements

### Status Card
- Fatigue level color-coded: 🟢 Low | 🟡 Moderate | 🔴 High
- Shows current risk level
- Red alert banner if fatigue is high

### Chat Messages
- User messages: right-aligned in primary color
- Bot messages: left-aligned in muted background
- Auto-scroll to latest message

### Workout Cards
- Title and description
- Duration + intensity badges
- Expandable steps (click "View steps")
- Consistent spacing and styling

### Input Area
- Placeholder: "Ask about workouts, fatigue, or recovery..."
- Enter key to send
- Clear button/confirmation

---

## Integration with Existing Features

- **Fatigue Analysis**: Chatbot reads `localStorage.getItem("neurofit_last_result")`
- **Dashboard**: No changes—chatbot is independent feature
- **Workout Library**: Uses localized data structure (not API calls)
- **Styling**: Uses existing Tailwind + shadcn/ui theme

---

## Common Conversation Examples

### Example 1: High Fatigue
```
User: Hi, what should I do?
Bot: Your fatigue level is high. Recovery is the priority today. I recommend rest, light stretching, or restorative yoga...
[Shows recovery workouts]

User: Can I do arms?
Bot: [Repeats recovery guidance—High fatigue overrides focus areas]
```

### Example 2: Moderate Fatigue
```
User: Hi
Bot: Your fatigue level is moderate. What area would you like to focus on? (arms, chest, legs, core, full body)

User: Legs
Bot: Since your fatigue level is moderate, I've selected workouts with moderate intensity...
[Shows leg workouts: Lower-Body Strength, Beginner Circuit]

User: What about arms?
Bot: Since your fatigue level is moderate...
[Shows arm workouts: Upper-Body Sculpt, Stability Mix]
```

### Example 3: Low Fatigue
```
User: Full body
Bot: You can handle higher intensity training today. I've selected workouts that challenge you...
[Shows Full-Body Functional Workout (hard) + options]
```

---

## Deployment Notes

1. No backend changes required
2. No API modifications needed
3. Uses existing fatigue score from localStorage
4. All data is client-side (workoutData.ts)
5. Compatible with existing styling system

---

## Future Enhancements

- [ ] Save favorite focus areas
- [ ] Track completed workouts from chat
- [ ] Personalized recommendations based on profile
- [ ] Difficulty adjustments based on fitness level
- [ ] Integration with calendar for scheduling

---

## Troubleshooting

**Bot not responding?**
- Clear localStorage and reload
- Check browser console for errors
- Verify fatigue score is set (0–1 range)

**Workouts not showing?**
- Ensure fatigue data exists in localStorage
- Check that focus area was parsed correctly
- Verify `workoutData.ts` is imported correctly

**Wrong fatigue level detected?**
- Run fatigue analysis again
- Verify score calculation (should be 0–1, not 0–100)

---

## Files Modified/Created

✅ Created: `/lib/workoutData.ts` — Structured workout library
✅ Created: `/lib/chatbotService.ts` — Conversation logic & state
✅ Updated: `/app/chatbot/page.tsx` — Multi-turn UI component
✅ Created: `/CHATBOT_REDESIGN_FLOWS.md` — Detailed flows & test cases
