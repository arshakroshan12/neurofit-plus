# Quick Fix Reference: Chatbot Fatigue Level Null Issue

## What Was Changed
Added extensive console logging and verified data format consistency to diagnose why chatbot wasn't showing fatigue level.

## Files Modified (4 files)
1. `frontend-next/lib/api.tsx` - API logging
2. `frontend-next/app/analysis/page.tsx` - Analysis result logging
3. `frontend-next/lib/chatbotEngine.ts` - Debug logging in getRiskLevelLabel
4. `frontend-next/app/chatbot/page.tsx` - Context loading logging

## Test The Fix

### Quick Test (2 minutes)
1. Open http://localhost:3000/analysis
2. Open DevTools Console (F12)
3. Complete all analysis steps
4. Watch for console logs with emojis (🔗 📦 ✅ 💾 🎯)
5. Go to /chatbot
6. Check if greeting shows fatigue level

### Full Diagnostic (5 minutes)
```bash
# In browser console on Analysis page:
localStorage.getItem("neurofit_last_result")  # Should show data

# After running analysis and navigating to chatbot:
localStorage.getItem("neurofit_last_result")  # Should still show data
```

## If Still Showing Null

Check these in order:

1. **Backend running?**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"ok","model_loaded":true}`

2. **Data in localStorage?**
   ```javascript
   JSON.parse(localStorage.getItem("neurofit_last_result"))
   ```
   Should have `fatigue_score` and `risk_level`

3. **Check console logs**
   - Look for 🔗 (API call)
   - Look for ✅ (response received)
   - Look for 💾 (storage saved)
   - Look for 🎯 (mapping applied)

4. **Test data format**
   ```javascript
   const data = JSON.parse(localStorage.getItem("neurofit_last_result"))
   console.log(typeof data.risk_level, data.risk_level)  // Should be string: "moderate", "low", or "high"
   ```

## Key Insight
Backend returns `"moderate"` (not `"medium"`). The FatigueLevel type matches exactly:
- Backend: "low" → Frontend: "low" ✓
- Backend: "moderate" → Frontend: "moderate" ✓
- Backend: "high" → Frontend: "high" ✓

## Documentation
- Full guide: `CHATBOT_FATIGUE_FIX_SUMMARY.md`
- Testing steps: `CHATBOT_FATIGUE_DEBUGGING.md`
