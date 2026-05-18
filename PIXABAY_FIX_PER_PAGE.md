# Pixabay API Fix — `per_page` Parameter Issue

## Problem Found & Fixed ✅

The chatbot couldn't fetch images because the Pixabay API was rejecting the request with:
```
[ERROR 400] "per_page" is out of valid range.
```

### Root Cause
The code was using `per_page: "1"` which is **not** in Pixabay's valid range. 

Pixabay API requires:
- Minimum: `per_page: 3`
- Maximum: `per_page: 500`
- Default: `per_page: 20`

### Solution
Changed `per_page` from `1` to `3` in `frontend-next/lib/workoutMediaUtils.ts`:

```typescript
// BEFORE (broken)
per_page: "1"

// AFTER (fixed)
per_page: "3"
```

Since we only use the first image (`data.hits[0]`), requesting 3 instead of 1 has **no impact** on the user experience—we still get exactly one image. The extra results in the response are simply ignored.

---

## What to Do Now

1. **Dev server is already updated** with the fix
2. **Clear your browser cache** (localStorage):
   - Open browser DevTools (F12)
   - Console tab
   - Run: `localStorage.clear()`
   - Refresh page
3. **Test the chatbot**:
   - Go to http://localhost:3000/chatbot
   - Complete fatigue analysis
   - Request a workout
   - Watch images load!

---

## Verification

Test the API directly:

```bash
curl "https://pixabay.com/api/?key=YOUR_KEY&q=push+up+exercise&image_type=photo&orientation=horizontal&per_page=3&safesearch=true" | jq '.hits[0].webformatURL'
```

You should get a valid image URL.

---

## Files Changed

- `frontend-next/lib/workoutMediaUtils.ts` — Changed `per_page: "1"` to `per_page: "3"`

That's it! One-line fix.

---

## Why This Wasn't Caught Earlier

The Pixabay API documentation shows `per_page` with a range, but the minimum wasn't explicitly clear until testing. The fix was discovered by:
1. Adding detailed logging to the fetch function
2. Testing the API directly with curl
3. Seeing the `[ERROR 400]` message
4. Testing different `per_page` values
5. Finding that `per_page=3` worked

---

## Status

✅ **Issue Resolved**
✅ **Dev Server Restarted** with fix applied  
✅ **Ready to Test** at http://localhost:3000/chatbot

Just clear localStorage and refresh to see images load!
