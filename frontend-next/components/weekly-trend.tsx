"use client"

type Props = {
  scores: (number | null)[]
}

function LineChart({ scores }: { scores: number[] }) {
  if (scores.length === 0) return null
  
  const width = 500
  const height = 320
  const padding = 50
  const graphWidth = width - padding * 2
  const graphHeight = height - padding * 2
  
  // Scale from 0-1 to 0-100 for display
  const scaledScores = scores.map(s => s * 100)
  const maxScore = 100
  const minScore = 0
  
  // Generate path
  const points = scores.map((score, i) => {
    const scaled = score * 100
    const x = padding + (i / (scores.length - 1 || 1)) * graphWidth
    const y = height - padding - ((scaled - minScore) / (maxScore - minScore)) * graphHeight
    return { x, y, score, scaled }
  })
  
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="mt-4">
      {/* Grid lines with scaled labels */}
      {[0, 25, 50, 75, 100].map((label) => {
        const ratio = label / 100
        const y = height - padding - ratio * graphHeight
        return (
          <g key={`grid-${label}`}>
            <line
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
            <text 
              x={padding - 15} 
              y={y + 4} 
              textAnchor="end" 
              fontSize="12" 
              fill="var(--muted-foreground)" 
              opacity="0.8"
            >
              {label}
            </text>
          </g>
        )
      })}
      
      {/* Axes */}
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--border)" strokeWidth="2" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border)" strokeWidth="2" />
      
      {/* Y-axis label */}
      <text 
        x={15} 
        y={30} 
        fontSize="12" 
        fill="var(--muted-foreground)" 
        opacity="0.7"
        fontWeight="500"
      >
        Fatigue
      </text>
      
      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Interactive points with tooltips */}
      {points.map((p, i) => (
        <g key={`point-${i}`}>
          <circle
            cx={p.x}
            cy={p.y}
            r="5"
            fill="var(--primary)"
            stroke="white"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
          />
          {/* Tooltip on hover */}
          <title>{`Day ${i + 1}: ${Math.round(p.scaled)} / 100`}</title>
        </g>
      ))}
    </svg>
  )
}

export default function WeeklyTrend({ scores }: Props) {
  // filter out nulls safely
  const cleanScores = scores.filter(
    (s): s is number => typeof s === "number"
  )

  return (
    <div className="rounded-xl border border-border/60 p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">
        Weekly Fatigue Trend
      </h2>

      {cleanScores.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No fatigue data yet. Run a fatigue check to see trends.
        </p>
      ) : (
        <>
          <div style={{ height: '300px' }}>
            <LineChart scores={cleanScores} />
          </div>
          <div className="mt-6 space-y-2">
            {scores.map((score, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">Day {index + 1}</span>
                {score !== null ? (
                  <span className="font-semibold">{Math.round(score * 100)} / 100</span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
