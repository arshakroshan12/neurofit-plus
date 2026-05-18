# NeuroFit+ Pixabay Integration — Deployment Checklist

## Pre-Deployment

### Local Testing
- [ ] `npm install` (if fresh checkout)
- [ ] `npm run build` (verify no TypeScript errors)
- [ ] Set `NEXT_PUBLIC_PIXABAY_KEY` in `.env.local`
- [ ] `npm run dev` (start dev server)
- [ ] Navigate to http://localhost:3001/chatbot
- [ ] Run fatigue analysis → request workout
- [ ] Verify image loads within 2 seconds
- [ ] Check browser console for errors (should be none)
- [ ] Inspect DevTools → Application → localStorage → see `workout-media-*` keys
- [ ] Repeat test with different focus areas (arms, chest, legs, core, full body)
- [ ] Test with different fatigue levels (low, moderate, high)
- [ ] Test on repeat visit (image loads instantly from cache)

### Code Review
- [ ] `lib/workoutMediaUtils.ts` reviewed
  - [ ] Query generation rules are deterministic
  - [ ] Error handling is graceful
  - [ ] Cache TTL is reasonable (24 hours)
  - [ ] No console.logs left in production code
  
- [ ] `components/workout-media.tsx` reviewed
  - [ ] useEffect properly handles cleanup
  - [ ] isMounted flag prevents memory leaks
  - [ ] onError handler for broken images
  - [ ] No render blocks (async fetch is non-blocking)

- [ ] `app/chatbot/page.tsx` reviewed
  - [ ] fatigueLevel properly passed to WorkoutCard
  - [ ] WorkoutMedia component imported correctly
  - [ ] No breaking changes to chatbot logic

- [ ] `lib/workoutData.ts` reviewed
  - [ ] mediaUrl removed from interface
  - [ ] All hardcoded URLs removed
  - [ ] Workout definitions unchanged

- [ ] Deleted files confirmed
  - [ ] `components/video-demo.tsx` removed
  - [ ] No imports of video-demo remain

### Environment Setup

#### Local (.env.local)
```bash
NEXT_PUBLIC_PIXABAY_KEY=your_free_pixabay_api_key
```
- [ ] Create `.env.local` in `frontend-next/` directory
- [ ] Get key from https://pixabay.com/api/ (free account)
- [ ] Key does NOT include quotes or extra whitespace
- [ ] Key is NOT in version control (.gitignore protects it)

#### Staging / Production
- [ ] Set `NEXT_PUBLIC_PIXABAY_KEY` via platform environment variables (Vercel, Render, etc.)
- [ ] For Vercel: Project Settings → Environment Variables → Add `NEXT_PUBLIC_PIXABAY_KEY`
- [ ] For Render: Service → Environment → Add `NEXT_PUBLIC_PIXABAY_KEY`
- [ ] Test key is valid before deploying

### Build Verification
- [ ] `npm run build` completes without errors
- [ ] No TypeScript warnings for media components
- [ ] Bundle size unchanged (media utils are small, ~3KB)
- [ ] `npm run lint` passes (ESLint)

### Performance Baseline
- [ ] Measure chatbot page load time before deploying
- [ ] Expect media fetch to add ~1-2 seconds (after initial render)
- [ ] First visit slower than repeat visits (due to Pixabay API)
- [ ] Cache prevents repeated API calls

---

## Deployment

### Option 1: Vercel (Recommended for Next.js)

1. **Set Environment Variable**:
   - Log into Vercel dashboard
   - Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_PIXABAY_KEY` = `your_api_key`
   - Apply to "Production" environment

2. **Deploy**:
   ```bash
   git push origin main  # Or merge PR
   ```
   - Vercel auto-deploys on push
   - Wait for build to complete
   - Visit production URL

3. **Test Production**:
   - [ ] Navigate to chatbot page
   - [ ] Run fatigue analysis
   - [ ] Verify images load with no console errors
   - [ ] Check DevTools → Network for Pixabay API calls

### Option 2: Render (Full-Stack)

1. **Set Environment Variable**:
   - Render dashboard → Service → Environment
   - Add: `NEXT_PUBLIC_PIXABAY_KEY` = `your_api_key`
   - Redeploy service

2. **Deploy**:
   ```bash
   git push origin main
   ```
   - Render auto-deploys on push (if configured)
   - Or manually: Render dashboard → Service → Redeploy

3. **Test Production**:
   - [ ] Navigate to chatbot page on Render URL
   - [ ] Run fatigue analysis
   - [ ] Verify images load

### Option 3: Docker/Local Production

1. **Build Docker Image**:
   ```bash
   docker build -t neurofit-plus .
   ```

2. **Set Environment**:
   ```bash
   export NEXT_PUBLIC_PIXABAY_KEY=your_api_key
   docker run -e NEXT_PUBLIC_PIXABAY_KEY=$NEXT_PUBLIC_PIXABAY_KEY -p 3000:3000 neurofit-plus
   ```

3. **Test**:
   - [ ] Navigate to http://localhost:3000/chatbot
   - [ ] Verify images load

---

## Post-Deployment

### Smoke Tests
- [ ] Chatbot page loads (no 404 or 500 errors)
- [ ] Fatigue analysis page works
- [ ] Can complete analysis and get results
- [ ] Chatbot responds to workout requests
- [ ] Images load below workouts (may take 1-2 seconds)
- [ ] Repeat visit shows images instantly (cached)
- [ ] No console JavaScript errors

### Monitoring

#### Error Tracking
- [ ] Set up Sentry/Rollbar to catch runtime errors
- [ ] Monitor for:
  - Failed Pixabay API requests (network errors)
  - localStorage quota exceeded (rare, graceful)
  - Image loading timeouts (should be handled)

#### Logging
- [ ] Set up server logs to monitor:
  - API requests to backend
  - Chatbot user sessions
  - Average response times

#### Performance Metrics
- [ ] Monitor page load time (should not increase >200ms)
- [ ] Monitor Pixabay API response times (expect 500-2000ms)
- [ ] Track cache hit rate (should be >90% after warm-up)

### Rollback Plan
If deployment has issues:

1. **Revert Git**:
   ```bash
   git revert HEAD
   git push origin main
   ```
   - Vercel/Render auto-redeploy with previous version

2. **Verify Rollback**:
   - [ ] Production page loads
   - [ ] Chatbot works (may show text-only workouts, no images)
   - [ ] No errors in console

3. **Investigate**:
   - Check logs for errors
   - Verify API key is set correctly
   - Check Pixabay API status

---

## API Key Management

### Pixabay API Key Rotation

If key is compromised:

1. **Revoke**:
   - Log into pixabay.com account
   - API section → Revoke key
   - Old key stops working immediately

2. **Generate New**:
   - pixabay.com API → Generate new key
   - Copy new key

3. **Update Deployment**:
   - Vercel: Project Settings → Environment Variables → Update value
   - Render: Service → Environment → Update value
   - Docker: Redeploy with new key

4. **Verify**:
   - [ ] New key works in production
   - [ ] No errors in logs

### Monitoring API Usage

Check Pixabay quota:
- [ ] Log into pixabay.com account
- [ ] API dashboard shows requests used today
- [ ] Free plan: 50 requests/hour
- [ ] If approaching limit: enable longer cache TTL (7 days instead of 24 hours)

---

## Troubleshooting Deployment

| Issue | Symptom | Fix |
|-------|---------|-----|
| API key not set | Console warning "NEXT_PUBLIC_PIXABAY_KEY not set" | Add key to environment variables |
| API key wrong | Console error "Pixabay API error: 400" | Verify key is correct at pixabay.com |
| Rate limit | Console warning "429 Too Many Requests" | Increase cache TTL (7 days), or upgrade Pixabay plan |
| Network timeout | No images load after 3 seconds | Check internet connectivity, Pixabay API status |
| localStorage full | Cache not stored | Clear old cache data, reduce TTL |
| Images broken | onError logs seen in console | Pixabay image may have been deleted, retry will fetch new one |

---

## Success Criteria

✅ **Deployment successful if**:
1. Chatbot page loads in <2 seconds
2. Images load within 2-3 seconds of requesting workout
3. No JavaScript errors in browser console
4. Repeat requests show cached images instantly (<50ms)
5. localStorage contains `workout-media-*` keys
6. Pixabay API calls visible in Network tab
7. All 30 workouts can request and show media
8. High-fatigue workouts show recovery media (yoga, breathing)
9. Different workouts show different images
10. No errors reported in server logs

---

## Maintenance

### Weekly
- [ ] Check Pixabay API quota (should be <10 requests/hour average)
- [ ] Monitor console errors in production logs
- [ ] Verify images are loading for popular workouts

### Monthly
- [ ] Review cache hit rate (should be >90%)
- [ ] Check localStorage size per user (~30KB typical)
- [ ] Analyze query patterns (which workouts are requested most)

### Quarterly
- [ ] Refresh search query rules if needed (exercise types change)
- [ ] Consider upgrading Pixabay plan if approaching rate limits
- [ ] Review cache TTL (current: 24 hours)

### Annually
- [ ] Audit API key security (rotation if needed)
- [ ] Review Pixabay contract/pricing
- [ ] Consider alternative image sources if needs change

---

## Rollback Scenarios

### Scenario 1: Images not loading on production
**Cause**: API key not set, Pixabay down, or rate limit hit
**Fix**: 
- Verify API key is set in environment
- Check Pixabay API status
- Increase cache TTL to reduce API calls
- Fallback to text-only workouts (system works fine without images)

### Scenario 2: Cache growing unbounded
**Cause**: localStorage not cleaning up old entries
**Fix**:
- Cache automatically expires after 24 hours (check timestamps)
- User can clear manually: `localStorage.clear()`
- Reduce TTL if localStorage quota exceeded

### Scenario 3: API calls exceeding rate limit
**Cause**: Too many unique users or short cache TTL
**Fix**:
- Increase cache TTL from 24h to 7 days
- Upgrade Pixabay to paid plan (500 requests/hour)
- Or switch to image proxy service

---

See also:
- [PIXABAY_API_SETUP.md](PIXABAY_API_SETUP.md) — Setup guide
- [PIXABAY_QUICK_REF.md](PIXABAY_QUICK_REF.md) — Developer reference
