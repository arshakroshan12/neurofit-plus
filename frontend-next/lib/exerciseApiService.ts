/**
 * Exercise API Service for NeuroFit+
 *
 * Uses wger.de (free, open-source exercise database)
 * No API key required. No RapidAPI dependency.
 * All fatigue logic remains local in chatbotEngine.ts
 *
 * Gracefully falls back to local workout library if API unavailable.
 */

import { FatigueLevel, FocusArea, Workout } from "./workoutData"

export interface WgerExercise {
  id: number
  name: string
  description: string
  equipment: Array<{
    id: number
    name: string
  }>
}

export interface WgerExerciseDetail {
  id: number
  translations: Array<{
    id: number
    name: string
    description: string
    language: number
  }>
  equipment: Array<{
    id: number
    name: string
  }>
}

/**
 * Map focus areas to wger.de muscle group IDs
 * Reference: https://wger.de/api/v2/muscle/
 * 
 * Note: For full_body, we return null to indicate we should use local workout data
 * instead of the API, since full body workouts require multiple muscle groups.
 */
export function mapFocusAreaToMuscleId(focusArea: FocusArea): number | null {
  const mapping: Record<FocusArea, number | null> = {
    arms: 2, // Biceps
    chest: 4, // Chest
    legs: 8, // Quadriceps
    core: 6, // Abs
    full_body: null, // Use local data for full body (requires multiple muscle groups)
  }
  return mapping[focusArea] ?? null
}

/**
 * Extract English translation (language_id 2) from wger exercise
 */
function getEnglishName(translations: any[]): string {
  const english = translations.find(
    (t) => t.language === 2 || t.language_id === 2
  )
  return english?.name || translations[0]?.name || "Exercise"
}

/**
 * Extract English description from wger exercise
 */
function getEnglishDescription(translations: any[]): string {
  const english = translations.find(
    (t) => t.language === 2 || t.language_id === 2
  )
  const desc = english?.description || translations[0]?.description || ""
  // Strip HTML tags
  return desc.replace(/<[^>]*>/g, "").slice(0, 150)
}

/**
 * Fetch exercises from wger.de API (free, no auth required)
 *
 * Uses /exerciseinfo/ endpoint which includes exercise names in translations.
 *
 * @param focusArea - Body area to focus on
 * @returns Array of exercises, empty array if API fails
 */
export async function fetchExercises(
  focusArea: FocusArea
): Promise<WgerExercise[]> {
  try {
    const muscleId = mapFocusAreaToMuscleId(focusArea)

    // For full_body, use local workout data instead of API
    // Full body workouts require multiple muscle groups which the API doesn't handle well
    if (muscleId === null) {
      console.log(
        `[ExerciseAPI] Skipping API for ${focusArea}. Using local workout library.`
      )
      return []
    }

    // wger.de API - uses /exerciseinfo/ which has translations with names
    const url = `https://wger.de/api/v2/exerciseinfo/?muscles=${muscleId}&limit=10`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(3000), // 3 second timeout
    })

    if (!response.ok) {
      console.warn(
        `[ExerciseAPI] API error (${response.status}). Using local workout library.`
      )
      return []
    }

    const data = await response.json()

    // Extract exercises from response
    const exercises: WgerExercise[] = (data.results || [])
      .slice(0, 5) // Limit to 5 exercises
      .map((ex: WgerExerciseDetail) => ({
        id: ex.id,
        name: getEnglishName(ex.translations || []),
        description: getEnglishDescription(ex.translations || []),
        equipment: ex.equipment || [],
      }))

    console.log(
      `[ExerciseAPI] Fetched ${exercises.length} exercises for ${focusArea}`
    )
    return exercises
  } catch (error) {
    if (error instanceof Error) {
      console.warn(
        `[ExerciseAPI] Fetch failed (${error.message}). Using local workout library.`
      )
    }
    return [] // Fallback to local data handled by caller
  }
}

/**
 * Convert wger.de exercises to NeuroFit+ Workout format
 *
 * @param exercises - Array of WgerExercise from API
 * @param focusArea - Body area focus
 * @param fatigueLevel - User's fatigue level (determines intensity)
 * @returns Array of Workout objects
 */
export function convertToWorkouts(
  exercises: WgerExercise[],
  focusArea: FocusArea,
  fatigueLevel: FatigueLevel
): Workout[] {
  return exercises.map((ex) => {
    // Adjust duration and intensity based on fatigue
    const durationMap: Record<FatigueLevel, number> = {
      low: 20,
      moderate: 15,
      high: 10,
    }

    const intensityMap: Record<FatigueLevel, "easy" | "medium" | "hard"> = {
      low: "hard",
      moderate: "medium",
      high: "easy",
    }

    const equipmentNames = ex.equipment
      .map((e) => e.name)
      .join(", ") || "bodyweight"

    return {
      id: `wger_${ex.id}`,
      title: ex.name,
      description: `${ex.description || ex.name}. Equipment: ${equipmentNames}`,
      duration_min: durationMap[fatigueLevel],
      intensity: intensityMap[fatigueLevel],
      focusAreas: [focusArea],
      steps: [
        `Exercise: ${ex.name}`,
        `Equipment: ${equipmentNames}`,
        "Perform 3 sets of 10-12 reps",
        "Rest 60-90 seconds between sets",
        `Difficulty: ${intensityMap[fatigueLevel]}`,
      ],
    }
  })
}
