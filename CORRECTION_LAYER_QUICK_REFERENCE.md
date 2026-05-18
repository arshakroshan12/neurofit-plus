# Correction Layer: Quick Reference

## At a Glance

**What:** Post-prediction rule-based system that ensures objective cognitive signals override subjective inputs  
**Where:** `backend/app/main.py` → `apply_correction_rules()` function  
**When:** Immediately after ML model prediction, before risk mapping  
**Why:** Prevent dangerous fatigue underestimation when users claim high energy but perform poorly  

---

## The 6 Rules

```
1. HIGH RT (>400ms)          → Enforce fatigue ≥ 0.35–0.70
2. RT VARIANCE               → Ready for implementation
3. MISSED RESPONSES (lapses) → Add +0.10–0.30
4. ENERGY/PERFORMANCE GAP    → Add +0.15 if energy ≥7 + RT > 400
5. HIGH TYPING LATENCY (>500ms) → Enforce fatigue ≥ 0.45
6. HIGH BACKSPACE RATE (>0.25)  → Enforce fatigue ≥ 0.50
```

---

## Quick Decision Tree

```
Is RT > 400ms?
├─ YES → Enforce ≥ 0.35 (or ≥ 0.70 if > 450ms)
└─ NO → Continue

Does user have lapses?
├─ YES → Add 0.10 per lapse (max 0.30)
└─ NO → Continue

Energy ≥ 7.0 AND RT > 400ms?
├─ YES → Add 0.15 (mismatch penalty)
└─ NO → Continue

Typing latency > 500ms?
├─ YES → Enforce ≥ 0.45
└─ NO → Continue

Backspace rate > 0.25?
├─ YES → Enforce ≥ 0.50
└─ NO → Continue

Clamp to [0.0, 1.0] and return
```

---

## Code Location

**Main implementation:**
```python
# backend/app/main.py, lines ~280–365
def apply_correction_rules(fatigue_score, answers, typing_features, task_performance):
    # 6 rules applied here
    return final_score
```

**Data structures:**
```python
# TaskPerformance dataclass (line ~105)
reaction_lapses: int = 0  # ← NEW

# TaskPerfModel schema (line ~248)
reaction_lapses: int = 0  # ← NEW
```

**Integration:**
```python
# Inside /predict_fatigue endpoint (line ~410)
fatigue_score = apply_correction_rules(fatigue_score, ans, td, tp)
```

---

## Thresholds at a Glance

| Metric | Trigger | Action |
|--------|---------|--------|
| Reaction Time | > 450ms | Fatigue ≥ 0.70 |
| Reaction Time | 400–450ms | Fatigue ≥ 0.35 |
| Reaction Lapses | Each | +0.10 (capped +0.30) |
| Energy/RT Gap | E≥7 + RT>400 | +0.15 |
| Typing Latency | > 500ms | Fatigue ≥ 0.45 |
| Backspace Rate | > 0.25 | Fatigue ≥ 0.50 |

---

## Example: Rule Application

```python
# Input
ml_pred = 0.20  # Low from ML
ans = {"energy_level": 8}
task = TaskPerformance(reaction_time_ms=420, reaction_lapses=1)

# Inside apply_correction_rules:
corrected = 0.20
# Rule 1: RT > 400ms
corrected = max(0.20, 0.35)  # → 0.35
# Rule 3: 1 lapse
corrected = min(1.0, 0.35 + 0.10)  # → 0.45
# Rule 4: Energy=8 + RT=420
corrected = min(1.0, 0.45 + 0.15)  # → 0.60
# Return
return 0.60
```

---

## Testing

```bash
# Run all correction layer tests
pytest tests/test_correction_layer.py -v

# Run specific test
pytest tests/test_correction_layer.py::TestCorrectionRules::test_high_rt_over_450ms_enforces_high_fatigue -v
```

---

## Logging

Every correction is logged to stdout:

```
Corrections applied: high_reaction_time(420ms)→0.35 | reaction_lapses(1)→+0.10 | 
energy_performance_mismatch→+0.15 | Score: 0.20 → 0.60
```

Monitor in production:
```bash
# Render logs
render logs  # or view in Render dashboard

# Look for "Corrections applied" messages
```

---

## Frontend Integration

✅ **Already implemented!** Frontend already sends:
- `reaction_time_ms` (milliseconds)
- `reaction_attempted` (boolean)
- `reaction_lapses` (count) ← **This was the missing piece, now in place**

No frontend code changes needed.

---

## API Changes

### Request (New Optional Field)
```json
{
  "task_performance": {
    "reaction_time_ms": 420,
    "reaction_attempted": 1,
    "reaction_lapses": 1
  }
}
```

### Response (Same as Before)
```json
{
  "fatigue_score": 0.60,
  "risk_level": "high"
}
```

---

## Risk Level Mapping

Unchanged from before:

```
Fatigue < 0.35  → LOW risk      → "keep going"
Fatigue 0.35–0.50 → MODERATE risk → "take a break soon"
Fatigue > 0.50  → HIGH risk     → "rest now"
```

---

## Adjusting Thresholds

To change a threshold, edit the constants in `apply_correction_rules()`:

```python
# Example: Lower RT threshold from 400ms to 380ms
if rt > 380:  # Changed from 400
    corrected_score = max(corrected_score, 0.35)

# Example: Increase lapse penalty from 0.10 to 0.15
lapse_penalty = min(0.30, lapses * 0.15)  # Changed from 0.10
```

---

## Monitoring Checklist

- [ ] Check logs for "Corrections applied" messages
- [ ] Track correction frequency (should be 10–30% of predictions)
- [ ] Monitor average fatigue delta (should be 0.1–0.3)
- [ ] Verify risk level distribution (should increase after corrections)
- [ ] Confirm no predictions exceed 1.0 or go below 0.0
- [ ] Test with high-fatigue scenarios (slow RT + lapses)
- [ ] Test with aligned scenarios (energy=high, RT=fast)

---

## Troubleshooting

**Q: Correction never triggers**
- Check if objective metrics meet thresholds
- Verify `reaction_lapses` is being sent from frontend
- Check logs for "Corrections applied" messages

**Q: Fatigue too high even when performance is good**
- Verify thresholds are appropriate for your user base
- Consider adding baseline personalization
- Check if RT threshold (400ms) is appropriate

**Q: API breaking changes**
- None! `reaction_lapses` defaults to 0 if missing
- Fully backward compatible

**Q: Want to disable correction layer**
- Remove the call to `apply_correction_rules()` in `/predict_fatigue`
- Or modify it to return `fatigue_score` unchanged

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/app/main.py` | Implementation |
| `tests/test_correction_layer.py` | 14+ unit tests |
| `CORRECTION_LAYER_IMPLEMENTATION.md` | Full documentation |
| `CORRECTION_LAYER_SUMMARY.md` | Implementation summary |
| `CORRECTION_LAYER_BEFORE_AFTER.md` | Real-world examples |

---

## One-Liner

**The correction layer ensures that when a user's brain is slow, even if they claim to feel fast, the algorithm trusts their brain.**
