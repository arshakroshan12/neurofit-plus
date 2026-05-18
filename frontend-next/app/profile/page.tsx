"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProfilePage(){
  const router = useRouter()
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [goal, setGoal] = useState("")

  useEffect(()=>{
    const saved = localStorage.getItem('neurofit_profile')
    if (saved) {
      const p = JSON.parse(saved)
      setName(p.name||"")
      setAge(p.age||"")
      setGender(p.gender||"")
      setHeight(p.height||"")
      setWeight(p.weight||"")
      setGoal(p.goal||"")
    }
  },[])

  function save(e: React.FormEvent){
    e.preventDefault()
    const profile = { name, age, gender, height, weight, goal }
    localStorage.setItem('neurofit_profile', JSON.stringify(profile))
    router.push('/')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-2xl">
        <div className="card p-8">
          <h1 className="text-2xl font-semibold mb-4">Profile Setup</h1>
          <form onSubmit={save} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <div className="text-sm">Name</div>
              <input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded-md border p-2" />
            </label>
            <label>
              <div className="text-sm">Age</div>
              <input value={age} onChange={(e)=>setAge(e.target.value)} type="number" className="mt-1 w-full rounded-md border p-2" />
            </label>
            <label>
              <div className="text-sm">Gender (optional)</div>
              <input value={gender} onChange={(e)=>setGender(e.target.value)} className="mt-1 w-full rounded-md border p-2" />
            </label>
            <label>
              <div className="text-sm">Fitness goal</div>
              <select value={goal} onChange={(e)=>setGoal(e.target.value)} className="mt-1 w-full rounded-md border p-2">
                <option value="">Select goal</option>
                <option>Build strength</option>
                <option>Improve endurance</option>
                <option>Lose weight</option>
                <option>Maintain fitness</option>
              </select>
            </label>
            <label>
              <div className="text-sm">Height (cm)</div>
              <input value={height} onChange={(e)=>setHeight(e.target.value)} type="number" className="mt-1 w-full rounded-md border p-2" />
            </label>
            <label>
              <div className="text-sm">Weight (kg)</div>
              <input value={weight} onChange={(e)=>setWeight(e.target.value)} type="number" className="mt-1 w-full rounded-md border p-2" />
            </label>

            <div className="md:col-span-2 flex justify-end">
              <button className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Save Profile</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
