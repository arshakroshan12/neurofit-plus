import type { Workout, FatigueLevel } from "./workoutData"

export interface ChatbotContext {
  fatigueScore: number | null // Raw 0-1 from backend
  riskLevel: "low" | "medium" | "high" | null // Exact value from backend
  timestamp?: string
}

export type ChatMessage = {
  from: "user" | "bot"
  text: string
  workouts?: Workout[]
}

export type OllamaMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export function getRiskLevelLabel(riskLevel: string | null): FatigueLevel | null {
  if (!riskLevel) return null
  if (riskLevel === "low") return "low"
  if (riskLevel === "moderate") return "moderate"
  if (riskLevel === "high") return "high"
  return null
}

export function getFatigueDescription(riskLevel: string | null): string {
  const level = getRiskLevelLabel(riskLevel)
  if (!level) return "Unknown fatigue level"

  const descriptions: Record<FatigueLevel, string> = {
    low: "Your cognitive fatigue is low. You're ready for challenging training.",
    moderate: "Your cognitive fatigue is moderate. Light to moderate workouts are recommended.",
    high: "Your cognitive fatigue is high. Recovery-focused activities are best.",
  }
  return descriptions[level]
}

/**
 * Process a chat message by calling the Next.js API route that connects to Ollama.
 */
export async function processChatMessageWithOllama(
  messages: OllamaMessage[],
  context: ChatbotContext
): Promise<{ response: string }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const data = await response.json();
  return { response: data.message.content };
}
