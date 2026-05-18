/**
 * Chatbot service for NeuroFit+ adaptive workout recommendations.
 * Handles conversation state, fatigue-aware logic, and multi-turn interactions.
 *
 * Architecture:
 * - Fatigue thresholds and safety rules are LOCAL and DETERMINISTIC
 * - ExerciseDB (via exerciseDbService) provides ONLY exercise data
 * - All decisions about what exercises are safe/appropriate are made here
 * - Fallback to local workoutData.ts is automatic and graceful
 */

import {
  FatigueLevel,
  FocusArea,
  FOCUS_AREAS,
  Workout,
  getWorkoutsForFocusArea,
  getAllRecoveryWorkouts,
  getFocusAreaLabel,
} from "./workoutData"
import {
  fetchExercises,
  convertToWorkouts,
} from "./exerciseApiService"

export interface ChatbotContext {
  fatigueScore: number | null // Raw 0-1
  riskLevel: "low" | "medium" | "high" | null
  timestamp?: string
}

export interface ChatbotState {
  waitingForWorkoutFocus: boolean
  selectedFocusArea: FocusArea | null
  selectedWorkouts: Workout[]
}

export type ChatMessage = {
  from: "user" | "bot"
  text: string
  workouts?: Workout[] // Optional: for displaying workout recommendations
}

/**
 * Convert raw fatigue score to qualitative label
 * Thresholds: 0.00–0.35 = low, 0.35–0.70 = moderate, 0.70–1.00 = high
 */
export function getFatigueLabel(score: number | null): FatigueLevel | null {
  if (score === null) return null
  if (score < 0.35) return "low"
  if (score < 0.70) return "moderate"
  return "high"
}

/**
 * Convert fatigue score to human-readable description
 */
export function getFatigueLevelDescription(level: FatigueLevel): string {
  const descriptions: Record<FatigueLevel, string> = {
    low: "Low",
    moderate: "Moderate",
    high: "High",
  }
  return descriptions[level]
}

/**
 * Parse user input to detect focus area mention
 */
export function parseFocusAreaFromInput(
  input: string
): FocusArea | null {
  const normalized = input.toLowerCase().trim()

  // Check for exact or partial matches
  for (const area of FOCUS_AREAS) {
    if (normalized.includes(area.replace("_", " "))) {
      return area
    }
  }

  // Check for common aliases
  const aliases: Record<string, FocusArea> = {
    upper: "arms",
    arms: "arms",
    biceps: "arms",
    triceps: "arms",
    shoulders: "arms",
    back: "full_body",
    chest: "chest",
    pecs: "chest",
    breast: "chest",
    legs: "legs",
    quads: "legs",
    hamstrings: "legs",
    glutes: "legs",
    thighs: "legs",
    calves: "legs",
    core: "core",
    abs: "core",
    abdominal: "core",
    abdomen: "core",
    full: "full_body",
    body: "full_body",
    overall: "full_body",
    everything: "full_body",
  }

  for (const [alias, area] of Object.entries(aliases)) {
    if (normalized.includes(alias)) {
      return area
    }
  }

  return null
}

/**
 * Check if user input is asking about focus areas
 */
export function isAskingAboutFocusArea(input: string): boolean {
  const normalized = input.toLowerCase()
  const keywords = [
    "what area",
    "which area",
    "where",
    "focus",
    "target",
    "work on",
    "train",
    "muscle",
  ]
  return keywords.some((kw) => normalized.includes(kw))
}

/**
 * Generate initial greeting or ask for focus area
 */
export function generateInitialResponse(
  context: ChatbotContext,
  state: ChatbotState
): string {
  if (context.fatigueScore === null) {
    return "Hello. I'm NeuroFit Coach, your adaptive workout advisor. First, please run a fatigue analysis so I can recommend workouts tailored to your current state."
  }

  const fatigueLevel = getFatigueLabel(context.fatigueScore)

  if (fatigueLevel === "high") {
    return `Your fatigue level is high today. Recovery is the priority. I recommend rest, light stretching, or restorative yoga. These activities will help you recharge before returning to your regular training intensity.`
  }

  if (fatigueLevel && state.waitingForWorkoutFocus) {
    return `Your fatigue level is ${getFatigueLevelDescription(fatigueLevel)}. What area would you like to focus on today? Options: arms, chest, legs, core, or full body.`
  }

  if (fatigueLevel) {
    return `Your fatigue level is ${getFatigueLevelDescription(fatigueLevel)}. I can help you find a suitable workout. What area would you like to focus on today? (arms, chest, legs, core, or full body)`
  }

  return "Unable to determine fatigue level. Please run a fatigue analysis first."
}

/**
 * Generate workout recommendations response
 */
export function generateWorkoutResponse(
  workouts: Workout[],
  focusArea: FocusArea,
  fatigueLevel: FatigueLevel
): string {
  if (workouts.length === 0) {
    return `I couldn't find suitable workouts for ${getFocusAreaLabel(focusArea).toLowerCase()} at your fatigue level. Please try another focus area.`
  }

  const areaLabel = getFocusAreaLabel(focusArea).toLowerCase()
  const levelLabel = getFatigueLevelDescription(fatigueLevel).toLowerCase()

  let response = `Since your fatigue level is ${levelLabel}, I recommend focusing on ${areaLabel} with controlled intensity and adequate rest. `

  if (fatigueLevel === "low") {
    response += `You can handle higher intensity training today. I've selected workouts that challenge you while maintaining safety.`
  } else if (fatigueLevel === "moderate") {
    response += `I've selected workouts with moderate intensity and good recovery breaks to match your current state.`
  } else {
    response += `I've selected gentle, recovery-focused workouts to help you recharge.`
  }

  return response
}

/**
 * Generate recovery-only response for high fatigue
 */
export function generateRecoveryOnlyResponse(): string {
  return `Your fatigue level is high today. Your body needs recovery more than intense training. I recommend:

• Gentle stretching (10-15 minutes)
• Recovery yoga or restorative flow
• Light mobility work
• Breathing and mindfulness exercises

These activities will help reduce fatigue and prepare you for full training when you're more rested. Quality recovery today means better performance tomorrow.`
}

/**
 * Handle user message and return bot response (synchronous path).
 * Use processChatMessageAsync() for workouts that require ExerciseDB fetching.
 */
export function processChatMessage(
  userMessage: string,
  context: ChatbotContext,
  state: ChatbotState
): {
  response: string
  newState: ChatbotState
  workouts?: Workout[]
} {
  const normalized = userMessage.toLowerCase().trim()

  // Check for medical/safety concerns
  const blockedTerms = [
    "depression",
    "adhd",
    "anxiety",
    "disorder",
    "sick",
    "disease",
    "diagnose",
    "injury",
    "pain",
  ]

  if (blockedTerms.some((term) => normalized.includes(term))) {
    return {
      response:
        "I can explain cognitive fatigue and performance, but I cannot diagnose or treat medical conditions or injuries. For health concerns, please consult a healthcare professional.",
      newState: state,
    }
  }

  // If fatigue is high, always recommend recovery
  const fatigueLevel = getFatigueLabel(context.fatigueScore)

  if (fatigueLevel === "high") {
    // Even if they ask for a specific workout, recommend recovery only
    if (
      normalized.includes("workout") ||
      normalized.includes("gym") ||
      normalized.includes("train")
    ) {
      const recovery = getAllRecoveryWorkouts()
      return {
        response: generateRecoveryOnlyResponse(),
        newState: {
          ...state,
          waitingForWorkoutFocus: false,
          selectedFocusArea: null,
          selectedWorkouts: recovery,
        },
        workouts: recovery,
      }
    }

    // For any other question at high fatigue, still suggest recovery
    return {
      response: generateRecoveryOnlyResponse(),
      newState: {
        ...state,
        waitingForWorkoutFocus: false,
      },
    }
  }

  // Handle focus area selection (Low or Moderate fatigue)
  const parsedArea = parseFocusAreaFromInput(userMessage)

  if (parsedArea) {
    // User specified a focus area
    if (!fatigueLevel) {
      return {
        response: generateInitialResponse(context, state),
        newState: state,
      }
    }

    // Use local workout data synchronously.
    // For ExerciseDB-enhanced workouts, caller should use processChatMessageAsync()
    const workouts = getWorkoutsForFocusArea(parsedArea, fatigueLevel)
    return {
      response: generateWorkoutResponse(workouts, parsedArea, fatigueLevel),
      newState: {
        waitingForWorkoutFocus: false,
        selectedFocusArea: parsedArea,
        selectedWorkouts: workouts,
      },
      workouts,
    }
  }

  // If waiting for focus area and user didn't provide valid area
  if (state.waitingForWorkoutFocus && !state.selectedFocusArea) {
    return {
      response: `I didn't quite catch that. Please choose a focus area: arms, chest, legs, core, or full body.`,
      newState: state,
    }
  }

  // Handle informational questions
  if (normalized.includes("why") && normalized.includes("fatigue")) {
    if (fatigueLevel === "low") {
      return {
        response:
          "Your cognitive fatigue level is low. Your reaction time and typing patterns show good mental performance. You're ready for challenging training today.",
        newState: state,
      }
    }
    if (fatigueLevel === "moderate") {
      return {
        response:
          "Your cognitive fatigue level is moderate. This suggests some accumulated mental effort. Lighter training or recovery-focused activity is recommended.",
        newState: state,
      }
    }
  }

  if (normalized.includes("help") || normalized.includes("improve")) {
    return {
      response:
        "To manage fatigue: prioritize 7-9 hours of sleep, stay hydrated, take regular breaks from focused work, and match your training intensity to your fatigue level. Recovery workouts on high-fatigue days are key.",
      newState: state,
    }
  }

  if (normalized.includes("recovery") || normalized.includes("rest")) {
    return {
      response:
        "Recovery is essential. When your fatigue is high, light stretching, yoga, or mindfulness work helps you recharge. On moderate fatigue days, include active recovery between intensity sessions.",
      newState: state,
    }
  }

  // Default: Ask for focus area if not already in conversation
  if (!state.selectedFocusArea) {
    return {
      response: generateInitialResponse(context, {
        ...state,
        waitingForWorkoutFocus: true,
      }),
      newState: {
        ...state,
        waitingForWorkoutFocus: true,
      },
    }
  }

  // Fallback
  return {
    response:
      "I can help you select workouts based on your fatigue level and focus area. Ask me about a specific area: arms, chest, legs, core, or full body.",
    newState: state,
  }
}

/**
 * Async version: Handle user message with ExerciseDB integration.
 * 
 * This version fetches exercises from ExerciseDB when appropriate, falling back
 * to local workoutData if ExerciseDB is unavailable or returns no results.
 * 
 * All fatigue logic and safety decisions are LOCAL:
 * - ExerciseDB is queried ONLY for exercise data (name, description, target)
 * - Fatigue-based filtering happens here (not in API)
 * - Recovery-only mode bypasses ExerciseDB entirely
 */
export async function processChatMessageAsync(
  userMessage: string,
  context: ChatbotContext,
  state: ChatbotState
): Promise<{
  response: string
  newState: ChatbotState
  workouts?: Workout[]
}> {
  const normalized = userMessage.toLowerCase().trim()

  // Check for medical/safety concerns (same as sync version)
  const blockedTerms = [
    "depression",
    "adhd",
    "anxiety",
    "disorder",
    "sick",
    "disease",
    "diagnose",
    "injury",
    "pain",
  ]

  if (blockedTerms.some((term) => normalized.includes(term))) {
    return {
      response:
        "I can explain cognitive fatigue and performance, but I cannot diagnose or treat medical conditions or injuries. For health concerns, please consult a healthcare professional.",
      newState: state,
    }
  }

  const fatigueLevel = getFatigueLabel(context.fatigueScore)

  // HIGH FATIGUE: Always recovery-only, skip ExerciseDB
  if (fatigueLevel === "high") {
    if (
      normalized.includes("workout") ||
      normalized.includes("gym") ||
      normalized.includes("train")
    ) {
      const recovery = getAllRecoveryWorkouts()
      return {
        response: generateRecoveryOnlyResponse(),
        newState: {
          ...state,
          waitingForWorkoutFocus: false,
          selectedFocusArea: null,
          selectedWorkouts: recovery,
        },
        workouts: recovery,
      }
    }

    return {
      response: generateRecoveryOnlyResponse(),
      newState: {
        ...state,
        waitingForWorkoutFocus: false,
      },
    }
  }

  // Handle focus area selection (Low or Moderate fatigue)
  const parsedArea = parseFocusAreaFromInput(userMessage)

  if (parsedArea) {
    // User specified a focus area and fatigue is not high
    if (!fatigueLevel) {
      return {
        response: generateInitialResponse(context, state),
        newState: state,
      }
    }

    // TRY WGER API FIRST (local decision: only for low/moderate fatigue)
    // If API returns exercises, convert to workouts. Otherwise fall back to local data.
    const exercises = await fetchExercises(parsedArea)
    let workouts: Workout[] = []

    if (exercises.length > 0) {
      workouts = convertToWorkouts(exercises, parsedArea, fatigueLevel)
    }

    // Fallback to local workout data if API didn't return anything
    if (workouts.length === 0) {
      console.log(
        `[Chatbot] wger API unavailable for ${parsedArea}. Using local workout data.`
      )
      workouts = getWorkoutsForFocusArea(parsedArea, fatigueLevel)
    }

    return {
      response: generateWorkoutResponse(workouts, parsedArea, fatigueLevel),
      newState: {
        waitingForWorkoutFocus: false,
        selectedFocusArea: parsedArea,
        selectedWorkouts: workouts,
      },
      workouts,
    }
  }

  // If waiting for focus area and user didn't provide valid area
  if (state.waitingForWorkoutFocus && !state.selectedFocusArea) {
    return {
      response: `I didn't quite catch that. Please choose a focus area: arms, chest, legs, core, or full body.`,
      newState: state,
    }
  }

  // Handle informational questions
  if (normalized.includes("why") && normalized.includes("fatigue")) {
    if (fatigueLevel === "low") {
      return {
        response:
          "Your cognitive fatigue level is low. Your reaction time and typing patterns show good mental performance. You're ready for challenging training today.",
        newState: state,
      }
    }
    if (fatigueLevel === "moderate") {
      return {
        response:
          "Your cognitive fatigue level is moderate. This suggests some accumulated mental effort. Lighter training or recovery-focused activity is recommended.",
        newState: state,
      }
    }
  }

  if (normalized.includes("help") || normalized.includes("improve")) {
    return {
      response:
        "To manage fatigue: prioritize 7-9 hours of sleep, stay hydrated, take regular breaks from focused work, and match your training intensity to your fatigue level. Recovery workouts on high-fatigue days are key.",
      newState: state,
    }
  }

  if (normalized.includes("recovery") || normalized.includes("rest")) {
    return {
      response:
        "Recovery is essential. When your fatigue is high, light stretching, yoga, or mindfulness work helps you recharge. On moderate fatigue days, include active recovery between intensity sessions.",
      newState: state,
    }
  }

  // Default: Ask for focus area if not already in conversation
  if (!state.selectedFocusArea) {
    return {
      response: generateInitialResponse(context, {
        ...state,
        waitingForWorkoutFocus: true,
      }),
      newState: {
        ...state,
        waitingForWorkoutFocus: true,
      },
    }
  }

  // Fallback
  return {
    response:
      "I can help you select workouts based on your fatigue level and focus area. Ask me about a specific area: arms, chest, legs, core, or full body.",
    newState: state,
  }
}

/**
 * Validate chatbot state after context change
 */
export function validateStateForContext(
  state: ChatbotState,
  context: ChatbotContext
): ChatbotState {
  // If no fatigue data, reset conversation
  if (context.fatigueScore === null) {
    return {
      waitingForWorkoutFocus: false,
      selectedFocusArea: null,
      selectedWorkouts: [],
    }
  }

  return state
}
