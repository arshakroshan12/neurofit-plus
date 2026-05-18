"use client"

import Link from "next/link"

export default function Header() {
  return (
    <header className="border-b border-border/40 bg-white/95 backdrop-blur-sm p-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">NeuroFit+</h1>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
          <Link href="/chatbot" className="text-foreground hover:text-primary transition-colors">Chatbot</Link>
          <Link href="/login" className="text-foreground hover:text-primary transition-colors">Login</Link>
        </nav>
      </div>
    </header>
  )
}

