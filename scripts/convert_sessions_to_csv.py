#!/usr/bin/env python3
"""
Convert NeuroFit+ session JSONL logs to CSV for model training.

Reads data/sessions.jsonl and outputs data/processed/features.csv
with flattened numeric features.

Supports both answer formats:
- List: [{"question_id": "sleep_hours", "value": 7.5}, ...]
- Dict: {"sleep_hours": 7.5, "energy_level": 6, ...}
"""

import json
import csv
from pathlib import Path
from typing import Dict, Any, List, Union, Optional


def extract_answer_value(answers: Union[List[Dict], Dict[str, float]], question_id: str) -> float:
    """
    Extract answer value from either list or dict format.
    
    Args:
        answers: Either list of {question_id, value} dicts or dict of {question_id: value}
        question_id: The question identifier to look for
    
    Returns:
        The answer value as float, or 0.0 if not found
    """
    if isinstance(answers, list):
        # List format: [{"question_id": "...", "value": ...}, ...]
        for item in answers:
            if isinstance(item, dict) and item.get("question_id") == question_id:
                try:
                    return float(item.get("value", 0.0))
                except (ValueError, TypeError):
                    return 0.0
        return 0.0
    elif isinstance(answers, dict):
        # Dict format: {"sleep_hours": 7.5, ...}
        try:
            return float(answers.get(question_id, 0.0))
        except (ValueError, TypeError):
            return 0.0
    else:
        return 0.0


def extract_typing_features(session: Dict[str, Any]) -> Dict[str, float]:
    """Extract typing-related features from session."""
    typing = session.get("typing_features", {}) or {}
    
    avg_latency = typing.get("avg_key_latency_ms", typing.get("average_latency_ms", 0.0))
    total_duration = typing.get("total_duration_ms", typing.get("duration_ms", 0.0))
    backspace_rate = typing.get("backspace_rate", typing.get("backspace_ratio", 0.0))
    
    try:
        avg_latency = float(avg_latency)
    except (TypeError, ValueError):
        avg_latency = 0.0
    
    try:
        total_duration = float(total_duration)
    except (TypeError, ValueError):
        total_duration = 0.0
    
    try:
        backspace_rate = float(backspace_rate)
    except (TypeError, ValueError):
        backspace_rate = 0.0
    
    return {
        "avg_key_latency_ms": avg_latency,
        "total_duration_ms": total_duration,
        "backspace_rate": backspace_rate,
    }


def extract_task_performance(session: Dict[str, Any]) -> Dict[str, Union[float, int]]:
    """Extract task performance features from session."""
    task = session.get("task_performance", {})
    
    reaction_time_ms = float(task.get("reaction_time_ms", 0.0))
    reaction_attempted = task.get("reaction_attempted", False)
    if isinstance(reaction_attempted, str):
        reaction_attempted = reaction_attempted.lower() in {"1", "true", "yes"}
    
    # If reaction_time_ms exists and > 0, consider it attempted
    if reaction_time_ms > 0 and not reaction_attempted:
        reaction_attempted = True
    
    return {
        "reaction_time_ms": reaction_time_ms,
        "reaction_attempted": 1 if reaction_attempted else 0,
    }


def extract_label(session: Dict[str, Any]) -> Optional[float]:
    """
    Extract label from session if present.
    Label can be in various formats or missing entirely.
    """
    # Check common label field names
    label = session.get("label") or session.get("fatigue_score") or session.get("fatigue_label")
    
    if label is not None:
        try:
            return float(label)
        except (ValueError, TypeError):
            pass
    
    return None


def session_to_features(session: Dict[str, Any]) -> Dict[str, Union[float, int]]:
    """
    Convert a single session dict to a feature dict.
    
    Returns a dict with all required columns, using 0 for missing values.
    """
    answers = session.get("answers", {})
    
    features = {
        "sleep_hours": extract_answer_value(answers, "sleep_hours"),
        "energy_level": extract_answer_value(answers, "energy_level"),
        "stress_level": extract_answer_value(answers, "stress_level"),
    }
    
    # Add typing features
    features.update(extract_typing_features(session))
    
    # Add task performance
    features.update(extract_task_performance(session))
    
    # Add label if present
    label = extract_label(session)
    if label is not None:
        features["label"] = label
    else:
        features["label"] = 0.0
    
    return features


def convert_jsonl_to_csv(
    input_path: Union[str, Path],
    output_path: Union[str, Path],
    include_label: bool = True
) -> int:
    """
    Convert JSONL file to CSV with extracted features.
    
    Args:
        input_path: Path to input JSONL file
        output_path: Path to output CSV file
        include_label: Whether to include label column (even if missing)
    
    Returns:
        Number of sessions processed
    """
    input_path = Path(input_path)
    output_path = Path(output_path)
    
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    all_features = []
    required_columns = [
        "sleep_hours",
        "energy_level",
        "stress_level",
        "avg_key_latency_ms",
        "total_duration_ms",
        "backspace_rate",
        "reaction_time_ms",
        "reaction_attempted",
    ]
    
    if include_label:
        required_columns.append("label")
    
    # Read and process all sessions
    with open(input_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            
            try:
                session = json.loads(line)
                features = session_to_features(session)
                
                # Ensure all required columns are present
                for col in required_columns:
                    if col not in features:
                        features[col] = 0.0
                
                all_features.append(features)
            except json.JSONDecodeError as e:
                print(f"Warning: Skipping invalid JSON on line {line_num}: {e}")
                continue
            except Exception as e:
                print(f"Warning: Error processing line {line_num}: {e}")
                continue
    
    # Write to CSV
    if not all_features:
        print("Warning: No valid sessions found. Creating empty CSV.")
        # Create empty CSV with headers
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=required_columns)
            writer.writeheader()
    else:
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=required_columns)
            writer.writeheader()
            writer.writerows(all_features)
    
    return len(all_features)


def main():
    """Main entry point for the conversion script."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Convert NeuroFit+ session JSONL to CSV features"
    )
    parser.add_argument(
        "--input",
        type=str,
        default="data/sessions.jsonl",
        help="Input JSONL file path (default: data/sessions.jsonl)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="data/processed/features.csv",
        help="Output CSV file path (default: data/processed/features.csv)",
    )
    parser.add_argument(
        "--no-label",
        action="store_true",
        help="Exclude label column from output",
    )
    
    args = parser.parse_args()
    
    try:
        count = convert_jsonl_to_csv(
            args.input,
            args.output,
            include_label=not args.no_label
        )
        print(f"✅ Converted {count} sessions to {args.output}")
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())

