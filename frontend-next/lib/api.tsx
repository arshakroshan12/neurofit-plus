"use client"

export async function predictFatigue(payload: any) {
  const url = "http://localhost:8000/predict_fatigue" // FORCE LOCAL

  console.log("🔗 CALLING BACKEND:", url)
  console.log("📦 PAYLOAD:", payload)

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => "")
    console.error("❌ Backend error:", resp.status, text)
    throw new Error(`Prediction failed ${resp.status} ${text}`)
  }

  const data = await resp.json()
  console.log("✅ Backend response received:", data)
  return data
}

export default predictFatigue
