"use client"

import { useState, useRef, useEffect } from "react"
import Header from "@/components/header"
import WorkoutMedia from "@/components/workout-media"
import {
  type ChatMessage,
  type OllamaMessage,
  processChatMessageWithOllama,
  getRiskLevelLabel,
  getFatigueDescription,
  type ChatbotContext,
} from "@/lib/chatbotEngine"
import type { Workout } from "@/lib/workoutData"
import { getStepVideo } from "@/lib/workoutData"

// Fallback image mapping for steps with no video
const STEP_IMAGE_MAP: Record<string, string> = {
  "Plank shoulder taps – 45 seconds": "/images/plank_shoulder_taps.png",
  "Rest 1 minute and repeat twice": "/images/rest.png",
  "Neck stretch – 30 seconds": "/images/neck_stretch.png",
  "Chest opener – 1 minute": "/images/chest_opener.png",
  "Savasana – 3 minutes": "/images/savasana.png",
}

function getStepImage(step: string): string | undefined {
  return STEP_IMAGE_MAP[step]
}

/* ---------- Workout Card Component ---------- */

function WorkoutCard({
  workout,
  fatigueLevel,
}: {
  workout: Workout
  fatigueLevel?: string | null
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm space-y-2">
      {/* Workout Info */}
      <div>
        <p className="font-semibold text-primary">{workout.title}</p>
        <p className="text-xs text-muted-foreground">{workout.description}</p>
      </div>

      <div className="flex gap-3 text-xs">
        <span className="text-muted-foreground">
          ⏱️ {workout.duration_min} min
        </span>
        <span className="capitalize text-muted-foreground">
          💪 {workout.intensity}
        </span>
      </div>


      {expanded && (
        <div className="mt-2 space-y-3 border-t border-primary/20 pt-2">
          {workout.steps.map((step, idx) => {
            const videoUrl = getStepVideo(step)
            const imageUrl = getStepImage(step)
            return (
              <div key={idx} className="mb-2">
                <p className="text-xs text-foreground mb-1">• {step}</p>
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    className="rounded-lg border border-border w-full max-w-xs mb-1"
                    style={{ maxHeight: 180 }}
                  >
                    Sorry, your browser does not support embedded videos.
                  </video>
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={step}
                    className="rounded-lg border border-border w-full max-w-xs mb-1"
                    style={{ maxHeight: 180, objectFit: 'cover' }}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {/* Demo Media (fetched dynamically from Pixabay) */}
      <WorkoutMedia
        workout={workout}
        fatigueLevel={fatigueLevel as "low" | "moderate" | "high" | null | undefined}
      />

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-xs text-primary hover:underline"
      >
        {expanded ? "Hide steps" : "View steps"}
      </button>
    </div>
  )
}

/* ---------- Main Chatbot Page ---------- */

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState<ChatbotContext>({
    fatigueScore: null,
    riskLevel: null,
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  // ---- Load fatigue context from localStorage ----
  useEffect(() => {
    const stored = localStorage.getItem("neurofit_last_result")
    if (stored) {
      try {
        const data = JSON.parse(stored)
        console.log("📱 Chatbot loaded data from localStorage:", data)
        
        // Update context state
        setContext({
          fatigueScore: data.fatigue_score,
          riskLevel: data.risk_level,
          timestamp: data.timestamp,
        })

        // Initialize with greeting using the loaded data directly
        const riskLabel = getRiskLevelLabel(data.risk_level)
        console.log("🎯 Risk label:", riskLabel, "from riskLevel:", data.risk_level)
        
        const greeting = `Welcome! I see your fatigue level is **${riskLabel}**.\n\n${getFatigueDescription(data.risk_level)}`

        setMessages([
          {
            from: "bot",
            text: greeting,
          },
        ])
      } catch (e) {
        console.error("❌ Could not parse last result:", e)
        setMessages([
          {
            from: "bot",
            text: "Hello! Please run a fatigue analysis first on the Analysis page so I can personalize my recommendations.",
          },
        ])
      }
    } else {
      console.log("⚠️ No fatigue data found in localStorage")
      setMessages([
        {
          from: "bot",
          text: "Hello! I'm your NeuroFit Coach. To give you personalized recommendations, please run a fatigue analysis first.",
        },
      ])
    }
  }, [])

  // ---- Auto-scroll to bottom ----
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ---- Send message handler ----
  async function handleSend() {
    if (!userInput.trim()) return

    const newMessages: ChatMessage[] = [...messages, { from: "user", text: userInput }];
    setMessages(newMessages)
    setUserInput("")
    setIsLoading(true)

    try {
      // Map ChatMessage to OllamaMessage
      const ollamaMessages: OllamaMessage[] = newMessages.map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text
      }))

      // Process with Ollama
      const result = await processChatMessageWithOllama(
        ollamaMessages,
        context
      )

      // Add bot response
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: result.response,
        },
      ])
    } catch (error) {
      console.error("Error processing message:", error)
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Sorry, I couldn't reach the AI service. Please ensure Ollama is running locally.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // ---- Reset session ----
  function handleNewSession() {
    setMessages([
      {
        from: "bot",
        text:
          "Let's start fresh! " +
          getFatigueDescription(context.riskLevel || "low"),
      },
    ])
  }

  const riskLevel = getRiskLevelLabel(context.riskLevel)

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-3xl mx-auto p-8 h-[calc(100vh-120px)] flex flex-col">
        {/* ---- Fatigue Status ---- */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your Fatigue Level</p>
              <p className="text-lg font-semibold capitalize">{riskLevel}</p>
            </div>
            {context.fatigueScore !== null && (
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {Math.round(context.fatigueScore * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Fatigue Score</p>
              </div>
            )}
          </div>
        </div>

        {/* ---- Messages ---- */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md rounded-lg px-4 py-2 ${msg.from === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
                  }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {msg.text}
                </p>

                {/* ---- Workout Cards (Only if available) ---- */}
                {msg.workouts && msg.workouts.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.workouts.map((w) => (
                      <WorkoutCard
                        key={w.id}
                        workout={w}
                        fatigueLevel={context.riskLevel}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <p className="text-sm text-muted-foreground">Coach thinking...</p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ---- Input Area ---- */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex gap-2">
            <button
              onClick={handleNewSession}
              className="rounded-lg bg-secondary text-secondary-foreground px-3 py-2 text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Restart
            </button>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 rounded-lg border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !userInput.trim()}
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Send
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Coach uses Ollama AI. Adjusts recommendations naturally based on your fatigue level.
          </p>
        </div>
      </div>
    </main>
  )
}
