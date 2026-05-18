"use client"

type Props = {
  fatigue: number | null
  risk: string
  onReset: () => void
}

export default function ResultsDisplay({ fatigue, risk, onReset }: Props) {
  if (fatigue === null) return null

  const riskColor = risk === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-secondary'
  const statusText = risk === 'high' ? 'High fatigue detected' : 'Fatigue level normal'

  return (
    <div className="rounded-xl border border-border/60 bg-white p-8 shadow-md">
      <h2 className="text-2xl font-bold mb-6">Analysis Report</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg border border-border/60 p-6 shadow-sm">
          <div className="text-sm text-muted-foreground mb-2">Fatigue Score</div>
          <div className="text-4xl font-bold text-primary">{fatigue}</div>
          <div className="text-xs text-muted-foreground mt-2">out of 100</div>
        </div>

        <div className="rounded-lg border border-border/60 p-6 shadow-sm">
          <div className="text-sm text-muted-foreground mb-2">Risk Level</div>
          <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${riskColor} inline-block`}>
            {risk.toUpperCase()}
          </div>
          <div className="text-xs text-muted-foreground mt-3">{statusText}</div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/40 p-4 mb-6">
        <h3 className="font-semibold mb-2">Recommendations</h3>
        <ul className="space-y-2 text-sm">
          {fatigue > 60 ? (
            <>
              <li>• Prioritize recovery and light movement</li>
              <li>• Consider 7-9 hours of sleep tonight</li>
              <li>• Stay hydrated throughout the day</li>
              <li>• Defer intense training sessions</li>
            </>
          ) : fatigue > 40 ? (
            <>
              <li>• Moderate workout intensity recommended</li>
              <li>• Include adequate warm-up and cool-down</li>
              <li>• Monitor energy levels during exercise</li>
              <li>• Ensure proper hydration</li>
            </>
          ) : (
            <>
              <li>• You're ready for your usual training</li>
              <li>• Strong cognitive and physical capacity</li>
              <li>• Consider challenging workouts today</li>
              <li>• Continue your current sleep and nutrition habits</li>
            </>
          )}
        </ul>
      </div>

      <button
        onClick={onReset}
        className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:opacity-90 transition-opacity font-medium"
      >
        Run New Assessment
      </button>
    </div>
  )
}
