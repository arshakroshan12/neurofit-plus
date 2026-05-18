# Pixabay Media System — Quick Reference

## One-Minute Setup

```bash
# 1. Get free API key from https://pixabay.com/api/
# 2. Add to frontend-next/.env.local
NEXT_PUBLIC_PIXABAY_KEY=your_pixabay_api_key_here

# 3. Restart dev server
npm run dev
```

## Architecture at a Glance

```
Workout rendered
    ↓
<WorkoutMedia workout={w} fatigueLevel={f} />
    ↓
useEffect: fetch media asynchronously
    ↓
getWorkoutMedia()
  └─ Check cache (localStorage)
  └─ Generate query: "push up exercise"
  └─ Fetch from Pixabay
  └─ Cache result (24h TTL)
    ↓
Image displays (or fails silently)
```

## File Structure

```
frontend-next/
├── lib/
│   ├── workoutMediaUtils.ts ← Media fetching logic
│   └── workoutData.ts ← (mediaUrl removed)
├── components/
│   ├── workout-media.tsx ← Component that renders images
│   └── (video-demo.tsx deleted)
└── app/
    └── chatbot/page.tsx ← Updated to use WorkoutMedia
```

## Key Functions

### `getWorkoutMediaQuery(workout, fatigueLevel): string`
Returns deterministic search query.

```typescript
getWorkoutMediaQuery(pushupWorkout, "low") → "push up exercise workout"
getWorkoutMediaQuery(yogaWorkout, "high") → "breathing meditation"
```

### `fetchWorkoutMedia(query): Promise<string | null>`
Calls Pixabay API, returns image URL or null.

```typescript
const url = await fetchWorkoutMedia("push up exercise");
// Returns: "https://cdn.pixabay.com/..."
```

### `getWorkoutMedia(workout, fatigueLevel): Promise<string | null>`
Master function: cache-first, then API.

```typescript
// In component:
const imageUrl = await getWorkoutMedia(workout, fatigueLevel);
```

## Component Usage

```typescript
import WorkoutMedia from "@/components/workout-media"

<WorkoutMedia 
  workout={workout}
  fatigueLevel={fatigueLevel}
/>

// Renders: <img> with cached/fetched media, or nothing if unavailable
```

## Query Generation Rules

| Condition | Query |
|-----------|-------|
| "push-up" in steps | "push up exercise workout" |
| "squat" in steps | "squat exercise fitness" |
| "plank" in steps | "plank core exercise" |
| "burpee" in steps | "burpee workout cardio" |
| "stretch" in steps | "stretching workout recovery" |
| "yoga" in steps | "yoga exercise workout" |
| fatigue = "high" | "breathing meditation" |
| focus = "arms" | "arm exercise strength training" |
| focus = "chest" | "chest workout press" |
| focus = "legs" | "leg workout fitness" |
| focus = "core" | "core exercise abs" |
| Fallback | "fitness workout exercise" |

## Caching

**localStorage Key**: `workout-media-{workout.id}`

**TTL**: 24 hours

**Check cache**:
```javascript
// In browser DevTools console:
JSON.parse(localStorage.getItem('workout-media-arms_low_1'))
// Returns: { url: "...", timestamp: ... }
```

**Clear cache**:
```javascript
localStorage.removeItem('workout-media-arms_low_1')  // Single
localStorage.clear()  // All
```

## Environment Variables

**Required**:
```bash
NEXT_PUBLIC_PIXABAY_KEY=abc123xyz...
```

**Optional** (for future enhancement):
```bash
NEXT_PUBLIC_PIXABAY_MAX_RESULTS=5  # Currently hardcoded to 1
```

## Error Handling

| Error | Behavior |
|-------|----------|
| No API key | Warning in console, no images fetched |
| API timeout | Graceful fallback, text-only workout |
| Invalid query | No results, text-only display |
| Image 404 | onError handler hides broken image |
| localStorage full | API continues, caching skipped |

## Performance

**Typical Latency**:
- First visit: 1-2 seconds (API fetch)
- Repeat visits: <50ms (cache hit)
- UI: Renders instantly, media loads async

**Cache Hit Rate**: ~95% (same workouts shown repeatedly)

**API Calls per Hour**: ~1-5 per user (after cache warms)

## Testing Checklist

- [ ] `.env.local` has NEXT_PUBLIC_PIXABAY_KEY set
- [ ] Dev server running (`npm run dev`)
- [ ] Chatbot page loads at http://localhost:3001/chatbot
- [ ] Run fatigue analysis on /analysis
- [ ] Request a workout
- [ ] Image appears below workout text (1-2 second delay expected)
- [ ] Request same workout again → image loads instantly (cached)
- [ ] Open DevTools → Application → localStorage → see `workout-media-*` keys
- [ ] Clear cache → request workout → new image fetches
- [ ] No console errors

## Customization Examples

**Add new search rule**:
```typescript
// In getWorkoutMediaQuery()
if (stepsText.includes("deadlift")) return "deadlift weightlifting strength"
```

**Change cache duration**:
```typescript
// In getWorkoutMediaFromCache()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;  // 7 days instead of 24h
```

**Fetch multiple images**:
```typescript
// Change in fetchWorkoutMedia()
const url = `${baseUrl}?per_page=5`  // Get 5 results instead of 1
```

## Debugging

**Enable verbose logging**:
```typescript
// Add to workoutMediaUtils.ts
console.log(`[Media] Query: ${query}`)
console.log(`[Media] Fetching from Pixabay...`)
console.log(`[Media] Cached: ${cached ? 'yes' : 'no'}`)
console.log(`[Media] Result: ${url || 'not found'}`)
```

**Inspect API requests**:
```javascript
// In DevTools Network tab, filter by "pixabay"
// See actual requests and responses
```

**Verify cache**:
```javascript
// In DevTools Console:
Object.keys(localStorage)
  .filter(k => k.startsWith('workout-media-'))
  .map(k => [k, JSON.parse(localStorage[k])])
```

## FAQ

**Q: Is my API key safe exposed in frontend code?**
A: Yes. Pixabay's free API has no authentication; the key is just for rate limiting. It's public by design.

**Q: Can I use a different image service?**
A: Yes! Replace `fetchWorkoutMedia()` to use:
- Unsplash API (free, high quality)
- Pexels API (free, high quality)
- Google Custom Search (requires setup)

**Q: What if I exceed rate limits?**
A: Images stop loading, but chatbot continues. You'll see rate limit in browser console. Upgrade to Pixabay paid plan or cache results for 7 days.

**Q: Can I preload all images?**
A: Not recommended. Current async approach is best for performance. Preloading 30 images adds 30-60 seconds to page load.

**Q: How do I test without API key?**
A: System works fine! Images just don't load, text-only fallback. All chatbot logic unchanged.

---

**See also**: [PIXABAY_API_SETUP.md](PIXABAY_API_SETUP.md) for full setup guide
