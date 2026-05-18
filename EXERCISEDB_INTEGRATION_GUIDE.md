# ExerciseDB Integration Guide

## Quick Start

### 1. Get API Key (2 minutes)

1. Visit [RapidAPI ExerciseDB](https://rapidapi.com/justin-WFnsXH_haHLw/api/exercisedb)
2. Click **Subscribe** (free tier)
3. Go to **Credentials** tab
4. Copy your **X-RapidAPI-Key**

### 2. Configure Frontend (1 minute)

In `frontend-next/`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_EXERCISE_DB_KEY=paste_your_key_here
```

### 3. Start Dev Server (1 minute)

```bash
cd frontend-next
npm install  # if needed
npm run dev
```

### 4. Test in Chatbot

1. Go to http://localhost:3000/chatbot
2. Run a fatigue analysis (dashboard → "Run Fatigue Analysis")
3. Select fatigue level and complete all steps
4. Back in chatbot, say: "I want to do chest"
5. Should see real ExerciseDB exercises + local fallback workouts

**Expected behavior:**
- Network tab shows request to `exercisedb.p.rapidapi.com`
- Browser console shows no errors (or logs "ExerciseDB available for chest")
- Workout cards display real exercises from API

---

## Architecture Overview

### Data Flow

```
User Input (chatbot)
    ↓
processChatMessageAsync()  [in chatbotService.ts]
    ↓
    ├─ Check: Fatigue HIGH?
    │  ├─ YES → Return recovery-only (no API call)
    │  └─ NO → Continue
    ├─ Parse: Focus area (e.g., "chest")
    │  ↓
    ├─ getExercisesForFocusArea()  [in exerciseDbService.ts]
    │  ├─ Map focus area → body part ("chest" → "chest")
    │  ├─ Fetch from ExerciseDB API
    │  ├─ Filter by fatigue level (LOCAL logic)
    │  ├─ Limit to 3-5 results
    │  └─ Return normalized Workout[]
    │
    ├─ Empty results?
    │  ├─ YES → Fallback to local workoutData.ts
    │  └─ NO → Use API results
    ↓
Display workouts in chatbot UI
```

### Key Design Decisions

**Why ExerciseDB is only for data retrieval:**
- ✅ Centralized, reliable exercise database
- ✅ Real-time updates (new exercises added by maintainers)
- ✅ No need to maintain local exercise data
- ✅ Reduces bundle size (local data is fallback only)

**Why fatigue logic stays local:**
- ✅ API doesn't know our fatigue thresholds
- ✅ Explainable decisions (hardcoded in source)
- ✅ Works offline (local fallback always available)
- ✅ No API dependency for safety-critical logic

---

## File Structure

### New Files

- **`frontend-next/lib/exerciseDbService.ts`** (277 lines)
  - `getExercisesForFocusArea()` — Main entry point
  - `fetchExercisesFromApi()` — API communication
  - `filterExercisesByFatigue()` — LOCAL safety filter
  - `mapFocusAreaToBodyPart()` — Translation layer
  - `normalizeExerciseToWorkout()` — Format conversion

- **`frontend-next/.env.local.example`**
  - Environment template (cp → .env.local, add your key)

- **`EXERCISEDB_SETUP.md`**
  - Deployment + troubleshooting guide

### Modified Files

- **`frontend-next/lib/chatbotService.ts`** (additions)
  - Import: `getExercisesForFocusArea` from exerciseDbService
  - New function: `processChatMessageAsync()` — Async version with ExerciseDB
  - Existing: `processChatMessage()` — Sync version (unchanged logic, uses local data)

### Unchanged Files

- `frontend-next/lib/workoutData.ts` — Local fallback (no changes)
- `frontend-next/app/analysis/page.tsx` — No changes needed
- Backend (`backend/app/main.py`) — No changes needed

---

## API Contract

### ExerciseDB API

**Endpoint**: `GET /exercises/bodyPart/{bodyPart}`

**Headers**:
```
X-RapidAPI-Key: your_key
X-RapidAPI-Host: exercisedb.p.rapidapi.com
```

**Response** (example):
```json
[
  {
    "id": "3285",
    "name": "barbell bench press",
    "target": "pectorals",
    "bodyPart": "chest",
    "equipment": "barbell",
    "gifUrl": "..."
  },
  ...
]
```

**Error Handling**:
- 401: Invalid API key → Log warning, return []
- 429: Rate limit → Log error, return []
- Network error → Log error, return []

**Result**: Always falls back to local workoutData.ts

---

## Focus Area → Body Part Mapping

This translation happens in `mapFocusAreaToBodyPart()`:

| Chatbot Focus Area | ExerciseDB Body Part | Notes |
|--------------------|---------------------|-------|
| `arms` | `upper arms` | Biceps, triceps |
| `chest` | `chest` | Pectorals |
| `legs` | `upper legs` | Quads, hamstrings |
| `core` | `waist` | Abs, obliques |
| `full_body` | `back` | Proxy for full-body |

---

## Fatigue-Based Filtering

**Applied AFTER fetching from API** (local decision):

### High Fatigue (≥0.70)
- Skip API entirely
- Return recovery-only workouts
- No database queries

### Moderate Fatigue (0.35–0.70)
- Fetch all exercises for body part
- **Exclude**: high-impact movements (jump, explosive, plyometric)
- **Keep**: low-impact targets (abs, glutes, lower back)

### Low Fatigue (<0.35)
- Fetch all exercises
- No filtering
- Include high-intensity options

**Example**:
```typescript
// High fatigue + "chest"
getExercisesForFocusArea("chest", "high")
→ Returns [] (recovery-only: use getAllRecoveryWorkouts())

// Moderate fatigue + "chest"
getExercisesForFocusArea("chest", "moderate")
→ Fetches from API, filters OUT: "explosive chest press", "plyometric push-ups"
→ Keeps: "barbell bench press", "chest fly"

// Low fatigue + "chest"
getExercisesForFocusArea("chest", "low")
→ Returns all API results (5–10 exercises)
```

---

## Error Handling

### Scenario: No API Key

```
Process: .env.local missing NEXT_PUBLIC_EXERCISE_DB_KEY
Console: "ExerciseDB API key not configured. Fallback to local workout data."
Result: User sees local workoutData
HTTP:   No API call attempted
```

### Scenario: API Key Invalid

```
Process: Fetch to ExerciseDB fails (401)
Console: "ExerciseDB API error (401). Fallback to local data."
Result: User sees local workoutData
HTTP:   1 failed request
```

### Scenario: Rate Limit Hit

```
Process: Fetch returns 429 (too many requests)
Console: "ExerciseDB API error (429). Fallback to local data."
Result: User sees local workoutData
HTTP:   1 failed request (throttled)
Timing: <500ms (fast failure)
```

### Scenario: All Exercises Filtered (Moderate Fatigue)

```
Process: Fetch 10 chest exercises, all are high-impact
Filter:  All removed by fatigue filter
Result:  User sees local workoutData instead
Console: "All exercises filtered out by fatigue level moderate. Fallback..."
```

**Pattern**: Always graceful degradation to local fallback.

---

## Deployment Checklist

### Local Development

- [ ] Copy `.env.local.example` → `.env.local`
- [ ] Add API key to `.env.local`
- [ ] Run `npm run dev` in `frontend-next/`
- [ ] Test chatbot with low/moderate/high fatigue
- [ ] Check browser console for logs
- [ ] Check Network tab for ExerciseDB requests

### Production (Vercel)

- [ ] Add `NEXT_PUBLIC_EXERCISE_DB_KEY` in Vercel dashboard
- [ ] Deploy
- [ ] Test on live environment
- [ ] Monitor RapidAPI usage dashboard

### Production (Self-Hosted)

- [ ] Set `NEXT_PUBLIC_EXERCISE_DB_KEY` environment variable
- [ ] Run `npm run build`
- [ ] Run `npm run start`
- [ ] Test chatbot
- [ ] Fallback to local data works if API key missing

---

## Monitoring & Debugging

### Browser Console Logs

**Success**:
```
[No errors]
ExerciseDB available for chest: 8 exercises
```

**API Key Missing**:
```
ExerciseDB API key not configured. Fallback to local workout data.
```

**Network Error**:
```
ExerciseDB fetch error: TypeError: Failed to fetch
ExerciseDB unavailable for chest. Using local workout data.
```

**Filtering Result**:
```
High fatigue detected. Skipping ExerciseDB fetch (recovery-only mode).
```

### Network Tab (Chrome DevTools)

1. Open DevTools → Network tab
2. Ask chatbot for workout (e.g., "I want to do chest")
3. Look for request to: `https://exercisedb.p.rapidapi.com/exercises/bodyPart/chest`

**Expected**:
- Status: 200 OK
- Response: Array of exercise objects
- Headers: X-RapidAPI-Key present

**If 401**:
- API key invalid or expired
- Check RapidAPI dashboard
- Regenerate key if needed

---

## Performance Considerations

| Factor | Impact | Notes |
|--------|--------|-------|
| **API latency** | 200–500ms | Network + server processing |
| **Fallback speed** | <5ms | Local workoutData.ts (instant) |
| **High fatigue** | <1ms | Skips API entirely |
| **Bundle size** | +0 bytes | ExerciseDB not bundled (API only) |
| **Rate limit** | 100/day (free) | Per RapidAPI plan |

**Optimization tip**: If frequent chatbot usage, add caching:
```typescript
// Future enhancement
const cache = new Map<string, Workout[]>()
```

---

## Troubleshooting

### Problem: "Reaction test" or "Typing test" not showing exercises

**Cause**: Those are data-collection steps, not workout selection. Exercises appear after you select focus area in chatbot.

**Solution**: Complete all steps on analysis page → go to chatbot → ask for focus area.

### Problem: Exercises not from ExerciseDB (always local data)

**Possible causes**:
1. API key missing or invalid
2. ExerciseDB API rate limit exceeded
3. Body part name mismatch

**Debug**:
1. Check `.env.local` has `NEXT_PUBLIC_EXERCISE_DB_KEY`
2. Verify key on RapidAPI dashboard
3. Check browser console for error messages
4. Check Network tab for failed requests

### Problem: "No exercises found for arms"

**Causes**:
- All exercises filtered by fatigue level
- API returned empty results
- Body part mapping issue

**Solution**:
- Try different focus area (chest, legs, core)
- Check console for filter logs
- Verify API response in Network tab

### Problem: Exceeding rate limit (429 errors)

**Cause**: Free tier = 100 requests/day (shared across all users on same API key).

**Solution**:
- Monitor RapidAPI dashboard usage
- Upgrade to paid tier if needed
- Implement caching in `exerciseDbService.ts`

---

## Code Examples

### Using Sync Version (Local Only)

```typescript
import { processChatMessage } from "@/lib/chatbotService"

// No API calls - instant response
const result = processChatMessage(userMessage, context, state)
console.log(result.workouts) // Always from workoutData.ts
```

### Using Async Version (with ExerciseDB)

```typescript
import { processChatMessageAsync } from "@/lib/chatbotService"

// May include real exercises from API
const result = await processChatMessageAsync(userMessage, context, state)
console.log(result.workouts) // May include ExerciseDB results

// Handle error (will never throw - always has fallback)
try {
  const result = await processChatMessageAsync(msg, ctx, state)
  setWorkouts(result.workouts)
} catch (e) {
  console.error("Unexpected error:", e)
}
```

### Direct API Usage

```typescript
import { getExercisesForFocusArea } from "@/lib/exerciseDbService"

const exercises = await getExercisesForFocusArea("chest", "low")
console.log(exercises) // Workout[] from API (or local fallback if empty)
```

---

## Support & Resources

- **ExerciseDB API Docs**: https://rapidapi.com/justin-WFnsXH_haHLw/api/exercisedb
- **RapidAPI Support**: support@rapidapi.com
- **NeuroFit+ Issues**: GitHub issues in repo
- **Debugging**: See "Monitoring & Debugging" section above

---

## Next Steps

1. [Set up API key](#quick-start)
2. [Start dev server](#3-start-dev-server-1-minute)
3. [Test in chatbot](#4-test-in-chatbot)
4. [Review error handling](#error-handling) if needed
5. [Deploy to production](EXERCISEDB_SETUP.md#deployment)
