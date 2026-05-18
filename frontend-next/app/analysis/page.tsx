"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import predictFatigue from "@/lib/api"

// Step 1: Subjective Form Component
function SubjectiveForm({
  onComplete,
}: {
  onComplete: (data: { sleep_hours: number; energy_level: number; stress_level: number }) => void
}) {
  const [sleep, setSleep] = useState(7)
  const [energy, setEnergy] = useState(5)
  const [stress, setStress] = useState(5)
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    setSubmitted(true)
    onComplete({ sleep_hours: sleep, energy_level: energy, stress_level: stress })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-10 shadow-sm max-w-3xl">
      <h2 className="text-2xl font-bold mb-2">Fatigue Check</h2>
      <p className="text-muted-foreground mb-6">
        Help us understand your current state with a quick assessment.
      </p>

      <div className="space-y-6">
        {/* Sleep Hours */}
        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Sleep Hours Last Night</span>
            <span className="text-lg font-semibold text-primary">{sleep.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={sleep}
            onChange={e => setSleep(Number(e.target.value))}
            className="w-full rounded-full accent-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">0–12 hours</p>
        </div>

        {/* Energy Level */}
        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Energy Level</span>
            <span className="text-lg font-semibold text-primary">{energy}</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={energy}
            onChange={e => setEnergy(Number(e.target.value))}
            className="w-full rounded-full accent-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">1 = exhausted, 10 = fully energized</p>
        </div>

        {/* Stress Level */}
        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Stress Level</span>
            <span className="text-lg font-semibold text-primary">{stress}</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={stress}
            onChange={e => setStress(Number(e.target.value))}
            className="w-full rounded-full accent-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">1 = no stress, 10 = extremely stressed</p>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={submitted}
        className="mt-8 w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {submitted ? "Form Complete" : "Continue"}
      </button>
    </div>
  )
}

// Step 2: Test Selection Component
function TestSelectionStep({
  onComplete,
}: {
  onComplete: (testType: "visual" | "audio") => void
}) {
  const [selected, setSelected] = useState<"visual" | "audio" | null>(null)

  function handleSelect(type: "visual" | "audio") {
    setSelected(type)
    setTimeout(() => {
      onComplete(type)
    }, 300)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-10 shadow-sm max-w-3xl">
      <h2 className="text-2xl font-bold mb-2">Choose Your Fatigue Test</h2>
      <p className="text-muted-foreground mb-8">
        Choose the test that works best for you. Both tests measure reaction time equally.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Visual Test Option */}
        <button
          onClick={() => handleSelect("visual")}
          disabled={selected !== null}
          className={`p-8 rounded-xl border-2 transition-all text-left ${selected === "visual"
            ? "border-primary bg-primary/5 scale-105"
            : selected === null
              ? "border-border hover:border-primary/50 hover:bg-muted"
              : "border-border opacity-50"
            }`}
        >
          <div className="text-4xl mb-4">👁️</div>
          <h3 className="text-xl font-semibold mb-2">Visual Reaction Test</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Screen-based stimulus. Click when you see the green circle appear.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 4 quick trials</li>
            <li>• Visual attention required</li>
            <li>• No sound needed</li>
          </ul>
        </button>

        {/* Audio Test Option */}
        <button
          onClick={() => handleSelect("audio")}
          disabled={selected !== null}
          className={`p-8 rounded-xl border-2 transition-all text-left ${selected === "audio"
            ? "border-primary bg-primary/5 scale-105"
            : selected === null
              ? "border-border hover:border-primary/50 hover:bg-muted"
              : "border-border opacity-50"
            }`}
        >
          <div className="text-4xl mb-4">🔊</div>
          <h3 className="text-xl font-semibold mb-2">Audio Reaction Test</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Sound-based stimulus. Click when you hear the beep sound.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 4 quick trials</li>
            <li>• Hearing required</li>
            <li>• 🎧 Headphones recommended</li>
          </ul>
        </button>
      </div>

      {selected && (
        <div className="text-center text-sm text-primary font-medium animate-pulse">
          Loading {selected} test...
        </div>
      )}
    </div>
  )
}

// Step 3: Visual Reaction Test Component (4 trials with lapse detection)
// Step 3: Visual Reaction Test Component (4 trials with lapse detection)
function VisualReactionTestStep({
  onComplete,
}: {
  onComplete: (data: {
    reaction_time_ms: number
    reaction_attempted: number
    reaction_lapses: number
  }) => void
}) {
  const TRIALS = 4
  const LAPSE_THRESHOLD = 1500 // ms
  const MAX_WAIT = 3000 // ms before timeout lapse

  const [phase, setPhase] = useState<"idle" | "waiting" | "stimulus" | "feedback" | "done">("idle")
  const [currentTrial, setCurrentTrial] = useState(0)
  const [validTimes, setValidTimes] = useState<number[]>([])
  const [lapses, setLapses] = useState(0)
  const [lastFeedback, setLastFeedback] = useState<string>("")
  const [showLapseFlash, setShowLapseFlash] = useState(false)
  const [stimulusAt, setStimulusAt] = useState(0)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  // Auto-start next trial when currentTrial increments
  useEffect(() => {
    if (phase === "idle" && currentTrial > 0 && currentTrial < TRIALS) {
      const delay = setTimeout(() => {
        startTrial()
      }, 500) // Brief pause before next trial starts
      return () => clearTimeout(delay)
    }
  }, [currentTrial, phase])

  function startTrial() {
    // Reset state for new trial
    setLastFeedback("")
    setShowLapseFlash(false)
    setPhase("waiting")

    // Random delay 1-3 seconds before stimulus
    const delay = 1000 + Math.random() * 2000
    const timeId = setTimeout(() => {
      setStimulusAt(performance.now())
      setPhase("stimulus")

      // Set timeout for max wait (3 seconds)
      const maxWaitId = setTimeout(() => {
        handleLapse()
      }, MAX_WAIT)

      setTimeoutId(maxWaitId)
    }, delay)

    return timeId
  }

  function handleTap() {
    if (phase !== "stimulus") return

    // Clear timeout since user responded
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }

    const rt = Math.round(performance.now() - stimulusAt)

    // Check if reaction time is a lapse
    if (rt > LAPSE_THRESHOLD) {
      handleLapse()
    } else {
      // Valid trial
      const newValidTimes = [...validTimes, rt]
      setValidTimes(newValidTimes)
      setLastFeedback(`Reaction time: ${rt} ms`)
      setPhase("feedback")

      // Move to next trial or complete
      setTimeout(() => {
        if (currentTrial + 1 >= TRIALS) {
          completeTest(newValidTimes, lapses)
        } else {
          setCurrentTrial(c => c + 1)
          setPhase("idle")
        }
      }, 1500)
    }
  }

  function handleLapse() {
    // Clear any pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }

    const newLapses = lapses + 1
    setLapses(newLapses)
    setShowLapseFlash(true)
    setLastFeedback("Lapse detected")
    setPhase("feedback")

    // Visual flash for lapse
    setTimeout(() => {
      setShowLapseFlash(false)
    }, 300)

    // Move to next trial or complete
    setTimeout(() => {
      if (currentTrial + 1 >= TRIALS) {
        completeTest(validTimes, newLapses)
      } else {
        setCurrentTrial(c => c + 1)
        setPhase("idle")
      }
    }, 1500)
  }

  function completeTest(times: number[], lapseCount: number) {
    setPhase("done")

    // Calculate average from valid trials only
    const avg =
      times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0

    onComplete({
      reaction_time_ms: avg,
      reaction_attempted: 1,  // ✅ Correct: 1 indicates test was attempted
      reaction_lapses: lapseCount,
    })
  }

  function handleStart() {
    setValidTimes([])
    setLapses(0)
    setCurrentTrial(0)
    setLastFeedback("")
    startTrial()
  }

  function handleReset() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setValidTimes([])
    setLapses(0)
    setCurrentTrial(0)
    setLastFeedback("")
    setShowLapseFlash(false)
    setPhase("idle")
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-10 shadow-sm max-w-3xl">
      <h2 className="text-2xl font-bold mb-2">Reaction Time Test</h2>
      <p className="text-muted-foreground mb-8">
        Tap the center circle as quickly as possible when it turns green. {TRIALS} trials total.
      </p>

      {/* Progress Indicator */}
      {phase !== "idle" && (
        <div className="mb-8 text-center">
          <div className="text-sm text-muted-foreground mb-3">
            Trial {Math.min(currentTrial + 1, TRIALS)} of {TRIALS}
          </div>
          <div className="flex justify-center gap-2">
            {Array.from({ length: TRIALS }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${i < currentTrial
                  ? "bg-primary"
                  : i === currentTrial
                    ? "bg-primary/60"
                    : "bg-border"
                  }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Stimulus Button */}
      <div className="flex flex-col items-center gap-8 mb-8">
        <button
          onClick={handleTap}
          disabled={phase !== "stimulus"}
          className={`w-56 h-56 rounded-full flex flex-col items-center justify-center select-none font-bold transition-all duration-150 ${showLapseFlash
            ? "bg-red-500/70 border-4 border-red-600"
            : phase === "stimulus"
              ? "bg-green-500 hover:bg-green-600 text-white cursor-pointer border-4 border-green-600 shadow-lg scale-100"
              : phase === "waiting"
                ? "bg-muted border-4 border-border/50 text-muted-foreground cursor-default"
                : "bg-muted border-4 border-border text-muted-foreground cursor-default"
            }`}
        >
          <div className="text-2xl font-bold">
            {showLapseFlash
              ? "TOO SLOW"
              : phase === "stimulus"
                ? "TAP NOW"
                : phase === "waiting"
                  ? "READY"
                  : ""}
          </div>
          {phase === "stimulus" && (
            <div className="text-sm font-normal mt-2 text-green-100">Click when you see this</div>
          )}
        </button>

        {/* Feedback Display */}
        {lastFeedback && (
          <div
            className={`text-lg font-semibold transition-all ${showLapseFlash ? "text-red-600" : "text-green-600"
              }`}
          >
            {lastFeedback}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleStart}
          disabled={phase !== "idle" && phase !== "done"}
          className="flex-1 rounded-lg border border-primary px-4 py-3 text-sm font-medium hover:bg-primary/10 disabled:opacity-50 transition-all"
        >
          {phase === "idle" ? "Start Test" : phase === "done" ? "Test Complete" : "In Progress..."}
        </button>
        <button
          onClick={handleReset}
          className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-all"
        >
          Reset
        </button>
      </div>

      {/* Summary Stats */}
      {(phase === "done" || phase === "feedback") && (
        <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Valid Trials:</span>{" "}
            <span className="font-semibold">{validTimes.length}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Lapses:</span>{" "}
            <span className="font-semibold">{lapses}</span>
          </p>
          {validTimes.length > 0 && (
            <p>
              <span className="text-muted-foreground">Average RT:</span>{" "}
              <span className="font-semibold">
                {Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)} ms
              </span>
            </p>
          )}
        </div>
      )}

      {phase === "done" && (
        <p className="mt-6 text-center text-sm text-primary font-medium">
          ✓ Reaction test complete!
        </p>
      )}
    </div>
  )
}

// Step 3b: Audio Reaction Test Component (4 trials with lapse detection)
function AudioReactionTestStep({
  onComplete,
}: {
  onComplete: (data: {
    reaction_time_ms: number
    reaction_attempted: number
    reaction_lapses: number
  }) => void
}) {
  const TRIALS = 4
  const LAPSE_THRESHOLD = 1500 // ms
  const MAX_WAIT = 3000 // ms before timeout lapse

  const [phase, setPhase] = useState<"idle" | "waiting" | "stimulus" | "feedback" | "done">("idle")
  const [currentTrial, setCurrentTrial] = useState(0)
  const [validTimes, setValidTimes] = useState<number[]>([])
  const [lapses, setLapses] = useState(0)
  const [lastFeedback, setLastFeedback] = useState<string>("")
  const [showLapseFlash, setShowLapseFlash] = useState(false)
  const [stimulusAt, setStimulusAt] = useState(0)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Initialize Audio Context only on client side
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  // Play beep sound
  function playBeep() {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 800 // 800 Hz beep
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  }

  // Auto-start next trial when currentTrial increments
  useEffect(() => {
    if (phase === "idle" && currentTrial > 0 && currentTrial < TRIALS) {
      const delay = setTimeout(() => {
        startTrial()
      }, 500)
      return () => clearTimeout(delay)
    }
  }, [currentTrial, phase])

  function startTrial() {
    setLastFeedback("")
    setShowLapseFlash(false)
    setPhase("waiting")

    // Random delay 1-3 seconds before sound
    const delay = 1000 + Math.random() * 2000
    const timeId = setTimeout(() => {
      playBeep()
      setStimulusAt(performance.now())
      setPhase("stimulus")

      // Set timeout for max wait (3 seconds)
      const maxWaitId = setTimeout(() => {
        handleLapse()
      }, MAX_WAIT)

      setTimeoutId(maxWaitId)
    }, delay)

    return timeId
  }

  function handleTap() {
    if (phase !== "stimulus") return

    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }

    const rt = Math.round(performance.now() - stimulusAt)

    if (rt > LAPSE_THRESHOLD) {
      handleLapse()
    } else {
      const newValidTimes = [...validTimes, rt]
      setValidTimes(newValidTimes)
      setLastFeedback(`Reaction time: ${rt} ms`)
      setPhase("feedback")

      setTimeout(() => {
        if (currentTrial + 1 >= TRIALS) {
          completeTest(newValidTimes, lapses)
        } else {
          setCurrentTrial(c => c + 1)
          setPhase("idle")
        }
      }, 1500)
    }
  }

  function handleLapse() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }

    const newLapses = lapses + 1
    setLapses(newLapses)
    setShowLapseFlash(true)
    setLastFeedback("Lapse detected")
    setPhase("feedback")

    setTimeout(() => {
      setShowLapseFlash(false)
    }, 300)

    setTimeout(() => {
      if (currentTrial + 1 >= TRIALS) {
        completeTest(validTimes, newLapses)
      } else {
        setCurrentTrial(c => c + 1)
        setPhase("idle")
      }
    }, 1500)
  }

  function completeTest(times: number[], lapseCount: number) {
    setPhase("done")

    const avg =
      times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0

    onComplete({
      reaction_time_ms: avg,
      reaction_attempted: 1,
      reaction_lapses: lapseCount,
    })
  }

  function handleStart() {
    setValidTimes([])
    setLapses(0)
    setCurrentTrial(0)
    setLastFeedback("")
    startTrial()
  }

  function handleReset() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setValidTimes([])
    setLapses(0)
    setCurrentTrial(0)
    setLastFeedback("")
    setShowLapseFlash(false)
    setPhase("idle")
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-10 shadow-sm max-w-3xl">
      <h2 className="text-2xl font-bold mb-2">Audio Reaction Time Test</h2>
      <p className="text-muted-foreground mb-8">
        Click the center button as quickly as possible when you hear the beep sound. {TRIALS} trials total.
      </p>

      {/* Progress Indicator */}
      {phase !== "idle" && (
        <div className="mb-8 text-center">
          <div className="text-sm text-muted-foreground mb-3">
            Trial {Math.min(currentTrial + 1, TRIALS)} of {TRIALS}
          </div>
          <div className="flex justify-center gap-2">
            {Array.from({ length: TRIALS }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${i < currentTrial
                  ? "bg-primary"
                  : i === currentTrial
                    ? "bg-primary/60"
                    : "bg-border"
                  }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Stimulus Button */}
      <div className="flex flex-col items-center gap-8 mb-8">
        <button
          onClick={handleTap}
          disabled={phase !== "stimulus"}
          className={`w-56 h-56 rounded-full flex flex-col items-center justify-center select-none font-bold transition-all duration-150 ${showLapseFlash
            ? "bg-red-500/70 border-4 border-red-600"
            : phase === "stimulus"
              ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer border-4 border-blue-600 shadow-lg scale-100"
              : phase === "waiting"
                ? "bg-muted border-4 border-border/50 text-muted-foreground cursor-default"
                : "bg-muted border-4 border-border text-muted-foreground cursor-default"
            }`}
        >
          <div className="text-2xl font-bold">
            {showLapseFlash
              ? "TOO SLOW"
              : phase === "stimulus"
                ? "🔊 CLICK NOW"
                : phase === "waiting"
                  ? "🎧 LISTEN"
                  : ""}
          </div>
          {phase === "stimulus" && (
            <div className="text-sm font-normal mt-2 text-blue-100">Click when you hear the beep</div>
          )}
        </button>

        {/* Feedback Display */}
        {lastFeedback && (
          <div
            className={`text-lg font-semibold transition-all ${showLapseFlash ? "text-red-600" : "text-blue-600"
              }`}
          >
            {lastFeedback}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleStart}
          disabled={phase !== "idle" && phase !== "done"}
          className="flex-1 rounded-lg border border-primary px-4 py-3 text-sm font-medium hover:bg-primary/10 disabled:opacity-50 transition-all"
        >
          {phase === "idle" ? "Start Test" : phase === "done" ? "Test Complete" : "In Progress..."}
        </button>
        <button
          onClick={handleReset}
          className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-all"
        >
          Reset
        </button>
      </div>

      {/* Summary Stats */}
      {(phase === "done" || phase === "feedback") && (
        <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Valid Trials:</span>{" "}
            <span className="font-semibold">{validTimes.length}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Lapses:</span>{" "}
            <span className="font-semibold">{lapses}</span>
          </p>
          {validTimes.length > 0 && (
            <p>
              <span className="text-muted-foreground">Average RT:</span>{" "}
              <span className="font-semibold">
                {Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)} ms
              </span>
            </p>
          )}
        </div>
      )}

      {phase === "done" && (
        <p className="mt-6 text-center text-sm text-primary font-medium">
          ✓ Audio reaction test complete!
        </p>
      )}
    </div>
  )
}

// Main Analysis Page
export default function AnalysisPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [subjectiveData, setSubjectiveData] = useState<any>(null)
  const [selectedTestType, setSelectedTestType] = useState<"visual" | "audio" | null>(null)
  const [reactionData, setReactionData] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)

  async function handleAnalyze() {
    if (!subjectiveData || !reactionData) {
      alert("Please complete all steps before analyzing.")
      return
    }

    setAnalyzing(true)
    // Map frontend fields to backend FEATURE_ORDER and schema
    // subjectiveData: { sleep_hours, energy_level, stress_level }
    // reactionData: { reaction_time_ms, reaction_attempted, reaction_lapses }
    // Typing test metrics: TODO - collect real values, for now set to 0 (or use actual if available)
    const payload = {
      timestamp: new Date().toISOString(),
      answers: subjectiveData,
      typing_features: {
        average_latency_ms: 0, // TODO: Replace with real typing latency if available
        total_duration_ms: 0, // TODO: Replace with real typing duration if available
        backspace_rate: 0,    // TODO: Replace with real backspace rate if available
      },
      task_performance: {
        reaction_time_ms: reactionData?.reaction_time_ms ?? 0,
        reaction_attempted: reactionData?.reaction_attempted ?? 0,
        reaction_lapses: reactionData?.reaction_lapses ?? 0,
      },
    }

    try {
      const res = await predictFatigue(payload)
      console.log("✅ Backend response:", res)
      
      // Store results in localStorage for dashboard
      const storageData = {
        fatigue_score: res.fatigue_score,
        risk_level: res.risk_level,
        timestamp: new Date().toISOString(),
      }
      console.log("💾 Storing in localStorage:", storageData)
      localStorage.setItem(
        "neurofit_last_result",
        JSON.stringify(storageData)
      )
      // Navigate back to dashboard
      router.push("/")
    } catch (err) {
      console.error("Analysis failed:", err)
      alert("Prediction service failed. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Fatigue Analysis</h1>
          <p className="text-muted-foreground">Step {step} of 4</p>
        </div>

        {step === 1 && <SubjectiveForm onComplete={data => { setSubjectiveData(data); setStep(2) }} />}
        {step === 2 && <TestSelectionStep onComplete={(testType) => { setSelectedTestType(testType); setStep(3) }} />}
        {step === 3 && selectedTestType === "visual" && <VisualReactionTestStep onComplete={data => { setReactionData(data); setStep(4) }} />}
        {step === 3 && selectedTestType === "audio" && <AudioReactionTestStep onComplete={data => { setReactionData(data); setStep(4) }} />}

        {step === 4 && (
          <div className="rounded-2xl border border-border bg-card p-10 shadow-sm max-w-3xl">
            <h2 className="text-2xl font-bold mb-2">Ready to Analyze</h2>
            <p className="text-muted-foreground mb-6">
              All tests complete. Click below to get your fatigue analysis and workout recommendation.
            </p>

            <div className="space-y-2 mb-6 text-sm">
              <p>✓ Subjective inputs collected</p>
              <p>
                ✓ Reaction time measured: {reactionData?.reaction_time_ms}ms
                {reactionData?.reaction_lapses !== undefined && (
                  <span className="ml-2 text-muted-foreground">
                    ({reactionData.reaction_lapses} {reactionData.reaction_lapses === 1 ? "lapse" : "lapses"})
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {analyzing ? "Analyzing..." : "Analyze Results"}
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full mt-2 rounded-lg border border-border px-4 py-2 hover:bg-muted"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
