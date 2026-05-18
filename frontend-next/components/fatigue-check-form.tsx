"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  onSubmit: (data: Record<string, number>) => void
}

export default function FatigueCheckForm({ onSubmit }: Props) {
  // subjective inputs
  const [sleepHours, setSleepHours] = useState(7)
  const [energyLevel, setEnergyLevel] = useState(5)
  const [stressLevel, setStressLevel] = useState(5)

  // reaction time
  const [showStimulus, setShowStimulus] = useState(false)
  const stimulusTime = useRef<number>(0)
  const [reactionTime, setReactionTime] = useState<number | null>(null)

  // typing metrics
  const keyTimes = useRef<number[]>([])
  const backspaces = useRef(0)
  const totalKeys = useRef(0)
  const typingStart = useRef<number>(0)
  const [typingDone, setTypingDone] = useState(false)

  // ---------------- REACTION TEST ----------------
  const startReactionTest = () => {
    setReactionTime(null)
    setShowStimulus(false)

    const delay = 1000 + Math.random() * 2000
    setTimeout(() => {
      stimulusTime.current = performance.now()
      setShowStimulus(true)
    }, delay)
  }

  const handleReactionClick = () => {
    if (!showStimulus) return
    const rt = performance.now() - stimulusTime.current
    setReactionTime(Math.round(rt))
    setShowStimulus(false)
  }

  // ---------------- TYPING TEST ----------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const now = performance.now()

    if (keyTimes.current.length === 0) {
      typingStart.current = now
    } else {
      keyTimes.current.push(now)
    }

    if (e.key === "Backspace") {
      backspaces.current += 1
    }
    totalKeys.current += 1
  }

  const finishTypingTest = () => {
    setTypingDone(true)
  }

  // ---------------- SUBMIT ----------------
  const submitFatigueCheck = () => {
    if (reactionTime === null || !typingDone) return

    const intervals = []
    for (let i = 1; i < keyTimes.current.length; i++) {
      intervals.push(keyTimes.current[i] - keyTimes.current[i - 1])
    }

    const avgLatency =
      intervals.reduce((a, b) => a + b, 0) / intervals.length || 200

    const payload = {
      sleep_hours: sleepHours,
      energy_level: energyLevel,
      stress_level: stressLevel,
      avg_key_latency_ms: Math.round(avgLatency),
      total_duration_ms: Math.round(
        performance.now() - typingStart.current
      ),
      backspace_rate:
        totalKeys.current > 0
          ? backspaces.current / totalKeys.current
          : 0,
      reaction_time_ms: reactionTime,
      reaction_attempted: 1,
    }

    onSubmit(payload)
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow-md border border-border/60">
      <h2 className="mb-6 text-xl font-semibold">
        Cognitive Fatigue Check
      </h2>

      {/* SUBJECTIVE INPUTS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <label className="text-sm">
          Sleep Hours
          <input
            type="number"
            value={sleepHours}
            onChange={(e) => setSleepHours(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-muted/40 p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>

        <label className="text-sm">
          Energy Level (1–10)
          <input
            type="number"
            value={energyLevel}
            onChange={(e) => setEnergyLevel(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-muted/40 p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>

        <label className="text-sm">
          Stress Level (1–10)
          <input
            type="number"
            value={stressLevel}
            onChange={(e) => setStressLevel(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-muted/40 p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>
      </div>

      {/* REACTION TIME */}
      <div className="mb-8">
        <h3 className="mb-2 font-medium">Reaction Time</h3>

        {!showStimulus && reactionTime === null && (
          <button
            onClick={startReactionTest}
            className="rounded-lg bg-secondary text-secondary-foreground px-4 py-2 hover:opacity-90 transition-opacity font-medium"
          >
            Start Reaction Test
          </button>
        )}

        {showStimulus && (
          <button
            onClick={handleReactionClick}
            className="rounded-full bg-primary text-primary-foreground px-6 py-3 hover:opacity-90 transition-opacity font-medium"
          >
            TAP NOW
          </button>
        )}

        {reactionTime !== null && (
          <p className="mt-2 text-sm text-primary">
            Reaction recorded: {reactionTime}ms
          </p>
        )}
      </div>

      {/* TYPING TEST */}
      <div className="mb-8">
        <h3 className="mb-2 font-medium">Typing Task</h3>
        <p className="mb-2 text-sm text-muted-foreground">
          Type continuously for a few seconds. Accuracy matters more than speed.
        </p>

        <textarea
          className="w-full rounded-lg border border-border bg-muted/40 p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground disabled:opacity-50"
          rows={3}
          disabled={typingDone}
          onKeyDown={handleKeyDown}
          placeholder="Start typing here..."
        />

        {!typingDone && (
          <button
            onClick={finishTypingTest}
            className="mt-3 rounded-lg border border-primary/30 px-4 py-2 hover:bg-primary/5 transition-colors font-medium"
          >
            Finish Typing
          </button>
        )}
      </div>

      {/* SUBMIT */}
      <button
        onClick={submitFatigueCheck}
        disabled={reactionTime === null || !typingDone}
        className="rounded-lg bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity font-medium"
      >
        Analyze Fatigue
      </button>
    </div>
  )
}
