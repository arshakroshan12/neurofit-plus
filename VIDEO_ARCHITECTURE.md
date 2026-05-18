# Workout Demo Video Integration — Architecture Diagram

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  CHATBOT PAGE (page.tsx)                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ User: "Suggest a workout"                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ processChatMessageAsync()                           │   │
│  │ - Determines fatigue level                          │   │
│  │ - Selects appropriate workouts                      │   │
│  │ - Returns Workout[] with mediaUrl fields            │   │
│  │ (Decision logic UNCHANGED)                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ChatMessage object:                                 │   │
│  │ {                                                    │   │
│  │   from: "bot",                                      │   │
│  │   text: "Here's a great workout...",                │   │
│  │   workouts: [                                       │   │
│  │     {                                               │   │
│  │       id: "arms_low_1",                             │   │
│  │       title: "Upper-Body Sculpt",                   │   │
│  │       mediaUrl: "/videos/upper-body-sculpt.mp4"     │   │
│  │     }                                               │   │
│  │   ]                                                 │   │
│  │ }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Render in messages list:                            │   │
│  │ {msg.workouts.map((w) =>                            │   │
│  │   <WorkoutCard workout={w} />                       │   │
│  │ )}                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              WORKOUT CARD COMPONENT                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Workout Title: "Upper-Body Sculpt"                 │    │
│  │ Duration: 15 min | Intensity: medium               │    │
│  └────────────────────────────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ <VideoDemo src={workout.mediaUrl} />               │    │
│  │                                                     │    │
│  │ (Receives: "/videos/upper-body-sculpt.mp4")        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│            VIDEO DEMO COMPONENT (video-demo.tsx)             │
│                                                              │
│  Check if src is defined:                                   │
│  ├─ YES: Render <video>                                     │
│  │   ├─ autoPlay ✓                                          │
│  │   ├─ loop ✓                                              │
│  │   ├─ muted ✓                                             │
│  │   ├─ playsInline ✓                                       │
│  │   └─ onError: log warning if file missing                │
│  │       Caption: "Demo video for visual guidance only"     │
│  │                                                          │
│  └─ NO: Return null (graceful fallback)                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│           BROWSER NATIVE VIDEO PLAYER                        │
│                                                              │
│   ┌────────────────────────────────────────────┐           │
│   │ [Video plays: muted, looping, 15-30 sec]   │           │
│   │                                             │           │
│   │ Demo video for visual guidance only        │           │
│   └────────────────────────────────────────────┘           │
│                                                              │
│   Resources served from:                                    │
│   /public/videos/upper-body-sculpt.mp4                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Interaction

```
┌─────────────────────────────────────────────────────┐
│ Chatbot Page (app/chatbot/page.tsx)                 │
│                                                     │
│  Import:                                            │
│  ├─ processChatMessageAsync (decision logic)        │
│  ├─ VideoDemo (new video component)                 │
│  └─ WorkoutCard (renders workouts)                  │
│                                                     │
│  State:                                             │
│  ├─ messages: ChatMessage[]                         │
│  ├─ userInput: string                               │
│  └─ context: ChatbotContext (fatigue, risk level)   │
│                                                     │
│  On handleSend():                                   │
│  1. Call processChatMessageAsync()                  │
│  2. Receive workouts with mediaUrl                  │
│  3. Add to messages                                 │
│  4. Render with WorkoutCard                         │
│                                                     │
└─────────────────────────────────────────────────────┘
           │
           ├─→ WorkoutCard Component              
           │   (Lines 20-55 in page.tsx)
           │   
           │   Receives: Workout object
           │   Contains:
           │   ├─ Title, description, duration
           │   ├─ Steps (expandable)
           │   └─ <VideoDemo src={mediaUrl} />   ◄──┐
           │                                          │
           └─→ VideoDemo Component (video-demo.tsx)──┘
               
               Receives: mediaUrl?
               Returns:
               ├─ null (if no mediaUrl)
               └─ <video autoPlay loop muted /> + caption
```

---

## File Dependencies

```
workoutData.ts
├─ Contains: Workout interface + WORKOUT_LIBRARY
├─ Has: mediaUrl fields with /videos/* paths
└─ Used by: chatbotEngine.ts → chatbot/page.tsx

                ↓

chatbotEngine.ts
├─ Imports: workoutData (getWorkoutsForFocusArea)
├─ Exports: processChatMessageAsync, Workout type
└─ Returns: workouts array

                ↓

chatbot/page.tsx
├─ Imports: chatbotEngine (processChatMessageAsync)
│           workoutData (Workout type)
│           VideoDemo (new component)
│
├─ Calls: processChatMessageAsync()
├─ Renders: WorkoutCard (passes workout object)
└─ WorkoutCard renders: VideoDemo (passes mediaUrl)

                ↓

video-demo.tsx (NEW)
├─ Imports: None (pure React component)
├─ Props: src?: string
├─ Renders: <video> if src defined, else null
└─ Features: autoPlay, loop, muted, playsInline
```

---

## Data Structure

```typescript
// From workoutData.ts
interface Workout {
  id: string
  title: string
  description: string
  duration_min: number
  intensity: "easy" | "medium" | "hard"
  focusAreas: FocusArea[]
  steps: string[]
  mediaUrl?: string  // ◄─── NEW: Optional video path
}

// Example:
{
  id: "arms_low_1",
  title: "Upper-Body Sculpt",
  description: "Focused arm workout...",
  duration_min: 15,
  intensity: "medium",
  focusAreas: ["arms"],
  steps: [
    "Push-ups – 45 seconds",
    "Tricep dips using chair – 45 seconds",
    ...
  ],
  mediaUrl: "/videos/upper-body-sculpt.mp4"  // ◄─── Path to video
}

// VideoDemo component:
<VideoDemo src={workout.mediaUrl} />

// If mediaUrl is undefined:
<VideoDemo src={undefined} />  // → returns null
```

---

## Request-Response Flow

```
USER:
"Suggest a workout"
    │
    ▼
CHATBOT ENGINE:
- Read fatigueScore from context
- Select appropriate workouts
- Return: workouts: [
    { id, title, description, duration, intensity, steps, mediaUrl }
  ]
    │
    ▼
CHATBOT PAGE:
- Add workouts to messages
- Render WorkoutCard for each
    │
    ▼
WORKOUT CARD:
- Display workout info
- Render VideoDemo component
- Pass mediaUrl prop
    │
    ▼
VIDEO DEMO:
- Check if mediaUrl exists
- If yes: Render video from /public/videos/
- If no: Return null
    │
    ▼
BROWSER:
- Fetch video file from public/videos/
- Play video (muted, autoPlay, loop)
- Display caption
    │
    ▼
USER:
Sees workout recommendation + demo video
```

---

## File Locations

```
frontend-next/
│
├── app/
│   ├── chatbot/
│   │   └── page.tsx                 ◄─── MODIFIED
│   │       └─ Added: import VideoDemo
│   │       └─ Added: <VideoDemo src={mediaUrl} /> in WorkoutCard
│   │
│   └── ...
│
├── components/
│   ├── video-demo.tsx               ◄─── NEW (45 lines)
│   │   └─ Reusable video component
│   │   └─ Props: src?: string
│   │   └─ Returns: <video> or null
│   │
│   └── ...
│
├── lib/
│   ├── workoutData.ts               ◄─── MODIFIED
│   │   └─ Updated 6 mediaUrl entries
│   │   └─ Changed: external URLs → /videos/* paths
│   │
│   └── ...
│
├── public/
│   └── videos/                      ◄─── Video files go here
│       ├── upper-body-sculpt.mp4
│       ├── chest-sculpt.mp4
│       ├── lower-body-strength.mp4
│       ├── core-strength-builder.mp4
│       └── full-body-functional.mp4
│
└── ...
```

---

## Constraint Verification

```
┌────────────────────────────────────────────────────┐
│ CHATBOT DECISION LOGIC                              │
│ ✓ Fatigue calculation: UNCHANGED                    │
│ ✓ Threshold logic: UNCHANGED                        │
│ ✓ Workout selection: UNCHANGED                      │
│ ✓ processChatMessageAsync: No changes               │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ VIDEO INTEGRATION                                   │
│ ✓ Only displays if mediaUrl is set                 │
│ ✓ Gracefully returns null if missing                │
│ ✓ Videos loaded from /public/videos/* only          │
│ ✓ No external URLs                                  │
│ ✓ No API calls for videos                           │
│ ✓ Muted, autoPlay, loop configured                  │
│ ✓ Non-blocking (doesn't delay chat)                 │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ BACKWARD COMPATIBILITY                              │
│ ✓ All workouts work without mediaUrl                │
│ ✓ Chatbot works if videos are missing               │
│ ✓ No breaking changes to existing code              │
│ ✓ Workout data schema compatible                    │
└────────────────────────────────────────────────────┘
```

---

**Last Updated**: January 27, 2026
