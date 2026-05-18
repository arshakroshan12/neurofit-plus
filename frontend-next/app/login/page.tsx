"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    // No real auth (by design)
    localStorage.setItem("neurofit_user", JSON.stringify({ email }))
    router.push("/profile")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md rounded-2xl border-border/60 bg-white shadow-lg">
        <CardHeader className="space-y-3 pb-8 pt-10 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            NeuroFit<span className="text-primary">+</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back to your fitness journey
          </p>
        </CardHeader>

        <CardContent className="space-y-8 px-8 pb-10">
          <form onSubmit={submit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-xl border-border bg-input text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Password */}
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-12 rounded-xl border-border bg-input text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Sign in
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Your data stays private
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
