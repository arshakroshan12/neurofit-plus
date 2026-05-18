/**
 * Workout Media Utilities
 * 
 * Dynamically generates search queries for workout-based media
 * Fetches images from Pixabay API and caches results locally
 * 
 * Separation of concerns:
 * - Query generation: Deterministic, based on workout content
 * - API fetching: Best-effort, non-blocking
 * - Caching: localStorage to avoid repeated API calls
 */

import type { Workout, FatigueLevel } from "./workoutData"

const PIXABAY_API_KEY = process.env.NEXT_PUBLIC_PIXABAY_KEY
const PIXABAY_BASE_URL = "https://pixabay.com/api/"
const CACHE_KEY_PREFIX = "workout-media-"
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface CachedMedia {
  url: string
  timestamp: number
}

/**
 * Generate a search query for Pixabay API based on workout content
 * Uses deterministic rules to map workout characteristics to relevant search terms
 */
export function getWorkoutMediaQuery(
  workout: Workout,
  fatigueLevel?: FatigueLevel | null
): string {
  // Rule 1: HIGH fatigue → restorative/breathing
  if (fatigueLevel === "high") {
    const highFatigueKeywords = [
      "breathing meditation",
      "yoga stretching",
      "relaxation exercise",
      "recovery wellness",
    ]
    return highFatigueKeywords[Math.floor(Math.random() * highFatigueKeywords.length)]
  }

  // Rule 2: Extract specific exercises from steps
  const stepsText = workout.steps.join(" ").toLowerCase()

  // Map specific exercises to search queries
  if (stepsText.includes("push-up")) return "push up exercise workout"
  if (stepsText.includes("squat")) return "squat exercise fitness"
  if (stepsText.includes("burpee")) return "burpee workout exercise"
  if (stepsText.includes("lunge")) return "lunge leg exercise"
  if (stepsText.includes("plank")) return "plank core exercise"
  if (stepsText.includes("crunch")) return "abdominal crunch exercise"
  if (stepsText.includes("bridge")) return "glute bridge exercise"
  if (stepsText.includes("bird-dog")) return "bird dog core exercise"
  if (stepsText.includes("cat-cow")) return "cat cow yoga pose"
  if (stepsText.includes("downward dog")) return "downward dog yoga"
  if (stepsText.includes("child's pose")) return "child pose yoga"
  if (stepsText.includes("stretching")) return "yoga stretching exercise"

  // Rule 3: Fallback based on focus area
  const focusArea = workout.focusAreas[0]
  const focusAreaQueries: Record<string, string> = {
    arms: "arm exercise strength training",
    chest: "chest press workout",
    legs: "leg workout fitness",
    core: "core abs exercise",
    full_body: "full body workout fitness",
  }

  // Rule 4: Ultimate fallback
  return focusAreaQueries[focusArea] || "fitness workout exercise"
}

/**
 * Fetch a single image from Pixabay API
 * Returns URL of first matching image or null
 */
export async function fetchWorkoutMedia(query: string): Promise<string | null> {
  if (!PIXABAY_API_KEY) {
    console.warn("[Pixabay] NEXT_PUBLIC_PIXABAY_KEY not set. Media fetching disabled.")
    return null
  }

  try {
    const params = new URLSearchParams({
      key: PIXABAY_API_KEY,
      q: query,
      image_type: "photo",
      orientation: "horizontal",
      per_page: "3",  // Changed from "1" - Pixabay API requires per_page >= 3
      safesearch: "true",
    })

    const url = `${PIXABAY_BASE_URL}?${params}`
    console.log(`[Pixabay] Fetching: "${query}"`)

    const response = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
    })

    if (!response.ok) {
      console.warn(`[Pixabay] API error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.warn(`[Pixabay] Error details: ${errorText}`)
      return null
    }

    const data = await response.json()
    console.log(`[Pixabay] Response:`, data)

    if (data.hits && data.hits.length > 0) {
      const url = data.hits[0].webformatURL || null
      console.log(`[Pixabay] Got image: ${url}`)
      return url
    }

    console.warn(`[Pixabay] No images found for query: "${query}"`)
    return null
  } catch (error) {
    console.warn("[Pixabay] Fetch failed:", error)
    return null
  }
}

/**
 * Get media URL from localStorage cache
 * Returns null if not cached or cache expired
 */
export function getWorkoutMediaFromCache(workoutId: string): string | null {
  if (typeof window === "undefined") return null

  try {
    const key = `${CACHE_KEY_PREFIX}${workoutId}`
    const cached = localStorage.getItem(key)

    if (!cached) return null

    const { url, timestamp } = JSON.parse(cached) as CachedMedia

    // Check if cache is still valid
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key)
      return null
    }

    return url
  } catch (error) {
    console.warn("Cache read error:", error)
    return null
  }
}

/**
 * Store media URL in localStorage cache
 */
export function cacheWorkoutMedia(workoutId: string, mediaUrl: string): void {
  if (typeof window === "undefined") return

  try {
    const key = `${CACHE_KEY_PREFIX}${workoutId}`
    const cached: CachedMedia = {
      url: mediaUrl,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(cached))
  } catch (error) {
    console.warn("Cache write error:", error)
  }
}

/**
 * Get or fetch workout media with caching
 * Returns media URL or null (never throws)
 */
export async function getWorkoutMedia(
  workout: Workout,
  fatigueLevel?: FatigueLevel | null
): Promise<string | null> {
  // Check cache first
  const cachedUrl = getWorkoutMediaFromCache(workout.id)
  if (cachedUrl) {
    console.log(`[Pixabay] Cache hit for ${workout.id}`)
    return cachedUrl
  }

  console.log(`[Pixabay] Cache miss for ${workout.id}, fetching...`)

  // Generate search query
  const query = getWorkoutMediaQuery(workout, fatigueLevel)
  console.log(`[Pixabay] Generated query: "${query}" for ${workout.id}`)

  // Fetch from Pixabay
  const mediaUrl = await fetchWorkoutMedia(query)

  // Cache result (even if null, to avoid repeated API calls for missing media)
  if (mediaUrl) {
    cacheWorkoutMedia(workout.id, mediaUrl)
    console.log(`[Pixabay] Cached result for ${workout.id}`)
  }

  return mediaUrl
}
