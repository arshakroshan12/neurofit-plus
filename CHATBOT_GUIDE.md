# NeuroFit Coach - Quick Reference Guide

## What is NeuroFit Coach?

A professional, context-aware fitness advisor specialized in cognitive fatigue. The coach reads your latest fatigue analysis and provides personalized, evidence-based guidance.

**Location:** http://localhost:3000/chatbot

---

## How to Use

### Step 1: Run a Fatigue Analysis
- Go to Dashboard (/)
- Click "Run Fatigue Analysis"
- Complete all 4 steps
- Get your fatigue score

### Step 2: Go to Chatbot
- Click "Chatbot" in header
- Or navigate to http://localhost:3000/chatbot

### Step 3: See Your Status
- Current fatigue score displays at top
- Shows risk level (low/medium/high)

### Step 3: Ask Questions
- Type any question about fatigue or recovery
- Press Enter or click Send
- Coach responds with professional guidance

---

## Suggested Questions to Ask

### About Your Score
- "Why is my fatigue high?"
- "What does my score mean?"
- "Why is my fatigue low?"
- "Is this normal?"

### About Workouts
- "Should I skip the gym?"
- "What workout should I do?"
- "Should I rest?"
- "Is light exercise okay?"

### About Recovery
- "How can I improve my fatigue?"
- "What helps reduce fatigue?"
- "How does sleep affect fatigue?"
- "Does hydration matter?"

### About Metrics
- "What's reaction time?"
- "What's typing pattern measurement?"
- "How is fatigue calculated?"

### Safety
- "Is cognitive fatigue dangerous?"
- "Should I worry?"
- "Is this a health risk?"

---

## What the Coach Explains

### ✅ Coach CAN Explain
- Why your fatigue score is high or low
- What reaction time and typing patterns measure
- How sleep and hydration affect fatigue
- Why certain workouts are recommended
- Recovery strategies
- Normal fatigue fluctuations
- Trends over time

### ❌ Coach CANNOT Explain
- Medical or mental health diagnoses
- Medical conditions (depression, ADHD, anxiety, etc.)
- Medical treatments or prescriptions
- Therapy or counseling
- Personal medical advice

**If you ask about medical topics,** the coach will redirect:
> "I can explain how cognitive fatigue affects your performance, but I cannot diagnose medical or mental health conditions. For health concerns, please consult a healthcare professional."

---

## Example Conversations

### Conversation 1: High Fatigue
```
You: "Why is my fatigue high today?"

Coach: "Your fatigue score is 75%, which is elevated. This is mainly 
influenced by slower reaction time and increased typing errors—common signs 
of cognitive strain. Rest and recovery will help."
```

### Conversation 2: Workout Decision
```
You: "Should I skip my workout?"

Coach: "Your fatigue is elevated. I recommend lighter activity today—focus 
on recovery and pacing. This maintains consistency while letting your 
cognitive system recharge."
```

### Conversation 3: Safety Question
```
You: "Is cognitive fatigue dangerous?"

Coach: "No. Cognitive fatigue varies day to day and is normal. Your results 
show temporary mental strain, not a health risk. Rest and recovery will help 
you return to baseline."
```

### Conversation 4: Recovery Tips
```
You: "How can I reduce fatigue?"

Coach: "Focus on: adequate sleep (7-9 hours), consistent hydration, taking 
breaks during focused work, and recovery-focused exercise on high-fatigue 
days. Run regular analyses to track your progress."
```

### Conversation 5: Medical Redirect
```
You: "Do I have depression?"

Coach: "I can explain how cognitive fatigue affects your performance, but 
I cannot diagnose medical or mental health conditions. For health concerns, 
please consult a healthcare professional."
```

---

## Coach Tone

**Professional, Calm, Supportive**
- No hype or emojis
- Clear, simple language
- Evidence-based (references your actual metrics)
- Reassuring when appropriate
- Non-judgmental

---

## Coach Response Patterns (25+)

| Your Question | Coach Response Focus |
|---|---|
| "Why..." + fatigue | Explain your score with specific metrics |
| "Danger" or "Risk" | Reassure it's normal and recoverable |
| "Skip gym" | Recommend intensity for your fatigue level |
| "What does this mean?" | Explain what score represents |
| "How improve?" | Sleep, hydration, breaks, recovery |
| "What affects?" | Sleep, stress, effort, recovery |
| "Rest/Recovery" | Emphasize importance of sleep |
| "Reaction/Typing" | Explain as responsiveness measures |
| "Sleep/Water" | Direct link to cognitive performance |
| "Fatigue" (general) | Define and explain what it is |

---

## Data the Coach Uses

### From Your Analysis
- **Fatigue Score** (0-100%)
- **Risk Level** (low, medium, high)
- **Timestamp** (when measured)
- **Metrics:**
  - Reaction time
  - Typing patterns (latency, accuracy, backspace rate)

### What's NOT Tracked
- Personal health history
- Medical conditions
- Mental health data
- Contact information

---

## Tips for Best Results

1. **Run Analysis First**
   - Coach needs data to give personalized guidance
   - Analysis takes 4-5 minutes

2. **Be Specific**
   - "Why is my fatigue high?" → Better response
   - "I'm tired" → Generic response

3. **Ask Follow-up Questions**
   - "Should I rest?" → Coach explains why
   - "How can I sleep better?" → Coach focuses on recovery

4. **Trust the Coach**
   - Based on real metrics (not guessing)
   - Professional guidance from your performance data
   - Transparent about limitations

---

## When to Seek Professional Help

**Contact a healthcare provider if:**
- You have persistent fatigue lasting weeks
- You experience other symptoms
- You have mental health concerns
- You're taking medications
- You have medical conditions

**NeuroFit Coach cannot:**
- Diagnose medical conditions
- Replace professional medical advice
- Provide therapy or counseling
- Prescribe treatments

---

## Troubleshooting

### "Coach says 'Run analysis first'"
**Solution:** Go to Dashboard, click "Run Fatigue Analysis", complete all 4 steps

### "I don't see my fatigue score"
**Solution:** Refresh page after completing analysis

### "Coach won't answer my question"
**Solution:** Try rewording more specifically, or check if it's a medical question

### "It says to contact a doctor"
**Solution:** That's correct! Coach redirects medical questions to professionals

---

## Mobile Usage

NeuroFit Coach works on mobile! 
- Chat interface is responsive
- Touch-friendly buttons
- Scrollable message history
- Works portrait and landscape

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Enter | Send message |
| Shift+Enter | New line (if textarea) |
| Ctrl/Cmd+R | Refresh page |

---

## Key Features Summary

✅ **Context-Aware**
- Reads your latest fatigue analysis
- Personalizes responses to your data

✅ **Professional**
- Calm, supportive tone
- Evidence-based guidance
- Transparent about limitations

✅ **Safe**
- Blocks medical terminology
- Redirects health concerns appropriately
- Never claims clinical accuracy

✅ **Comprehensive**
- 25+ response patterns
- Covers fatigue, workouts, recovery, metrics
- Suggestions for getting started

✅ **Private**
- No data transmission
- All processing client-side
- No tracking or analytics

---

## Example Use Cases

### Use Case 1: Confused About Score
```
1. Complete analysis (75% fatigue)
2. Open chatbot
3. See "Fatigue: 75%"
4. Ask "Why is it so high?"
5. Coach explains specific reasons
6. Understand your metrics
```

### Use Case 2: Deciding on Workout
```
1. Complete analysis (high fatigue)
2. Open chatbot
3. Ask "Should I skip the gym?"
4. Coach recommends lighter activity
5. Know what to do today
6. Maintain consistency
```

### Use Case 3: Recovery Planning
```
1. Complete analysis (medium fatigue)
2. Open chatbot
3. Ask "How can I improve?"
4. Coach gives sleep/hydration tips
5. Plan recovery strategies
6. Run analysis again tomorrow
```

---

## Frequently Asked Questions (Coach FAQ)

**Q: Is the coach a real AI?**
A: No, it's rule-based (pattern matching). It's professional but not ML-powered.

**Q: Can I get medical advice?**
A: No, but coach will redirect you to healthcare professionals appropriately.

**Q: Does coach track me?**
A: No. All processing is client-side. No data is sent to servers (except analysis).

**Q: Can coach answer other questions?**
A: Coach specializes in fatigue and fitness. Other topics get redirected.

**Q: Is this scientifically accurate?**
A: Coach provides guidance based on your measured metrics (reaction time, typing). Not clinical research.

---

## Important Notes

🎯 **Coach is specialized**
- Focus: Cognitive fatigue + fitness workouts
- Not: General fitness, medical advice, therapy

🎯 **Coach is supportive**
- Tone: Professional, calm, reassuring
- Not: Hyped, alarming, or dismissive

🎯 **Coach is safe**
- Blocks medical/mental health topics
- Redirects appropriately
- Transparent about limitations

---

## Quick Start

1. **Go to:** http://localhost:3000/chatbot
2. **Run analysis first** (if you haven't)
3. **Ask:** "Why is my fatigue high?"
4. **Get personalized guidance**
5. **Make informed fitness decisions**

---

**Status:** ✅ Ready to Use  
**Last Updated:** December 18, 2025  
**Version:** 2.0 (Professional Coach)
