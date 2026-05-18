# Pixabay Images Not Loading — Troubleshooting Guide

## Quick Checklist

- [ ] Dev server is running (`http://localhost:3000`)
- [ ] `.env.local` has `NEXT_PUBLIC_PIXABAY_KEY` set
- [ ] API key is valid (created at https://pixabay.com/api/)
- [ ] Browser cache cleared (`localStorage.clear()`)
- [ ] Page refreshed after clearing cache
- [ ] Dev server restarted (press Ctrl+C, then `npm run dev`)

---

## Step-by-Step Troubleshooting

### 1. Check if Dev Server is Running
```bash
curl http://localhost:3000/chatbot
# Should return HTML, not a connection error
```

### 2. Check Environment Variable
```bash
cat frontend-next/.env.local
# Should show: NEXT_PUBLIC_PIXABAY_KEY=54386302-...
```

### 3. Check Browser Console
- Open DevTools: `F12` or `Cmd+Option+I` (Mac)
- Go to **Console** tab
- Look for messages starting with `[Pixabay]`
- You should see:
  ```
  [Pixabay] Cache miss for arms_low_1, fetching...
  [Pixabay] Generated query: "arm exercise strength training"
  [Pixabay] Fetching: "arm exercise strength training"
  [Pixabay] Response: { total: 12345, hits: [...] }
  [Pixabay] Got image: https://cdn.pixabay.com/...
  ```

### 4. Check API Directly
Test if Pixabay API works:
```bash
curl "https://pixabay.com/api/?key=YOUR_KEY&q=push+up+exercise&image_type=photo&orientation=horizontal&per_page=3&safesearch=true" | head -c 500
```

You should see JSON starting with `{"total"...` (not an error message).

### 5. Check Cache
```javascript
// In browser console:
Object.keys(localStorage).filter(k => k.startsWith('workout-media-'))
// Should show an empty array initially, then grow as you request workouts
```

### 6. Clear Cache and Retry
```javascript
// In browser console:
localStorage.clear()
// Then refresh the page
location.reload()
```

---

## Common Issues & Solutions

### Issue: "NEXT_PUBLIC_PIXABAY_KEY not set"
**Problem**: `.env.local` file doesn't exist or is empty

**Solution**:
```bash
cd frontend-next
echo 'NEXT_PUBLIC_PIXABAY_KEY=your_key_here' > .env.local
# Then restart dev server: Ctrl+C, npm run dev
```

### Issue: "[ERROR 400] per_page is out of valid range"
**Problem**: Using invalid `per_page` parameter value

**Solution**: Already fixed in latest version. Just make sure you have the latest code.

**Check if fixed**:
- Open `frontend-next/lib/workoutMediaUtils.ts`
- Search for `per_page:`
- Should say `per_page: "3"` (not `"1"`)

### Issue: "Pixabay API error: 401"
**Problem**: API key is invalid or unauthorized

**Solution**:
1. Go to https://pixabay.com/api/
2. Log in to your account
3. Copy the API key (not the public key)
4. Update `.env.local`
5. Restart dev server

### Issue: "Pixabay API error: 429"
**Problem**: Rate limit exceeded (50 requests/hour on free plan)

**Solution**:
- Wait an hour and try again, or
- Upgrade Pixabay plan, or
- Increase cache TTL from 24h to 7 days in code

### Issue: "No images found for query"
**Problem**: Search query is too specific and returns no results

**Solution**: 
- This is normal. Try requesting a different workout.
- The system will try the next search query on the next request.

### Issue: Images load but then disappear
**Problem**: Image URL is broken or has been deleted

**Solution**:
- Clear cache: `localStorage.clear()`
- Try requesting a different workout
- Images from Pixabay may occasionally be deleted

### Issue: Dev server won't start
**Problem**: Port 3000 is already in use

**Solution**:
```bash
# Kill the process using port 3000
lsof -i :3000
# Shows the PID, then:
kill -9 <PID>
# Or just:
pkill -f "next dev"
# Then restart:
npm run dev
```

---

## Debugging with Full Logging

To see even more details, temporarily add logging to `workout-media.tsx`:

```typescript
useEffect(() => {
  let isMounted = true

  const fetchMedia = async () => {
    console.log(`[DEBUG] Fetching for ${workout.id}`)
    setIsLoading(true)
    const url = await getWorkoutMedia(workout, fatigueLevel)
    console.log(`[DEBUG] Got URL: ${url}`)
    
    if (isMounted) {
      setMediaUrl(url)
      setIsLoading(false)
    }
  }

  fetchMedia()

  return () => {
    isMounted = false
  }
}, [workout.id, fatigueLevel])
```

---

## Testing the Complete Flow

1. **Start fresh**:
   ```bash
   # Terminal 1
   cd frontend-next
   npm run dev
   ```

2. **In browser**:
   - Go to http://localhost:3000/chatbot
   - Open DevTools (F12 → Console)
   - Clear cache: `localStorage.clear()`
   - Refresh page: `F5`

3. **Run analysis**:
   - Go to http://localhost:3000/analysis
   - Complete the 4 steps
   - Click "Analyze Results"
   - Back to chatbot

4. **Request workout**:
   - Say: "I want to do arms training"
   - Watch console for `[Pixabay]` messages
   - Image should load in 1-2 seconds
   - Check Network tab to see Pixabay API call

5. **Verify cache**:
   - Look at localStorage: `Object.keys(localStorage)`
   - Should see `workout-media-*` entries
   - Request same workout again
   - Image loads instantly (cache hit)

---

## Still Not Working?

1. **Check the logs**:
   - Browser Console (F12)
   - Terminal running `npm run dev`
   - File: `/tmp/next.log` if running in background

2. **Verify the fix is applied**:
   ```bash
   grep "per_page:" frontend-next/lib/workoutMediaUtils.ts
   # Should show: per_page: "3"
   ```

3. **Test API directly**:
   ```bash
   curl "https://pixabay.com/api/?key=YOUR_KEY&q=test&image_type=photo&orientation=horizontal&per_page=3&safesearch=true"
   # Should return JSON, not an error
   ```

4. **Last resort - clear everything**:
   ```bash
   # Kill dev server
   pkill -f "next dev"
   
   # Clear build cache
   rm -rf .next
   
   # Clear modules (optional, slow)
   # rm -rf node_modules && npm install
   
   # Clear browser cache
   # DevTools → Application → Clear storage
   
   # Restart
   npm run dev
   ```

---

## Getting Help

If you still can't get it working:

1. Check the documentation:
   - [PIXABAY_API_SETUP.md](./PIXABAY_API_SETUP.md)
   - [PIXABAY_QUICK_REF.md](./PIXABAY_QUICK_REF.md)
   - [PIXABAY_FIX_PER_PAGE.md](./PIXABAY_FIX_PER_PAGE.md) (the issue that was just fixed)

2. Verify API key is valid at https://pixabay.com/api/

3. Check Network tab in DevTools to see actual API responses

4. Look for error messages in browser console (`[Pixabay]` or red text)

---

## Quick Reference

| Component | File | Purpose |
|-----------|------|---------|
| Logic | `frontend-next/lib/workoutMediaUtils.ts` | Query generation, API calls, caching |
| Display | `frontend-next/components/workout-media.tsx` | Renders images with async loading |
| Integration | `frontend-next/app/chatbot/page.tsx` | Passes data to component |
| Config | `frontend-next/.env.local` | API key (keep secret!) |

---

**Last Updated**: January 27, 2026  
**Latest Fix**: Changed `per_page: "1"` to `per_page: "3"` ✅

Images should now load properly! 🎉
