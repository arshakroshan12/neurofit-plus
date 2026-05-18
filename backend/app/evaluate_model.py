"""
Model Evaluation Script for NeuroFit+ RandomForestClassifier

- Evaluates classification and regression metrics for fatigue prediction
- Excludes any correction/safety layer logic (pure model evaluation)
- Assumes data is preprocessed and feature order matches training

Usage:
    python evaluate_model.py --data path/to/dataset.csv --model path/to/ml_model.joblib

"""

import argparse
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    mean_absolute_error, mean_squared_error, classification_report
)

# ---- Argument Parsing ----
def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate RandomForestClassifier for NeuroFit+ fatigue prediction.")
    parser.add_argument('--data', type=str, required=True, help='Path to CSV dataset with features and labels')
    parser.add_argument('--model', type=str, required=True, help='Path to trained RandomForestClassifier joblib file')
    parser.add_argument('--label-col', type=str, default='fatigue_label', help='Name of the label column (categorical)')
    parser.add_argument('--score-col', type=str, default='fatigue_score', help='Name of the score column (continuous, optional)')
    parser.add_argument('--cv', action='store_true', help='Enable 5-fold cross-validation (accuracy only)')
    return parser.parse_args()

# ---- Main Evaluation Logic ----
def main():
    args = parse_args()

    # Load data
    df = pd.read_csv(args.data)
    feature_cols = [
        "sleep_hours", "energy_level", "stress_level",
        "reaction_time_ms", "reaction_attempted"
    ]
    X = df[feature_cols]
    y = df[args.label_col]

    # Optional: continuous fatigue score
    y_score = df[args.score_col] if args.score_col in df.columns else None

    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Load or train model
    model = joblib.load(args.model)
    if not isinstance(model, RandomForestClassifier):
        raise ValueError("Loaded model is not a RandomForestClassifier.")

    # (Optional) Retrain on train set for fair comparison
    # model.fit(X_train, y_train)

    # Predict
    y_pred = model.predict(X_test)

    # ---- Classification Metrics ----
    print("\n--- Classification Metrics ---")
    print(f"Accuracy:        {accuracy_score(y_test, y_pred):.4f}")
    print(f"Precision (wtd): {precision_score(y_test, y_pred, average='weighted'):.4f}")
    print(f"Recall (wtd):    {recall_score(y_test, y_pred, average='weighted'):.4f}")
    print(f"F1-score (wtd):  {f1_score(y_test, y_pred, average='weighted'):.4f}")
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # ---- Regression Metrics (if continuous score available) ----
    if y_score is not None:
        print("\n--- Regression Metrics (Fatigue Score) ---")
        # Predict probabilities for each class, map to score if needed
        # Here, we assume model outputs class labels; if you have a regression model, adjust accordingly
        # For demo: map class to mean score in train set
        class_to_score = y_score.groupby(y).mean().to_dict()
        y_pred_score = [class_to_score.get(label, 0.5) for label in y_pred]
        print(f"MAE: {mean_absolute_error(y_score.iloc[y_test.index], y_pred_score):.4f}")
        print(f"MSE: {mean_squared_error(y_score.iloc[y_test.index], y_pred_score):.4f}")

    # ---- Cross-Validation (optional) ----
    if args.cv:
        print("\n--- 5-Fold Cross-Validation (Accuracy) ---")
        scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
        print(f"Mean CV Accuracy: {scores.mean():.4f} (+/- {scores.std():.4f})")

if __name__ == "__main__":
    main()
