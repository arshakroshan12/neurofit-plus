# backend/app/workout_engine.py
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

BASE = Path(__file__).resolve().parent.parent
WORKOUT_FILE = BASE / "data" / "workout_library.json"

# Load library once at import
if WORKOUT_FILE.exists():
    with open(WORKOUT_FILE, "r", encoding="utf-8") as f:
        WORKOUT_LIBRARY = json.load(f)
else:
    WORKOUT_LIBRARY = []

def compute_bmi(height_cm: Optional[float], weight_kg: Optional[float]) -> Optional[float]:
    try:
        if not height_cm or not weight_kg:
            return None
        h = float(height_cm) / 100.0
        if h <= 0:
            return None
        return round(float(weight_kg) / (h * h), 1)
    except Exception:
        return None

def _category_for_fatigue(score: float) -> str:
    if score <= 30:
        return "energizing"
    if score <= 60:
        return "balanced"
    return "restorative"

def _difficulty_factor(difficulty: str) -> float:
    if difficulty == "easy":
        return 0.95
    if difficulty == "medium":
        return 1.0
    if difficulty == "hard":
        return 1.1
    return 1.0

def personalize_and_rank(
    fatigue_score: float,
    bmi: Optional[float] = None,
    sleep_hours: Optional[float] = None,
    fitness_level: Optional[str] = None,
    injuries: Optional[List[str]] = None,
    medical_conditions: Optional[List[str]] = None,
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """
    Returns top_k workout recommendations (structured) based on simple rules.
    """
    base_category = _category_for_fatigue(fatigue_score)
    intensity_factor = 1.0

    # BMI adjustments
    if bmi is not None:
        try:
            b = float(bmi)
            if b >= 30:
                intensity_factor *= 0.7
            elif b >= 25:
                intensity_factor *= 0.85
        except Exception:
            pass

    # Sleep adjustment
    if sleep_hours is not None:
        try:
            sh = float(sleep_hours)
            if sh < 6:
                intensity_factor *= 0.85
        except Exception:
            pass

    # Fitness level adjustments
    if isinstance(fitness_level, str):
        fl = fitness_level.lower()
        if fl == "beginner":
            intensity_factor *= 0.85
        elif fl == "advanced":
            intensity_factor *= 1.05

    # Medical conditions reduce intensity heavily
    if medical_conditions:
        intensity_factor *= 0.6

    banned = set([i.lower() for i in (injuries or [])])

    scored: List[Tuple[float, Dict[str, Any]]] = []
    for w in WORKOUT_LIBRARY:
        w_cat = (w.get("category") or "").lower()
        # discard workouts that explicitly target injured parts
        targets = set([t.lower() for t in (w.get("targets") or [])])
        if banned & targets:
            continue

        # base score: prefer workouts that match category
        score = 1.0
        if w_cat == base_category:
            score *= 1.2
        else:
            # small preference to balanced if medium fatigue
            if base_category == "balanced" and w_cat == "balanced":
                score *= 1.05
            else:
                score *= 0.9

        # difficulty factor
        score *= _difficulty_factor(w.get("difficulty", "medium"))

        # scale by intensity factor (user-specific)
        score *= intensity_factor

        # small boost for shorter workouts when fatigue is high
        if base_category == "restorative" and w.get("duration_min", 0) > 15:
            score *= 0.9

        scored.append((score, w))

    # sort and pick top_k
    scored.sort(key=lambda x: x[0], reverse=True)
    results: List[Dict[str, Any]] = []
    for score, w in scored[: top_k]:
        scaled_duration = max(3, int(round(w.get("duration_min", 10) * score)))
        results.append({
            "id": w.get("id"),
            "title": w.get("title"),
            "category": w.get("category"),
            "difficulty": w.get("difficulty"),
            "duration_min": w.get("duration_min"),
            "scaled_duration_min": scaled_duration,
            "intensity_score": round(float(score), 2),
            "equipment": w.get("equipment", []),
            "targets": w.get("targets", []),
            "steps": w.get("steps", []),
            "notes": w.get("notes", "") if isinstance(w.get("notes", ""), str) else ""
        })
    return results
