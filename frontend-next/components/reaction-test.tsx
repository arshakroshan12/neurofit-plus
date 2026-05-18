"use client"

import { useRef, useState } from "react"

type Props = {
  trials?: number
  onComplete: (result: { reaction_time_ms: number; reaction_attempted: number }) => void
}

export default function ReactionTest({ trials = 2, onComplete }: Props) {
  const [phase, setPhase] = useState<"idle" | "waiting" | "stimulus" | "done">("idle")
  const [current, setCurrent] = useState(0)
  const times = useRef<number[]>([])
  const stimulusAt = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  function start() {
    times.current = []
    setCurrent(0)
    setPhase("waiting")
    const delay = 800 + Math.random() * 1600
    timeoutRef.current = setTimeout(() => {
      stimulusAt.current = performance.now()
      setPhase("stimulus")
    }, delay)
  }

  function handleTap() {
    if (phase !== "stimulus") return
    const rt = Math.round(performance.now() - stimulusAt.current)
    times.current.push(rt)
    if (current + 1 >= trials) {
      setPhase("done")
      const avg = Math.round(times.current.reduce((a, b) => a + b, 0) / times.current.length)
      onComplete({ reaction_time_ms: avg, reaction_attempted: 1 })
    } else {
      setCurrent(c => c + 1)
      setPhase("idle")
      setTimeout(() => {
        setPhase("waiting")
        const delay = 800 + Math.random() * 1600
        timeoutRef.current = setTimeout(() => {
          stimulusAt.current = performance.now()
          setPhase("stimulus")
        }, delay)
      }, 700)
    }
  }

  function reset() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    times.current = []
    setPhase("idle")
    setCurrent(0)
  }

  return (
    <div className="card p-6 shadow-sm rounded-xl border border-border/60">
      <h3 className="text-lg font-semibold mb-3">Reaction Test</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Tap when the circle turns blue. {trials} trials will be run and averaged.
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={handleTap}
          disabled={phase !== "stimulus"}
          className={`w-24 h-24 rounded-full flex items-center justify-center select-none border-2 font-bold transition-all ${
            phase === "stimulus"
              ? "bg-primary border-primary text-primary-foreground cursor-pointer hover:opacity-90"
              : "bg-muted border-border text-muted-foreground cursor-default"
          }`}
        >
          {phase === "stimulus" ? "TAP" : phase}
        </button>

        <div>
          <div className="mb-2 text-sm">
            Trial {Math.min(current + 1, trials)} / {trials}
          </div>
          <div className="flex gap-2">
            <button onClick={start} className="rounded-lg border border-primary/30 px-3 py-2 text-sm hover:bg-primary/5 transition-colors">
              Start
            </button>
            <button onClick={reset} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors">
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
