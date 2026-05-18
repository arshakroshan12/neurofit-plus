/**
 * ExerciseDB Integration Service for NeuroFit+
 *
 * This service provides ONLY exercise data retrieval from ExerciseDB (RapidAPI).
 * All fatigue logic, filtering rules, and safety decisions remain in chatbotService.ts
 *
 * Why separate from chatbotService:
 * - Clear separation of concerns: data fetching vs. decision logic
 * - Fatigue thresholds and safety rules are explicitly local (not API-driven)
 * - Easy to swap or disable ExerciseDB without affecting chatbot logic
 * - Fallback to local workoutData.ts is transparent and explicit
 */

import { FatigueLevel, FocusArea, Workout } from "./workoutData"

export interface ExerciseDbExercise {
  id: string
  name: string
  target: string
  equipment: string
  bodyPart: string
  gifUrl?: string
}

/**
 * Maps chatbot focus areas to ExerciseDB body part names.
 * Chatbot decides which focus area based on user input and fatigue.
 * This function ONLY translates the focus area to API query parameter.
 */
export function mapFocusAreaToBodyPart(focusArea: FocusArea): string {
  const mapping: Record<FocusArea, string> = {
    arms: "upper arms",
    chest: "chest",
    legs: "upper legs",
    core: "waist",
    full_body: "back", // Use 'back' as a proxy for full-body (will fetch primary muscle group)
  }
  return mapping[focusArea] || "chest"
}

/**
 * Fetch exercises from ExerciseDB API by body part.
 * Returns raw API response - filtering and safety decisions happen in chatbotService.
 *
 * Data retrieval ONLY. No logic here.
 */
export async function fetchExercisesFromApi(
  bodyPart: string
): Promise<ExerciseDbExercise[]> {
  const apiKey = process.env.NEXT_PUBLIC_EXERCISE_DB_KEY
  if (!apiKey) {
    console.warn(
      "ExerciseDB API key not configured. Fallback to local workout data."
    )
    return []
  }

  try {
    const url = `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${encodeURIComponent(bodyPart)}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    })

    if (!response.ok) {
      console.warn(
        `ExerciseDB API error (${response.status}). Fallback to local data.`
      )
      return []
    }

    const exercises: ExerciseDbExercise[] = await response.json()
    return exercises
  } catch (error) {
    console.error("ExerciseDB fetch error:", error)
    // Graceful fallback - caller will use local workoutData
    return []
  }
}

/**
 * Filter exercises based on fatigue level.
 * This is where chatbot safety logic applies to API results.
 *
 * Decision rules (LOCAL to chatbot, not from API):
 * - HIGH fatigue: Do NOT use ExerciseDB at all (recovery-only mode)
 * - MODERATE fatigue: Exclude high-impact movements
 * - LOW fatigue: Accept all exercises
 */
export function filterExercisesByFatigue(
  exercises: ExerciseDbExercise[],
  fatigueLevel: FatigueLevel
): ExerciseDbExercise[] {
  if (fatigueLevel === "high") {
    // High fatigue: recovery only. Do not return API exercises.
    // Caller should use getAllRecoveryWorkouts() from workoutData.ts
    return []
  }

  if (fatigueLevel === "moderate") {
    // Moderate fatigue: exclude high-impact movements
    const lowImpactTargets = [
      "abs",
      "glutes",
      "quadriceps",
      "hamstrings",
      "gastrocnemius",
      "soleus",
      "back",
    ]

    const excludeKeywords = ["jump", "explosive", "plyometric", "impact"]

    return exercises.filter((ex) => {
      // Keep if target is in low-impact list
      const isLowImpactTarget = lowImpactTargets.some((target) =>
        ex.target.toLowerCase().includes(target)
      )

      // Reject if name contains high-impact keywords
      const hasHighImpactKeyword = excludeKeywords.some((kw) =>
        ex.name.toLowerCase().includes(kw)
      )

      return isLowImpactTarget && !hasHighImpactKeyword
    })
  }

  // LOW fatigue: accept all exercises
  return exercises
}

/**
 * Convert ExerciseDB API response to Workout format used by chatbot.
 * This normalizes API data into the shape expected by WorkoutCard UI component.
 */
export function normalizeExerciseToWorkout(
  exercise: ExerciseDbExercise,
  focusArea: FocusArea
): Workout {
  return {
    id: `external_${exercise.id}`,
    title: capitalize(exercise.name),
    description: `${capitalize(exercise.bodyPart)} exercise targeting ${exercise.target}${exercise.equipment ? ` using ${exercise.equipment}` : ""}. From ExerciseDB.`,
    duration_min: 10, // Default duration for single exercise
    intensity: inferIntensity(exercise),
    focusAreas: [focusArea],
    steps: [
      `Perform ${exercise.name}`,
      `Target: ${exercise.target}`,
      `Equipment: ${exercise.equipment || "Bodyweight"}`,
      exercise.gifUrl ? `Reference: See exercise demo` : "Focus on form and control",
    ].filter(Boolean),
  }
}

/**
 * Infer exercise intensity from name and target.
 * This is a heuristic - chatbot's fatigue filter is the source of truth.
 */
function inferIntensity(
  exercise: ExerciseDbExercise
): "easy" | "medium" | "hard" {
  const name = exercise.name.toLowerCase()

  if (
    name.includes("stretch") ||
    name.includes("mobility") ||
    name.includes("flexibility")
  ) {
    return "easy"
  }

  if (
    name.includes("explosive") ||
    name.includes("jump") ||
    name.includes("plyometric") ||
    name.includes("sprint")
  ) {
    return "hard"
  }

  // Default: medium for most bodyweight/standard equipment exercises
  return "medium"
}

/**
 * Capitalize first letter of string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Main integration point: Fetch, filter, and normalize exercises.
 *
 * Returns up to maxResults exercises, or empty array if ExerciseDB unavailable.
 * Caller (chatbotService) will fall back to local workoutData if array is empty.
 */
export async function getExercisesForFocusArea(
  focusArea: FocusArea,
  fatigueLevel: FatigueLevel,
  maxResults: number = 5
): Promise<Workout[]> {
  // Decision 1: Should we even try to fetch from ExerciseDB?
  // LOCAL DECISION (not from API): Skip if high fatigue
  if (fatigueLevel === "high") {
    console.log(
      "High fatigue detected. Skipping ExerciseDB fetch (recovery-only mode)."
    )
    return []
  }

  // Decision 2: Translate focus area (local logic, then fetch from API)
  const bodyPart = mapFocusAreaToBodyPart(focusArea)

  // Fetch from API (data retrieval only)
  const apiExercises = await fetchExercisesFromApi(bodyPart)

  if (apiExercises.length === 0) {
    console.log(
      `No exercises returned from ExerciseDB for ${bodyPart}. Fallback to local data.`
    )
    return []
  }

  // Decision 3: Filter by fatigue level (local safety rules)
  const filteredExercises = filterExercisesByFatigue(
    apiExercises,
    fatigueLevel
  )

  if (filteredExercises.length === 0) {
    console.log(
      `All exercises filtered out by fatigue level ${fatigueLevel}. Fallback to local data.`
    )
    return []
  }

  // Normalize and limit
  return filteredExercises
    .slice(0, maxResults)
    .map((ex) => normalizeExerciseToWorkout(ex, focusArea))
}
