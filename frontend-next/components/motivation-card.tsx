"use client"

type Props = {
  riskLevel: "low" | "high"
}

export default function MotivationCard({ riskLevel }: Props) {
  const message =
    riskLevel === "high"
      ? "Your mind seems a bit fatigued today. A lighter workout and proper rest will help you recover."
      : "You’re in a good cognitive state today. This is a great time to push yourself safely."

  return (
    <div className="rounded-xl border border-border/60 p-6 shadow-sm bg-gradient-to-b from-accent/10 to-white">
      <h2 className="mb-2 text-lg font-semibold">Motivation</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
