#!/usr/bin/env python3
"""
Random Forest Classifier Accuracy Testing Script
Tests the trained model with comprehensive metrics
"""

import os
import sys
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import (
    accuracy_score, 
    precision_score, 
    recall_score, 
    f1_score,
    confusion_matrix,
    classification_report,
    roc_auc_score,
    roc_curve
)
from sklearn.model_selection import cross_val_score
import matplotlib.pyplot as plt
import seaborn as sns

# Set up paths
ROOT = os.path.abspath(os.path.dirname(__file__))
MODEL_PATH = os.path.join(ROOT, "models", "fatigue_model.pkl")
FEATURES_CSV = os.path.join(ROOT, "data", "processed", "features.csv")

def load_model():
    """Load the trained Random Forest model"""
    print(f"Loading model from: {MODEL_PATH}")
    if not os.path.exists(MODEL_PATH):
        print(f"ERROR: Model file not found at {MODEL_PATH}")
        sys.exit(1)
    
    model_data = joblib.load(MODEL_PATH)
    if isinstance(model_data, dict):
        model = model_data.get('model')
        feature_names = model_data.get('feature_names', [])
    else:
        model = model_data
        feature_names = []
    
    print(f"Model loaded successfully: {type(model).__name__}")
    print(f"Number of estimators: {model.n_estimators}")
    return model, feature_names

def load_data():
    """Load the features dataset"""
    print(f"\nLoading data from: {FEATURES_CSV}")
    if not os.path.exists(FEATURES_CSV):
        print(f"ERROR: Features file not found at {FEATURES_CSV}")
        sys.exit(1)
    
    df = pd.read_csv(FEATURES_CSV)
    print(f"Data loaded: {df.shape[0]} samples, {df.shape[1]} features")
    print(f"Columns: {list(df.columns)}")
    
    return df

def generate_synthetic_test_data(n_samples=100):
    """
    Generate synthetic test data for more robust evaluation
    Creates realistic fatigue patterns based on the feature distributions
    """
    print(f"\nGenerating {n_samples} synthetic test samples...")
    
    np.random.seed(42)
    
    # Generate features with realistic distributions
    data = []
    for i in range(n_samples):
        # Determine fatigue state (0 = not fatigued, 1 = fatigued)
        is_fatigued = np.random.choice([0, 1], p=[0.6, 0.4])
        
        if is_fatigued:
            # Fatigued state: less sleep, lower energy, higher stress, slower reactions
            sleep_hours = np.random.uniform(3, 6)
            energy_level = np.random.uniform(1, 3)
            stress_level = np.random.uniform(3, 5)
            reaction_time_ms = np.random.uniform(600, 1000)
            reaction_attempted = 1
        else:
            # Not fatigued: good sleep, high energy, low stress, fast reactions
            sleep_hours = np.random.uniform(6, 9)
            energy_level = np.random.uniform(3, 5)
            stress_level = np.random.uniform(1, 3)
            reaction_time_ms = np.random.uniform(250, 500)
            reaction_attempted = 1
        
        data.append({
            'sleep_hours': sleep_hours,
            'energy_level': energy_level,
            'stress_level': stress_level,
            'reaction_time_ms': reaction_time_ms,
            'reaction_attempted': reaction_attempted,
            'label': is_fatigued
        })
    
    df = pd.DataFrame(data)
    print(f"Synthetic data generated: {df.shape}")
    print(f"Class distribution: {df['label'].value_counts().to_dict()}")
    
    return df

def evaluate_model(model, X, y, dataset_name="Test"):
    """Evaluate model with comprehensive metrics"""
    print(f"\n{'='*60}")
    print(f"EVALUATING ON {dataset_name.upper()} SET")
    print(f"{'='*60}")
    
    # Make predictions
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)[:, 1] if hasattr(model, 'predict_proba') else None
    
    # Calculate metrics
    accuracy = accuracy_score(y, y_pred)
    precision = precision_score(y, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y, y_pred, average='weighted', zero_division=0)
    
    print(f"\n📊 CLASSIFICATION METRICS:")
    print(f"{'─'*60}")
    print(f"  Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"  Precision: {precision:.4f} ({precision*100:.2f}%)")
    print(f"  Recall:    {recall:.4f} ({recall*100:.2f}%)")
    print(f"  F1-Score:  {f1:.4f} ({f1*100:.2f}%)")
    
    # ROC-AUC if binary classification
    if y_proba is not None and len(np.unique(y)) == 2:
        try:
            auc = roc_auc_score(y, y_proba)
            print(f"  ROC-AUC:   {auc:.4f} ({auc*100:.2f}%)")
        except:
            pass
    
    # Confusion Matrix
    cm = confusion_matrix(y, y_pred)
    print(f"\n📈 CONFUSION MATRIX:")
    print(f"{'─'*60}")
    print(f"                Predicted")
    print(f"              Not Fatigued  Fatigued")
    print(f"Actual Not Fatigued    {cm[0][0]:4d}        {cm[0][1]:4d}")
    print(f"       Fatigued        {cm[1][0]:4d}        {cm[1][1]:4d}")
    
    # Classification Report
    print(f"\n📋 DETAILED CLASSIFICATION REPORT:")
    print(f"{'─'*60}")
    print(classification_report(y, y_pred, target_names=['Not Fatigued', 'Fatigued'], zero_division=0))
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'confusion_matrix': cm,
        'predictions': y_pred,
        'probabilities': y_proba
    }

def cross_validate_model(model, X, y):
    """Perform cross-validation"""
    print(f"\n{'='*60}")
    print(f"CROSS-VALIDATION (5-FOLD)")
    print(f"{'='*60}")
    
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    
    print(f"\n🔄 Cross-Validation Scores:")
    print(f"{'─'*60}")
    for i, score in enumerate(cv_scores, 1):
        print(f"  Fold {i}: {score:.4f} ({score*100:.2f}%)")
    print(f"{'─'*60}")
    print(f"  Mean:   {cv_scores.mean():.4f} ({cv_scores.mean()*100:.2f}%)")
    print(f"  Std:    {cv_scores.std():.4f} (±{cv_scores.std()*100:.2f}%)")
    
    return cv_scores

def feature_importance_analysis(model, feature_names):
    """Analyze and display feature importance"""
    if not hasattr(model, 'feature_importances_'):
        return
    
    print(f"\n{'='*60}")
    print(f"FEATURE IMPORTANCE ANALYSIS")
    print(f"{'='*60}\n")
    
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    print("📊 Features ranked by importance:")
    print(f"{'─'*60}")
    for i, idx in enumerate(indices, 1):
        feature_name = feature_names[idx] if feature_names else f"Feature {idx}"
        print(f"  {i}. {feature_name:25s} {importances[idx]:.4f} ({importances[idx]*100:.2f}%)")

def main():
    print("="*60)
    print("  RANDOM FOREST CLASSIFIER - ACCURACY TEST")
    print("="*60)
    
    # Load model
    model, feature_names = load_model()
    
    # Load original data
    df_original = load_data()
    
    # Prepare original data
    if 'label' in df_original.columns:
        y_original = df_original['label'].values
        X_original = df_original.drop(columns=['label']).values
        
        print(f"\n✅ Original dataset ready: {len(y_original)} samples")
        
        # Evaluate on original data
        results_original = evaluate_model(model, X_original, y_original, "Original Data")
    else:
        print("\n⚠️  No labels found in original data, skipping original data evaluation")
        X_original = None
        y_original = None
    
    # Generate and evaluate on synthetic data
    df_synthetic = generate_synthetic_test_data(n_samples=200)
    y_synthetic = df_synthetic['label'].values
    X_synthetic = df_synthetic.drop(columns=['label']).values
    
    results_synthetic = evaluate_model(model, X_synthetic, y_synthetic, "Synthetic Data")
    
    # Cross-validation on synthetic data
    if len(y_synthetic) >= 10:
        cv_scores = cross_validate_model(model, X_synthetic, y_synthetic)
    
    # Feature importance
    if feature_names:
        feature_importance_analysis(model, feature_names)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"  SUMMARY")
    print(f"{'='*60}\n")
    print(f"✅ Model Type: {type(model).__name__}")
    print(f"✅ Number of Estimators: {model.n_estimators}")
    print(f"✅ Number of Features: {len(feature_names) if feature_names else 'Unknown'}")
    
    if y_original is not None:
        print(f"\n📊 Original Data Performance:")
        print(f"   Accuracy: {results_original['accuracy']:.4f} ({results_original['accuracy']*100:.2f}%)")
    
    print(f"\n📊 Synthetic Data Performance:")
    print(f"   Accuracy: {results_synthetic['accuracy']:.4f} ({results_synthetic['accuracy']*100:.2f}%)")
    print(f"   Precision: {results_synthetic['precision']:.4f} ({results_synthetic['precision']*100:.2f}%)")
    print(f"   Recall: {results_synthetic['recall']:.4f} ({results_synthetic['recall']*100:.2f}%)")
    print(f"   F1-Score: {results_synthetic['f1']:.4f} ({results_synthetic['f1']*100:.2f}%)")
    
    print(f"\n{'='*60}")
    print("  TEST COMPLETE ✅")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
