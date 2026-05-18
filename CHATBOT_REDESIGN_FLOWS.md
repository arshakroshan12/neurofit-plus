/**
 * NeuroFit+ Chatbot Redesign - Test Cases & Flow Documentation
 * 
 * This document outlines all conversation flows and expected behaviors
 * for the adaptive, fatigue-aware chatbot.
 */

// ============================================================
// SCENARIO 1: High Fatigue Level
// ============================================================

/*
USER STATE:
- fatigueScore: 0.8 (High)
- riskLevel: "high"

EXPECTED FLOW:

1. Initial Load:
   BOT: "Your fatigue level is high. Recovery is the priority today. I recommend rest, light stretching, or restorative yoga to help you recharge. These activities will prepare you for full training when your fatigue decreases."
   (Status card shows "High" in red with warning)

2. User asks: "Can I do a workout?"
   BOT: "Your fatigue level is high today. Your body needs recovery more than intense training. I recommend:
   • Gentle stretching (10-15 minutes)
   • Recovery yoga or restorative flow
   • Light mobility work
   • Breathing and mindfulness exercises
   These activities will help reduce fatigue and prepare you for full training when you're more rested. Quality recovery today means better performance tomorrow."
   
   WORKOUTS: Show recovery-only workouts (gentle stretching, yoga, breathing exercises)

3. User asks: "What about arms?"
   BOT: Same recovery guidance (High fatigue always overrides focus area selection)

4. User asks: "I'm depressed"
   BOT: "I can explain cognitive fatigue and performance, but I cannot diagnose or treat medical conditions or injuries. For health concerns, please consult a healthcare professional."

CONVERSATIONAL STATE:
- waitingForWorkoutFocus: false
- selectedFocusArea: null
- selectedWorkouts: [recovery workouts]
*/

// ============================================================
// SCENARIO 2: Moderate Fatigue - Multi-turn Flow
// ============================================================

/*
USER STATE:
- fatigueScore: 0.5 (Moderate)
- riskLevel: "medium"

EXPECTED FLOW:

1. Initial Load:
   BOT: "Your fatigue level is moderate. I can help you find a suitable workout. What area would you like to focus on today? Choose from: arms, chest, legs, core, or full body."
   (Status card shows "Moderate" in yellow)
   
   CONVERSATIONAL STATE:
   - waitingForWorkoutFocus: true
   - selectedFocusArea: null
   - selectedWorkouts: []

2. User types: "I want to work on my legs"
   PARSER: Detects "legs" focus area
   BOT: "Since your fatigue level is moderate, I've selected workouts with moderate intensity and good recovery breaks to match your current state."
   
   WORKOUTS: [
     - "Lower-Body Strength" (moderate)
     - "Beginner Bodyweight Circuit" (moderate)
   ]
   
   CONVERSATIONAL STATE:
   - waitingForWorkoutFocus: false
   - selectedFocusArea: "legs"
   - selectedWorkouts: [2 workouts]

3. User asks: "What about arms?"
   PARSER: Detects "arms" focus area
   BOT: "Since your fatigue level is moderate, I've selected workouts with moderate intensity and good recovery breaks to match your current state."
   
   WORKOUTS: [
     - "Upper-Body Sculpt" (moderate)
     - "Strength & Stability Mix" (moderate)
   ]
   
   CONVERSATIONAL STATE:
   - selectedFocusArea: "arms"
   - selectedWorkouts: [2 workouts]

4. User asks: "Can I do something harder?"
   BOT: "Your fatigue level supports normal training. Warm up well and adjust intensity if concentration drops."
   (No workout switch - acknowledge but stay with moderate recommendations)

CONVERSATIONAL STATE remains:
- waitingForWorkoutFocus: false
- selectedFocusArea: "arms"
- selectedWorkouts: [moderate arm workouts]
*/

// ============================================================
// SCENARIO 3: Low Fatigue - Max Intensity
// ============================================================

/*
USER STATE:
- fatigueScore: 0.2 (Low)
- riskLevel: "low"

EXPECTED FLOW:

1. Initial Load:
   BOT: "Your fatigue level is low. I can help you find a suitable workout. What area would you like to focus on today? Choose from: arms, chest, legs, core, or full body."
   (Status card shows "Low" in green)
   
   CONVERSATIONAL STATE:
   - waitingForWorkoutFocus: true

2. User types: "Full body"
   BOT: "Since your fatigue level is low, you can handle higher intensity training today. I've selected workouts that challenge you while maintaining safety."
   
   WORKOUTS: [
     - "Full-Body Functional Workout" (hard)
     - "Beginner Bodyweight Circuit" (medium)
   ]

3. User asks: "Help me improve fatigue"
   BOT: "To manage fatigue: prioritize 7-9 hours of sleep, stay hydrated, take regular breaks from focused work, and match your training intensity to your fatigue level. Recovery workouts on high-fatigue days are key."
*/

// ============================================================
// SCENARIO 4: Invalid Focus Area Input
// ============================================================

/*
CONVERSATIONAL STATE: waitingForWorkoutFocus: true

1. User types: "shoulders"
   PARSER: Tries to match against FOCUS_AREAS and aliases
   - "shoulders" → maps to "arms" via aliases
   
   BOT: Returns workouts for arms

2. User types: "xyz123"
   PARSER: No match found
   
   BOT: "I didn't quite catch that. Please choose a focus area: arms, chest, legs, core, or full body."
   
   CONVERSATIONAL STATE remains: waitingForWorkoutFocus: true
*/

// ============================================================
// SCENARIO 5: No Fatigue Data
// ============================================================

/*
USER STATE:
- localStorage.getItem("neurofit_last_result") returns null

EXPECTED FLOW:

1. Initial Load:
   BOT: "Hello. I'm NeuroFit Coach, your adaptive workout advisor. Please run a fatigue analysis first so I can recommend workouts tailored to your current state."
   (No status card shown)
   
   CONVERSATIONAL STATE:
   - waitingForWorkoutFocus: false
   - selectedFocusArea: null

2. User asks: "What workout should I do?"
   BOT: "Hello. I'm NeuroFit Coach, your adaptive workout advisor. Please run a fatigue analysis first so I can recommend workouts tailored to your current state."
*/

// ============================================================
// FOCUS AREA PARSING LOGIC
// ============================================================

/*
The parser uses these strategies in order:

1. EXACT MATCH: "legs" → "legs"
2. ALIAS MATCH:
   - "shoulders" → "arms"
   - "quads" → "legs"
   - "glutes" → "legs"
   - "abs" → "core"
   - "pecs" → "chest"
   - "back" → "full_body"
   - "overall" → "full_body"
   - etc.

If no match: Return null and ask user to clarify
*/

// ============================================================
// WORKOUT CARD DISPLAY
// ============================================================

/*
Each recommended workout shows:
- Title
- Description
- Duration (mins)
- Intensity (easy/medium/hard)
- Expandable steps/details

Example:
┌─────────────────────────────────────┐
│ Lower-Body Strength                 │
│ Controlled lower body workout with  │
│ adequate rest between sets...       │
│ 18 min | medium                     │
│ ▶ View steps                        │
└─────────────────────────────────────┘
*/

// ============================================================
// SAFETY CONSTRAINTS (Implemented)
// ============================================================

/*
1. Medical/Mental Health Gating:
   If user mentions: depression, adhd, anxiety, disorder, sick, disease, diagnose, injury, pain
   → Show disclaimer and refuse diagnosis/treatment suggestions

2. High Fatigue Gating:
   If fatigueScore >= 0.67 (High)
   → ALWAYS show recovery workouts only, regardless of focus area request

3. No Hallucinated Workouts:
   → All workouts come from predefined WORKOUT_LIBRARY
   → User intent is only respected within fatigue-safe limits

4. Conversational State Validation:
   → State resets if fatigue data becomes null
   → State updates explicitly on focus area selection
*/

// ============================================================
// TONE & LANGUAGE REQUIREMENTS
// ============================================================

/*
✓ Professional fitness coach tone
✓ Supportive, calm, concise
✓ NO emojis
✓ NO numeric fatigue values (use "low", "moderate", "high")
✓ Qualitative fatigue labels only

Example good response:
"Since your fatigue level is moderate, I've selected workouts with moderate intensity and good recovery breaks to match your current state."

Example bad response:
"Your fatigue is 0.5 🔥 - try these hardcore gains workouts!"
*/

// ============================================================
// MULTI-TURN INTERACTION
// ============================================================

/*
Key behavior:
- Chatbot asks ONE follow-up question when appropriate (focus area)
- User responds with focus area
- Chatbot uses fatigue level + focus area to recommend workouts
- This is NOT a single-response interaction

Turn 1: User provides input
Turn 2: Bot responds with question (if needed) or recommendations
Turn 3: User clarifies/selects focus area
Turn 4: Bot provides recommendations with workouts

All turns tracked in conversational state.
*/

// ============================================================
// IMPLEMENTATION CHECKLIST
// ============================================================

/*
Files Created:
✓ /frontend-next/lib/workoutData.ts
  - WorkoutsByArea type with focus area × fatigue level matrix
  - WORKOUT_LIBRARY data structure (predefined, no hallucination)
  - Helper functions: getWorkoutsForFocusArea(), getAllRecoveryWorkouts()

✓ /frontend-next/lib/chatbotService.ts
  - ChatbotContext & ChatbotState types
  - processChatMessage() main logic function
  - parseFocusAreaFromInput() for intent detection
  - generateInitialResponse() for greeting logic
  - generateWorkoutResponse() for recommendations
  - generateRecoveryOnlyResponse() for high fatigue
  - All safety checks (medical terms, fatigue gating)

✓ /frontend-next/app/chatbot/page.tsx
  - ChatbotPage component with state management
  - WorkoutCard sub-component for display
  - Multi-turn conversation tracking
  - Auto-scroll to latest message
  - Enhanced UI with color-coded fatigue levels
  - Help text for user guidance

Features Implemented:
✓ Fatigue-aware gating (High = recovery only)
✓ Multi-turn conversation flow
✓ Explicit state transitions (waitingForWorkoutFocus, selectedFocusArea)
✓ Focus area parsing with aliases
✓ Predefined workout data (no hallucination)
✓ Professional tone without emojis
✓ Safety constraints (medical/mental health, extreme workouts)
✓ Conversational state validation
✓ Qualitative fatigue labels only
*/
