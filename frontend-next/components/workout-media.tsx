/**
 * WorkoutMedia Component
 * 
 * Displays pre-fetched demo images for workouts
 * - Static URLs: No API calls needed
 * - Instant load: Images load immediately
 * - Graceful: Renders nothing if no mediaUrl
 */

"use client"

import type { Workout, FatigueLevel } from "@/lib/workoutData"
import { getStepVideo } from "@/lib/workoutData"


interface WorkoutMediaProps {
  workout: Workout
  fatigueLevel?: FatigueLevel | null
}

export default function WorkoutMedia({ workout }: WorkoutMediaProps) {
  // Render a video for each step if available
  return (
    <div className="flex flex-col gap-4 mt-4">
      {workout.steps.map((step, idx) => {
        const videoUrl = getStepVideo(step)
        if (!videoUrl) return null
        return (
          <div key={idx} className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground mb-1">{step}</span>
            <video
              src={videoUrl}
              controls
              className="rounded-lg border border-border w-full max-w-md"
              style={{ maxHeight: 240 }}
            >
              Sorry, your browser does not support embedded videos.
            </video>
          </div>
        )
      })}
    </div>
  )
}
