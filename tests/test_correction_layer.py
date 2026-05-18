"""
Unit tests for the post-model correction layer.

Tests verify that objective cognitive signals (reaction time, lapses, typing latency)
properly override subjective inputs (sleep, energy) when they conflict.
"""

import pytest
from dataclasses import dataclass
from backend.app.main import (
    apply_correction_rules,
    TypingFeatures,
    TaskPerformance,
)


class TestCorrectionRules:
    """Test suite for fatigue correction rules."""
    
    # ========== Test Rule 1: High Reaction Time ==========
    
    def test_high_rt_over_450ms_enforces_high_fatigue(self):
        """Rule 1: RT > 450ms should enforce fatigue ≥ 0.70"""
        ans = {"energy_level": 10, "sleep_hours": 9}  # Very high energy
        typing = TypingFeatures(average_latency_ms=100, backspace_rate=0.05)
        task = TaskPerformance(reaction_time_ms=480, reaction_attempted=1, reaction_lapses=0)
        
        ml_pred = 0.10  # ML says LOW fatigue
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        assert corrected >= 0.70, f"Expected ≥0.70, got {corrected}"
    
    def test_elevated_rt_400_450ms_enforces_moderate_fatigue(self):
        """Rule 1: RT 400-450ms should enforce fatigue ≥ 0.35"""
        ans = {"energy_level": 9, "sleep_hours": 8}
        typing = TypingFeatures(average_latency_ms=100, backspace_rate=0.05)
        task = TaskPerformance(reaction_time_ms=420, reaction_attempted=1, reaction_lapses=0)
        
        ml_pred = 0.10
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        assert corrected >= 0.35, f"Expected ≥0.35, got {corrected}"
    
    def test_normal_rt_no_penalty(self):
        """Rule 1: RT < 350ms should not trigger penalty"""
        ans = {"energy_level": 10, "sleep_hours": 9}
        typing = TypingFeatures(average_latency_ms=100, backspace_rate=0.05)
        task = TaskPerformance(reaction_time_ms=300, reaction_attempted=1, reaction_lapses=0)
        
        ml_pred = 0.10
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        # Should not be forced up by RT rule
        assert corrected <= 0.15, f"Should not increase with normal RT, got {corrected}"
    
    # ========== Test Rule 3: Reaction Lapses ==========
    
    def test_single_lapse_adds_0_1(self):
        """Rule 3: 1 lapse should add +0.10 fatigue"""
        ans = {"energy_level": 5, "sleep_hours": 7}
        typing = TypingFeatures(average_latency_ms=100, backspace_rate=0.05)
        task = TaskPerformance(reaction_time_ms=300, reaction_attempted=1, reaction_lapses=1)
        
        ml_pred = 0.30
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        assert corrected >= 0.40, f"Expected ≥0.40 (0.30 + 0.10), got {corrected}"
    
    def test_multiple_lapses_capped_at_0_30(self):
        """Rule 3: Lapse penalty should cap at +0.30"""
        ans = {"energy_level": 5, "sleep_hours": 7}
        typing = TypingFeatures(average_latency_ms=100, backspace_rate=0.05)
        task = TaskPerformance(reaction_time_ms=300, reaction_attempted=1, reaction_lapses=5)
        
        ml_pred = 0.50
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        # 0.50 + min(0.30, 5*0.10) = 0.50 + 0.30 = 0.80
        assert corrected >= 0.75, f"Expected ≥0.75, got {corrected}"
    
    # ========== Test Rule 4: Subjective/Objective Mismatch ==========
    
    def test_high_energy_poor_rt_triggers_mismatch_penalty(self):
        """Rule 4: High energy (≥7) + poor RT (>400) should add +0.15"""
        ans = {"energy_level": 8, "sleep_hours": 8}  # Claims high energy
        typing = TypingFeatures(average_latency_ms=100, backspace_rate=0.05)
        task = TaskPerformance(reaction_time_ms=420, reaction_attempted=1, reaction_lapses=0)
        
        ml_pred = 0.40
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        # Should have both RT penalty (0.35 min) and mismatch penalty (0.15)
        # Result should be higher than if only RT penalty applied
        assert corrected >= 0.50, f"Expected ≥0.50 with mismatch penalty, got {corrected}"
    
    def test_high_energy_good_rt_no_mismatch_penalty(self):
        """Rule 4: High energy + good RT should not trigger penalty"""
        ans = {"energy_level": 9, "sleep_hours": 9}
        typing = TypingFeatures(average_latency_ms=100, backspace_rate=0.05)
        task = TaskPerformance(reaction_time_ms=280, reaction_attempted=1, reaction_lapses=0)
        
        ml_pred = 0.10
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        # Should not be heavily penalized if RT is actually good
        assert corrected <= 0.20, f"No penalty expected with good RT, got {corrected}"
    
    # ========== Test Rule 5: High Typing Latency ==========
    
    def test_high_typing_latency_enforces_minimum(self):
        """Rule 5: Typing latency >500ms should enforce fatigue ≥ 0.45"""
        ans = {"energy_level": 8, "sleep_hours": 8}
        typing = TypingFeatures(average_latency_ms=600, backspace_rate=0.05)
        task = TaskPerformance(reaction_time_ms=300, reaction_attempted=1, reaction_lapses=0)
        
        ml_pred = 0.10
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        assert corrected >= 0.45, f"Expected ≥0.45 with high typing latency, got {corrected}"
    
    # ========== Test Rule 6: High Backspace Rate ==========
    
    def test_high_backspace_rate_enforces_minimum(self):
        """Rule 6: Backspace rate >0.25 should enforce fatigue ≥ 0.50"""
        ans = {"energy_level": 8, "sleep_hours": 8}
        typing = TypingFeatures(average_latency_ms=100, backspace_rate=0.30)
        task = TaskPerformance(reaction_time_ms=300, reaction_attempted=1, reaction_lapses=0)
        
        ml_pred = 0.10
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        assert corrected >= 0.50, f"Expected ≥0.50 with high backspace rate, got {corrected}"
    
    # ========== Integration Tests ==========
    
    def test_multiple_rules_trigger_cumulative_effect(self):
        """Multiple rules should apply cumulatively (bounded by max)"""
        ans = {"energy_level": 9, "sleep_hours": 9}  # High energy claim
        typing = TypingFeatures(average_latency_ms=600, backspace_rate=0.30)  # Bad typing
        task = TaskPerformance(reaction_time_ms=450, reaction_attempted=1, reaction_lapses=2)  # Bad RT + lapses
        
        ml_pred = 0.10
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        # Should trigger: RT (0.70), lapses (+0.20), mismatch (+0.15), typing (0.45), backspace (0.50)
        # Final should be clamped and should be quite high
        assert corrected >= 0.70, f"Expected high fatigue with multiple triggers, got {corrected}"
    
    def test_correction_clamped_at_1_0(self):
        """Fatigue score should never exceed 1.0"""
        ans = {"energy_level": 10, "sleep_hours": 10}
        typing = TypingFeatures(average_latency_ms=1000, backspace_rate=0.50)
        task = TaskPerformance(reaction_time_ms=500, reaction_attempted=1, reaction_lapses=10)
        
        ml_pred = 0.90
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        assert corrected <= 1.0, f"Expected ≤1.0, got {corrected}"
    
    def test_correction_clamped_at_0_0(self):
        """Fatigue score should never be negative"""
        ans = {"energy_level": 1, "sleep_hours": 0}
        typing = TypingFeatures(average_latency_ms=0, backspace_rate=0)
        task = TaskPerformance(reaction_time_ms=None, reaction_attempted=0, reaction_lapses=0)
        
        ml_pred = 0.0
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        assert corrected >= 0.0, f"Expected ≥0.0, got {corrected}"
    
    # ========== Safety Rule: Poor RT Minimum ==========
    
    def test_safety_rule_ensures_poor_rt_minimum(self):
        """Safety: Any poor RT (>400ms) should ensure fatigue ≥ 0.35"""
        ans = {"energy_level": 10, "sleep_hours": 10}
        typing = TypingFeatures(average_latency_ms=100, backspace_rate=0.05)
        task = TaskPerformance(reaction_time_ms=410, reaction_attempted=1, reaction_lapses=0)
        
        ml_pred = 0.05  # Very low ML pred
        corrected = apply_correction_rules(ml_pred, ans, typing, task)
        
        assert corrected >= 0.35, f"Safety rule failed: expected ≥0.35, got {corrected}"


if __name__ == "__main__":
    # Run with: pytest tests/test_correction_layer.py -v
    pytest.main([__file__, "-v"])
