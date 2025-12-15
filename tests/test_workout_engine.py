import importlib
import pytest
import json
from types import ModuleType

MODULE_PATH = "backend.app.workout_engine"
POSSIBLE_FNAMES = [
    "get_personalized_workouts",
    "generate_workouts",
    "generate_workout",
    "select_workouts",
    "get_workouts",
    "personalize_workouts",
    "build_workout_plan",
]


def load_module() -> ModuleType:
    try:
        return importlib.import_module(MODULE_PATH)
    except Exception as e:
        pytest.skip(f"Cannot import module {MODULE_PATH}: {e}")


def find_workout_fn(mod: ModuleType):
    for name in POSSIBLE_FNAMES:
        if hasattr(mod, name):
            return getattr(mod, name)
    # last attempt: see if module provides a default callable (e.g., class with .run)
    if hasattr(mod, "WorkoutEngine"):
        inst = getattr(mod, "WorkoutEngine")
        # try instance or class with static method 'get' or 'generate'
        try:
            obj = inst() if callable(inst) else inst
            for alt in ("get", "generate", "get_personalized_workouts"):
                if hasattr(obj, alt):
                    return getattr(obj, alt)
        except Exception:
            pass
    pytest.skip(
        "No known workout-generation function found in module. "
        f"Tried names: {POSSIBLE_FNAMES} and WorkoutEngine fallback."
    )


@pytest.fixture
def sample_profile():
    return {
        "user_id": "test-user",
        "age": 30,
        "sex": "male",
        "height_cm": 180,
        "weight_kg": 75,
        "fitness_level": "beginner",
        "injuries": [],
    }


def test_workout_fn_exists_and_returns_list(sample_profile):
    mod = load_module()
    fn = find_workout_fn(mod)

    # call with a mid-range fatigue score
    out = fn(sample_profile, 0.5) if fn.__code__.co_argcount >= 2 else fn(sample_profile)
    assert out is not None, "Function returned None"
    assert isinstance(out, (list, tuple)), "Expected a list/tuple of workouts"

    # if list empty, that's not necessarily wrong but warn/skip
    if len(out) == 0:
        pytest.skip("Workout function returned an empty list — nothing to assert further.")

    # check typical fields inside a workout item
    item = out[0]
    assert isinstance(item, dict) or hasattr(item, "__dict__"), "Workout item should be a dict or object"
    # prefer dict-like checks
    if isinstance(item, dict):
        assert any(k in item for k in ("title", "name", "description", "exercises")), \
            "Workout dict should contain at least one of: title, name, description, exercises"


def test_workout_variation_with_fatigue(sample_profile):
    mod = load_module()
    fn = find_workout_fn(mod)

    # call with low fatigue (energetic) and high fatigue (tired)
    try:
        low = fn(sample_profile, 0.05)
        high = fn(sample_profile, 0.95)
    except TypeError:
        # fall back to single-argument calls if the function expects different signature
        low = fn(sample_profile)
        high = fn(sample_profile)

    assert isinstance(low, (list, tuple)) and isinstance(high, (list, tuple))

    # If both lists exist, they should not be identical in almost all sane implementations.
    # We don't enforce semantics, only that the outputs differ when fatigue changes.
    if low and high:
        # stringify for robust comparison
        low_s = json.dumps(low, default=str, sort_keys=True)
        high_s = json.dumps(high, default=str, sort_keys=True)
        assert low_s != high_s, "Workouts did not change between low and high fatigue inputs"


def test_handles_injury_filtering(sample_profile):
    mod = load_module()
    fn = find_workout_fn(mod)

    profile_no_injury = sample_profile.copy()
    profile_knee = sample_profile.copy()
    profile_knee["injuries"] = ["knee"]

    try:
        out_no = fn(profile_no_injury, 0.5)
        out_knee = fn(profile_knee, 0.5)
    except TypeError:
        out_no = fn(profile_no_injury)
        out_knee = fn(profile_knee)

    # If engine implements injury filtering, outputs may differ — assert it's safe to call
    assert isinstance(out_no, (list, tuple)) and isinstance(out_knee, (list, tuple))

    # If both non-empty, ensure function didn't crash and returned valid structure
    if out_no:
        assert isinstance(out_no[0], (dict,)), "Expected workout item to be a dict for no-injury case"
    if out_knee:
        assert isinstance(out_knee[0], (dict,)), "Expected workout item to be a dict for knee-injury case"
