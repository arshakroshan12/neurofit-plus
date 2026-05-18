"use client"

type Props = {
  fatigueScore: number | null
  riskLevel: "low" | "medium" | "high"
}

// Map fatigue levels to semantic colors
function getColorForRisk(level: "low" | "medium" | "high"): { bg: string; text: string; stroke: string } {
  switch (level) {
    case "low":
      return { bg: "bg-green-50", text: "text-green-700", stroke: "var(--chart-5)" } // green
    case "high":
      return { bg: "bg-red-50", text: "text-red-700", stroke: "var(--chart-4)" } // red
    default: // moderate
      return { bg: "bg-orange-50", text: "text-orange-700", stroke: "var(--chart-3)" } // orange
  }
}

function Circular({ value, riskLevel }: { value: number; riskLevel: "low" | "medium" | "high" }) {
  const radius = 44
  const stroke = 8
  const normalized = Math.max(0, Math.min(100, value))
  const c = 2 * Math.PI * radius
  const dash = (normalized / 100) * c
  const remaining = c - dash
  const colors = getColorForRisk(riskLevel)

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <g transform="translate(60,60)">
        <circle r={radius} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle r={radius} stroke={colors.stroke} strokeWidth={stroke} fill="none" strokeDasharray={`${dash} ${remaining}`} strokeLinecap="round" transform="rotate(-90)" />
        <text x="0" y="6" textAnchor="middle" fontSize={20} fontWeight={700} fill="var(--foreground)">
          {Math.round(normalized)}
        </text>
        <text x="0" y="28" textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">
          / 100
        </text>
      </g>
    </svg>
  )
}

export default function FatigueOverview({ fatigueScore, riskLevel }: Props) {
  const score = fatigueScore ?? 0
  const colors = getColorForRisk(riskLevel)

  return (
    <div className="card p-6 flex items-center gap-6 shadow-sm rounded-xl border border-border/60">
      <div>
        <Circular value={score} riskLevel={riskLevel} />
      </div>
      <div className="flex-1">
        <h2 className="mb-1 text-lg font-semibold">Your cognitive fatigue level today</h2>
        <div className="mt-2 flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}
          >
            {riskLevel?.toUpperCase() ?? "—"}
          </div>
          <p className="text-sm text-muted-foreground">
            Score: <strong>{Number(score).toFixed(0)} / 100</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
