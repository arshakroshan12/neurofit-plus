# NeuroFit+ Quick Commands

## Essential Commands

### Start Development Server
```bash
cd /Users/arshakroshan/neurofit-plus/frontend-next
npm run dev
```
**Output:** 
```
▲ Next.js 16.0.10 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://172.20.10.3:3000
✓ Ready in 933ms
```

**Access:** http://localhost:3000

---

### Stop Development Server
```bash
# In the terminal running npm run dev:
Ctrl+C
```

Or kill the process:
```bash
pkill -f "next dev"
```

---

### Build for Production
```bash
cd /Users/arshakroshan/neurofit-plus/frontend-next
npm run build
```

**Output:** 
```
   ▲ Next.js 16.0.10

 ✓ Compiled successfully
 ✓ Ready in 12.2s
```

---

### Run Production Build
```bash
npm run start
```

**Output:**
```
▲ Next.js 16.0.10

 ✓ Started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

### Check for Linting Errors
```bash
npm run lint
```

---

### Check for TypeScript Errors
```bash
cd /Users/arshakroshan/neurofit-plus/frontend-next
npx tsc --noEmit
```

---

## Testing Commands

### View Specific Page (Desktop)
```bash
# Already running dev server on http://localhost:3000
# Open these URLs in browser:

Dashboard:
http://localhost:3000/

Analysis:
http://localhost:3000/analysis

Chatbot:
http://localhost:3000/chatbot

Login:
http://localhost:3000/login

Profile:
http://localhost:3000/profile
```

### View on Mobile Simulator (macOS)
```bash
# In Safari, use Network address:
http://172.20.10.3:3000
```

### View localStorage
```javascript
// In browser DevTools Console:
console.log(JSON.parse(localStorage.getItem("neurofit_last_result")))

// Expected output:
{
  fatigue_score: 65,
  risk_level: "medium",
  timestamp: "2025-12-18T10:30:00.000Z"
}
```

### Clear localStorage
```javascript
// In browser DevTools Console:
localStorage.clear()

// Or clear specific key:
localStorage.removeItem("neurofit_last_result")
```

---

## Debugging Commands

### View Turbopack Logs
```bash
# Turbopack shows compilation info automatically
# Look for messages like:
GET /analysis 200 in 379ms (compile: 362ms, render: 16ms)
```

### Clean Build Cache
```bash
cd /Users/arshakroshan/neurofit-plus/frontend-next

# Remove Next.js build directory
rm -rf .next

# Remove node_modules (if needed)
rm -rf node_modules

# Reinstall dependencies
npm install

# Start dev server
npm run dev
```

### Check Node Version
```bash
node --version
# Expected: v18+ or v20+
```

### Check npm Version
```bash
npm --version
# Expected: 9+
```

---

## Database Inspection

### View All localStorage Keys
```javascript
// In browser DevTools Console:
Object.keys(localStorage)

// Expected output:
["neurofit_last_result"]
```

### View Specific Key
```javascript
localStorage.getItem("neurofit_last_result")
```

### Update localStorage Manually
```javascript
localStorage.setItem("neurofit_last_result", JSON.stringify({
  fatigue_score: 45,
  risk_level: "low",
  timestamp: new Date().toISOString()
}))

// Then refresh page (Cmd+R) to see changes
```

---

## Docker Commands (Optional)

### Build Docker Image
```bash
cd /Users/arshakroshan/neurofit-plus
docker build -f Dockerfile.frontend -t neurofit-frontend:latest .
```

### Run Docker Container
```bash
docker run -p 3000:3000 neurofit-frontend:latest
```

### Stop Docker Container
```bash
docker ps
docker stop <container-id>
```

---

## Deployment Commands

### Deploy to Vercel
```bash
# Install Vercel CLI globally
npm install -g vercel

# In the project directory
cd /Users/arshakroshan/neurofit-plus/frontend-next

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Deploy to Netlify
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# In the project directory
cd /Users/arshakroshan/neurofit-plus/frontend-next

# Deploy
netlify deploy --prod --dir=.next/standalone
```

---

## Useful Aliases (Optional)

Add to your `~/.zshrc` file:
```bash
alias nfd='cd /Users/arshakroshan/neurofit-plus/frontend-next && npm run dev'
alias nfbuild='cd /Users/arshakroshan/neurofit-plus/frontend-next && npm run build'
alias nfstart='cd /Users/arshakroshan/neurofit-plus/frontend-next && npm run start'
alias nflint='cd /Users/arshakroshan/neurofit-plus/frontend-next && npm run lint'
```

Then reload shell:
```bash
source ~/.zshrc
```

Now you can use:
```bash
nfd          # Start dev server
nfbuild      # Build for production
nfstart      # Start production server
nflint       # Check for lint errors
```

---

## API Testing

### Test Backend Endpoint
```bash
# From terminal
curl -X POST https://neurofit-plus.onrender.com/predict_fatigue \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-12-18T10:30:00.000Z",
    "answers": {
      "sleep_hours": 7,
      "energy_level": 5,
      "stress_level": 5
    },
    "task_performance": {
      "reaction_time_ms": 425,
      "reaction_attempted": 1
    },
    "typing_features": {
      "average_latency_ms": 185,
      "backspace_rate": 0.05,
      "total_duration_ms": 9000
    }
  }'

# Expected response:
{
  "fatigue_score": 65,
  "risk_level": "medium"
}
```

### Test Backend with Different Values
```bash
# Try low fatigue
curl -X POST https://neurofit-plus.onrender.com/predict_fatigue \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-12-18T10:30:00.000Z",
    "answers": {
      "sleep_hours": 9,
      "energy_level": 9,
      "stress_level": 1
    },
    "task_performance": {
      "reaction_time_ms": 250,
      "reaction_attempted": 1
    },
    "typing_features": {
      "average_latency_ms": 100,
      "backspace_rate": 0.02,
      "total_duration_ms": 9000
    }
  }'

# Expected response (low fatigue):
{
  "fatigue_score": 20,
  "risk_level": "low"
}
```

---

## Git Commands

### View Changes
```bash
git status
git diff
```

### Stage and Commit
```bash
git add .
git commit -m "Refactor: Separate dashboard from analysis page"
```

### View Commit History
```bash
git log --oneline -n 10
```

### Push to Remote
```bash
git push origin main
```

---

## Performance Testing

### Lighthouse Audit (Chrome DevTools)
1. Open DevTools (F12)
2. Click "Lighthouse" tab
3. Select "Mobile" or "Desktop"
4. Click "Analyze page load"
5. View performance metrics

### Network Tab Analysis
1. Open DevTools (F12)
2. Click "Network" tab
3. Reload page (Cmd+R)
4. View:
   - Request timing
   - Bundle size
   - Waterfall chart
   - Slow resources

### Performance API (Console)
```javascript
// Measure page load time
performance.getEntriesByType('navigation')[0]

// Measure specific operation
performance.mark('analysis-start')
// ... do something ...
performance.mark('analysis-end')
performance.measure('analysis', 'analysis-start', 'analysis-end')
console.log(performance.getEntriesByName('analysis')[0])
```

---

## Environment Variables

### Current Setup (No ENV vars needed for dev)
```bash
# Backend URL is hardcoded:
https://neurofit-plus.onrender.com/predict_fatigue

# To change, edit: /lib/api.tsx
```

### Add .env.local (Optional)
Create `/frontend-next/.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://neurofit-plus.onrender.com/predict_fatigue
```

Update `/lib/api.tsx`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
                'https://neurofit-plus.onrender.com/predict_fatigue'
```

---

## Troubleshooting Commands

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use simpler method:
pkill -f "next dev"
```

### Clear npm Cache
```bash
npm cache clean --force
```

### Reinstall Dependencies
```bash
cd /Users/arshakroshan/neurofit-plus/frontend-next
rm package-lock.json
rm -rf node_modules
npm install
```

### Check Disk Space
```bash
df -h

# If low on space:
npm cache clean --force
rm -rf .next
rm -rf node_modules
```

---

## Documentation Navigation

| Document | Purpose | For Whom |
|----------|---------|----------|
| QUICK_START.md | User-friendly testing guide | Testers |
| ARCHITECTURE_REFACTOR.md | Technical architecture | Developers |
| CODE_REFERENCE.md | Code structure reference | Code reviewers |
| TESTING_CHECKLIST.md | Complete test plan | QA team |
| REFACTOR_SUMMARY.md | Executive summary | Managers/Viva |
| This file (Quick Commands) | Common operations | Everyone |

---

**Last Updated:** December 18, 2025  
**Shell:** zsh (macOS)  
**Node:** 18+  
**npm:** 9+  
**Status:** Ready for Use
