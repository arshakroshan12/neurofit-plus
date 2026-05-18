"use client"

type Props = {
  fatigueScore: number | null
  riskLevel: "low" | "medium" | "high"
}

export default function WorkoutRecommendation({ fatigueScore, riskLevel }: Props) {
  let workout = "—"
  let intensity = "—"
  let reason = ""

  if (fatigueScore !== null) {
    if (fatigueScore > 60 || riskLevel === 'high') {
      workout = 'Recovery'
      intensity = 'Low'
      reason = 'Higher fatigue — prioritize recovery and mobility.'
    } else if (fatigueScore > 40) {
      workout = 'Light Cardio'
      intensity = 'Low–Moderate'
      reason = 'Moderate fatigue — gentle cardio to move without heavy strain.'
    } else {
      workout = 'Strength'
      intensity = 'Moderate–High'
      reason = 'Low fatigue — you can perform regular strength or endurance work.'
    }
  }

  return (
    <div className="card p-6 shadow-sm rounded-xl border border-border/60">
      <h2 className="mb-2 text-lg font-semibold">Recommended Workout</h2>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Workout</div>
          <div className="text-lg font-medium">{workout}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Intensity</div>
          <div className="text-sm font-semibold px-3 py-1 rounded-full bg-secondary/10 text-secondary">
            {intensity}
          </div>
        </div>
      </div>
      {reason && <p className="mt-3 text-sm text-muted-foreground">{reason}</p>}
    </div>
  )
}
