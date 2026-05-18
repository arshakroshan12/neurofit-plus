# ExerciseDB Integration Setup

## Overview

NeuroFit+ now integrates with **ExerciseDB (RapidAPI)** to provide real exercise data alongside fatigue-based recommendations. All fatigue logic remains local and deterministic.

## Architecture Principles

✅ **What ExerciseDB provides**: Exercise names, targets, equipment, descriptions  
❌ **What ExerciseDB does NOT provide**: Fatigue decisions, safety filtering, intensity rules  

**All safety and fatigue logic is LOCAL** in `chatbotService.ts` and `exerciseDbService.ts`.

---

## Environment Setup

### 1. Get ExerciseDB API Key

1. Go to [RapidAPI ExerciseDB](https://rapidapi.com/justin-WFnsXH_haHLw/api/exercisedb)
2. Click **"Subscribe"** (free tier available)
3. Copy your **X-RapidAPI-Key**

### 2. Set Environment Variable

In `frontend-next/.env.local`:

```env
NEXT_PUBLIC_EXERCISE_DB_KEY=your_api_key_here
```

⚠️ **Important**: 
- Use `NEXT_PUBLIC_` prefix so the variable is available in browser
- Add `.env.local` to `.gitignore` (never commit API keys)
- For production (Vercel/Netlify), set via deployment platform dashboard

### 3. Verify Setup

Run the app:

```bash
cd frontend-next
npm run dev
```

Open the chatbot, set fatigue level, select focus area → ExerciseDB exercises should appear.

Check browser console for logs:
- `"ExerciseDB API error..."` → API key issue or quota exceeded
- `"ExerciseDB unavailable..."` → Falls back to local data
- No errors → Working correctly

---

## How It Works

### Flow: User Asks for Workouts (Low/Moderate Fatigue)

```
User: "I want to do chest workouts"
     ↓
chatbotService.processChatMessageAsync()
     ↓
LOCAL DECISION: Is fatigue HIGH? → YES: Return recovery-only
                              → NO: Continue
     ↓
exerciseDbService.getExercisesForFocusArea(focusArea, fatigueLevel)
     ↓
FETCH from ExerciseDB ("chest" body part)
     ↓
LOCAL FILTER: Remove high-impact exercises based on FATIGUE
     ↓
NORMALIZE to Workout format
     ↓
LIMIT to 3–5 results
     ↓
Return to UI OR fallback to local workoutData.ts if API fails
```

### High Fatigue Mode

When `fatigueLevel === "high"`:
- **ExerciseDB is NOT queried**
- Returns recovery-only workouts from local `workoutData.ts`
- No API calls = faster, no unnecessary requests

---

## File Structure

```
frontend-next/lib/
├── exerciseDbService.ts    ← NEW: ExerciseDB integration (data retrieval only)
├── chatbotService.ts       ← UPDATED: Added processChatMessageAsync()
├── workoutData.ts          ← UNCHANGED: Local fallback workouts
└── api.ts                  ← No changes needed
```

---

## Key Functions

### `exerciseDbService.ts`

```typescript
/**
 * Main integration point. Handles fetch, filter, normalize.
 * Returns empty array if ExerciseDB unavailable (caller falls back to local data).
 */
export async function getExercisesForFocusArea(
  focusArea: FocusArea,
  fatigueLevel: FatigueLevel,
  maxResults: number = 5
): Promise<Workout[]>

/**
 * Fetch raw exercises from API.
 * Data retrieval only - no filtering.
 */
export async function fetchExercisesFromApi(
  bodyPart: string
): Promise<ExerciseDbExercise[]>

/**
 * Apply LOCAL fatigue rules to API results.
 * Decision rule: HIGH fatigue = [] (recovery-only)
 */
export function filterExercisesByFatigue(
  exercises: ExerciseDbExercise[],
  fatigueLevel: FatigueLevel
): ExerciseDbExercise[]

/**
 * Translate focus area (arms) → body part (upper arms)
 */
export function mapFocusAreaToBodyPart(focusArea: FocusArea): string
```

### `chatbotService.ts`

```typescript
/**
 * Async version with ExerciseDB support.
 * Falls back to local data if ExerciseDB returns empty results.
 * Use this for user-facing chatbot responses.
 */
export async function processChatMessageAsync(
  userMessage: string,
  context: ChatbotContext,
  state: ChatbotState
): Promise<{ response: string; newState: ChatbotState; workouts?: Workout[] }>

/**
 * Original sync version (still available).
 * Uses local workoutData only - no API calls.
 */
export function processChatMessage(
  userMessage: string,
  context: ChatbotContext,
  state: ChatbotState
): { response: string; newState: ChatbotState; workouts?: Workout[] }
```

---

## Usage in Components

### Async (with ExerciseDB)

```typescript
import { processChatMessageAsync } from "@/lib/chatbotService"

// In your chatbot component:
const result = await processChatMessageAsync(userMessage, context, state)
displayWorkouts(result.workouts) // May include real ExerciseDB exercises
```

### Sync (local data only)

```typescript
import { processChatMessage } from "@/lib/chatbotService"

// If you need synchronous response (no API):
const result = processChatMessage(userMessage, context, state)
displayWorkouts(result.workouts) // Always local workoutData
```

---

## Error Handling & Fallbacks

| Scenario | Behavior |
|----------|----------|
| **API key missing** | Log warning, return `[]`, use local workouts |
| **API rate limit exceeded** | Log error, return `[]`, use local workouts |
| **High fatigue** | Skip API entirely, return recovery-only |
| **No exercises match focus area** | Return `[]`, use local workouts |
| **All exercises filtered by fatigue** | Return `[]`, use local workouts |

**Result**: User always gets workouts (from ExerciseDB or local fallback) with NO crashes.

---

## Safety & Fatigue Thresholds

**These are NOT set by ExerciseDB. They are LOCAL:**

### Fatigue Level Determination
```typescript
fatigueScore < 0.35  → "low"
0.35 ≤ score < 0.70  → "moderate"
0.70 ≤ score ≤ 1.0   → "high"
```

### Intensity Filtering (Moderate Fatigue Only)
```typescript
Keep:     abs, glutes, quads, hamstrings, lower back (gentle)
Exclude:  jump, explosive, plyometric, impact movements
```

### High Fatigue Behavior
```typescript
Recovery-only:
  • Gentle stretching
  • Restorative yoga
  • Light mobility
  • Breathing exercises
```

These rules are **hardcoded** in `exerciseDbService.filterExercisesByFatigue()` and **cannot be overridden** by API responses.

---

## Testing

### Manual Test: Low Fatigue + Chest

1. Run chatbot
2. Submit analysis with low fatigue (e.g., 8 hours sleep, low stress)
3. Tell chatbot: "I want to do chest"
4. Expected: Real exercises from ExerciseDB appear
5. Check browser console for log: "ExerciseDB unavailable..." or no errors

### Manual Test: High Fatigue

1. Run chatbot
2. Submit analysis with high fatigue (e.g., 3 hours sleep, high stress)
3. Tell chatbot: "I want to do chest"
4. Expected: Recovery-only workouts, NO ExerciseDB call (check Network tab)

### Manual Test: API Disabled

1. Comment out API key in `.env.local`
2. Run chatbot with low fatigue + focus area
3. Expected: Local workouts appear, console shows "API key not configured"

---

## Performance Notes

- **API call latency**: ~200–500ms depending on network
- **Caching**: Not implemented (each request fetches fresh data)
- **Rate limit**: Free tier = 100 requests/day
- **High fatigue optimization**: Skips API entirely, returns instantly

---

## Deployment

### Vercel / Netlify

1. Add environment variable in dashboard:
   ```
   NEXT_PUBLIC_EXERCISE_DB_KEY = <your_key>
   ```

2. Deploy as usual

3. Verify on production:
   - Open chatbot
   - Check Network tab for ExerciseDB requests
   - Fallback to local data if API fails

### Self-Hosted

Set environment variable before starting app:

```bash
export NEXT_PUBLIC_EXERCISE_DB_KEY="your_key"
npm run build
npm run start
```

---

## Future Enhancements

- **Caching**: Store API results in localStorage for 1 hour
- **User preferences**: Remember favorite exercises
- **Advanced filtering**: Filter by equipment type
- **Personalization**: Rank exercises by user history

---

## Support

If ExerciseDB integration fails:

1. Check `.env.local` has `NEXT_PUBLIC_EXERCISE_DB_KEY`
2. Verify API key is valid on RapidAPI dashboard
3. Check Network tab in browser DevTools for API responses
4. Check browser console for error logs
5. Fallback to local data should still work

For issues, logs are available in:
- Browser console (client-side errors)
- RapidAPI dashboard (usage stats)
