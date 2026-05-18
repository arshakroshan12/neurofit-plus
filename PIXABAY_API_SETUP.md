# Pixabay API Integration for Workout Media

## Setup Instructions

### 1. Get Pixabay API Key

1. Go to https://pixabay.com/api/
2. Sign up for a free account
3. Copy your API key
4. Create `.env.local` in `frontend-next/`:

```bash
NEXT_PUBLIC_PIXABAY_KEY=your_pixabay_api_key_here
```

**Important**: The `NEXT_PUBLIC_` prefix makes it available to the browser. This is safe since Pixabay's free API doesn't require authentication secrets in requests.

### 2. How It Works

#### Media Fetching Flow
```
User requests workout
    ↓
WorkoutCard renders instantly (text only)
    ↓
WorkoutMedia component mounts
    ↓
useEffect checks localStorage cache
    ↓
If not cached: generate search query → fetch from Pixabay
    ↓
Cache result in localStorage (24 hour TTL)
    ↓
Image displays below workout text (non-blocking)
    ↓
If fetch fails: graceful fallback (no error shown)
```

#### Search Query Generation
The `getWorkoutMediaQuery()` function generates deterministic search queries:

```typescript
High fatigue → "breathing meditation"
Steps include "push-up" → "push up exercise workout"
Steps include "squat" → "squat exercise fitness"
Steps include "plank" → "plank core exercise"
Focus area "arms" → "arm exercise strength training"
Fallback → "fitness workout exercise"
```

All rules are deterministic (no randomness) — same workout always gets same search query.

### 3. Files Created/Modified

**New Files**:
- `lib/workoutMediaUtils.ts` — Search query generation, Pixabay API fetching, localStorage caching
- `components/workout-media.tsx` — React component that fetches and displays media

**Modified Files**:
- `app/chatbot/page.tsx` — Updated to use WorkoutMedia, pass fatigueLevel to WorkoutCard
- `lib/workoutData.ts` — Removed hardcoded mediaUrl entries and type annotation

**Removed Files**:
- `components/video-demo.tsx` — No longer needed

### 4. API Details

**Pixabay Endpoint**: `https://pixabay.com/api/`

**Parameters Used**:
- `key`: Your API key
- `q`: Search query (e.g., "push up exercise")
- `image_type`: "photo" (always images)
- `orientation`: "horizontal" (best for UI)
- `per_page`: 1 (fetch only one result)
- `safesearch`: true (filter adult content)

**Response**: Returns JSON with array of images. We use `webformatURL` (optimized 640px version).

### 5. Caching Strategy

**localStorage Key Format**: `workout-media-{workout.id}`

**Example**:
```javascript
{
  "workout-media-arms_low_1": {
    "url": "https://cdn.pixabay.com/...",
    "timestamp": 1706380000000
  }
}
```

**Cache Duration**: 24 hours
- Reduces API calls
- Improves load time on repeat visits
- Gracefully expires old entries

### 6. Graceful Degradation

The system is resilient to failures:

| Scenario | Behavior |
|----------|----------|
| No API key set | Console warning, no media fetched |
| API rate limit hit | No error shown, text-only fallback |
| Invalid search query | No results, text-only fallback |
| Image fails to load | Error handler removes broken image |
| localStorage unavailable | API fetching continues normally |
| Network offline | Cache still works, API calls fail silently |

### 7. Testing

1. Set `NEXT_PUBLIC_PIXABAY_KEY` in `.env.local`
2. Navigate to http://localhost:3001/chatbot
3. Complete fatigue analysis on /analysis page
4. Request a workout recommendation
5. Watch for images loading below workout cards (may take 1-2 seconds)

**Expected behavior**:
- ✅ Chatbot renders instantly (text visible immediately)
- ✅ Images load asynchronously after ~1 second
- ✅ Same workout shows same image on repeat visits (cached)
- ✅ No errors in console if API key missing
- ✅ No blocking of chatbot flow while media loads

### 8. Query Examples

Here are some example queries generated for workouts:

| Workout | Query |
|---------|-------|
| Upper-Body Sculpt (push-ups) | "push up exercise workout" |
| Squat workouts | "squat exercise fitness" |
| Plank core | "plank core exercise" |
| High fatigue yoga | "breathing meditation" |
| Arms focus | "arm exercise strength training" |
| Chest focus | "chest press workout" |

### 9. Rate Limits

Pixabay Free Plan:
- **Rate Limit**: 50 requests per hour per IP
- **Daily Limit**: Unlimited images (rate-limited hourly)

With 30 workouts × 1 request per workout = 30 requests:
- Fits within hourly limit
- Caching prevents repeated requests
- ~1 request per unique visitor per 24 hours (after cache hits)

### 10. Customization

To change search queries, edit `getWorkoutMediaQuery()` in `lib/workoutMediaUtils.ts`:

```typescript
// Example: Add rule for "yoga" workouts
if (stepsText.includes("yoga")) return "yoga exercise flexibility"

// Example: Priority fallback for specific focus area
if (focusArea === "arms") return "dumbbell workout training"
```

All changes are local — no API changes needed.

### 11. Troubleshooting

**Images not loading?**
1. Check `NEXT_PUBLIC_PIXABAY_KEY` is set in `.env.local`
2. Check browser console for error messages
3. Verify API key is valid (test at pixabay.com/api/)
4. Check rate limits haven't been exceeded
5. Clear localStorage and reload: `localStorage.clear()`

**Getting API key issues?**
1. Sign up for free account at pixabay.com
2. API key is on account page, not in email
3. Free plan has no credit card required
4. Free tier allows 50 requests/hour

**Performance slow?**
1. Pixabay can be slow (1-3 second response time)
2. Browser caches images (reload uses cache)
3. Images are optimized to 640px (small file size)
4. Caching prevents repeated fetches

---

## Summary

- ✅ Hardcoded videos removed
- ✅ Dynamic Pixabay API integration added
- ✅ Non-blocking async image fetching
- ✅ localStorage caching (24 hour TTL)
- ✅ Graceful fallback if API fails
- ✅ Deterministic query generation
- ✅ No chatbot logic changes
- ✅ No authentication complexity

All workouts now show visually unique demo images fetched intelligently from Pixabay based on workout content.
