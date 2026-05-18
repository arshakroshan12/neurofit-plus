"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import Header from "@/components/header"
import FatigueOverview from "@/components/fatigue-overview"
import WorkoutRecommendation from "@/components/workout-recommendation"
import WeeklyTrend from "@/components/weekly-trend"

export default function DashboardPage() {
  // RAW fatigue score from backend (0.0 – 1.0)
  const [fatigueRaw, setFatigueRaw] = useState<number | null>(null)

  const [risk, setRisk] = useState<"low" | "medium" | "high">("low")
  const [weeklyScores, setWeeklyScores] = useState<(number | null)[]>([
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ])

  // Derive display values (UI ONLY)
  const fatiguePercent =
    fatigueRaw !== null ? Math.round(fatigueRaw * 100) : null

  const fatigueLabel =
    fatigueRaw === null
      ? null
      : fatigueRaw < 0.30
      ? "Low"
      : fatigueRaw < 0.50
      ? "Moderate"
      : "High"

  // Build weekly scores from date-based storage
  function buildWeeklyScores() {
    const scores: (number | null)[] = []
    const today = new Date()
    
    // Build last 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
      
      const historyKey = `neurofit_history_${dateStr}`
      const stored = localStorage.getItem(historyKey)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          scores.push(data.fatigue_score)
        } catch {
          scores.push(null)
        }
      } else {
        scores.push(null)
      }
    }
    
    return scores
  }

  useEffect(() => {
    // Load last result from localStorage (set by analysis page)
    const lastResult = localStorage.getItem("neurofit_last_result")
    if (lastResult) {
      try {
        const { fatigue_score, risk_level, timestamp } = JSON.parse(lastResult)

        // Store RAW score only
        setFatigueRaw(fatigue_score)
        setRisk(risk_level)

        // Store in date-based history
        const dateStr = new Date(timestamp).toISOString().split('T')[0]
        const historyKey = `neurofit_history_${dateStr}`
        localStorage.setItem(
          historyKey,
          JSON.stringify({
            fatigue_score,
            risk_level,
            timestamp,
          })
        )

        // Build weekly scores from history
        setWeeklyScores(buildWeeklyScores())
      } catch (e) {
        console.warn("Could not parse last result", e)
      }
    } else {
      // Load existing history on mount
      setWeeklyScores(buildWeeklyScores())
    }
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Your cognitive fatigue overview
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Current Fatigue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FatigueOverview
                fatigueScore={fatiguePercent}
                riskLevel={risk}
              />

              <WorkoutRecommendation
                fatigueScore={fatigueRaw}
                riskLevel={risk}
              />
            </div>

            {/* Run Analysis Button */}
            <Link href="/analysis">
              <button className="w-full rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:shadow-md hover:bg-opacity-95 transition-all text-center shadow-sm">
                Run Fatigue Analysis
              </button>
            </Link>

            {/* Last Session */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-bold mb-4">Last Session</h2>

              {fatigueRaw !== null ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">
                      Fatigue Score:
                    </span>{" "}
                    <span className="font-semibold">
                      {fatiguePercent} / 100
                    </span>
                  </p>

                  <p>
                    <span className="text-muted-foreground">
                      Fatigue Level:
                    </span>{" "}
                    <span className="font-semibold">
                      {fatigueLabel}
                    </span>
                  </p>

                  <p>
                    <span className="text-muted-foreground">
                      Risk Level:
                    </span>{" "}
                    <span className="font-semibold capitalize">
                      {risk}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Run your first analysis to see results.
                </p>
              )}
            </div>
          </div>

          {/* Weekly Trend */}
          <aside className="space-y-6">
            <WeeklyTrend scores={weeklyScores} />
          </aside>
        </div>
      </div>
    </main>
  )
}
