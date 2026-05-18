#!/usr/bin/env python3
"""
Generate a mock 3x3 confusion matrix for Low, Medium, and High fatigue levels.
This is useful for reports and presentations to demonstrate a multi-class
classification scenario.
"""

import os
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

def main():
    # Define the 3 classes
    classes = ["Low", "Medium", "High"]
    
    # We will define a mock confusion matrix directly to ensure it looks realistic
    # and has a decent accuracy, but with some expected confusion between adjacent classes.
    # Rows = True labels, Columns = Predicted labels
    # Format: [Low_pred, Medium_pred, High_pred]
    cm = np.array([
        [45,  5,  0],  # True Low: mostly predicted Low, some Medium, no High
        [ 8, 38,  4],  # True Medium: mostly predicted Medium, some Low and High
        [ 1,  6, 43]   # True High: mostly predicted High, some Medium, rarely Low
    ])
    
    print("Generated mock 3x3 confusion matrix:")
    print(cm)
    
    # Calculate mock accuracy for display
    total = np.sum(cm)
    correct = np.trace(cm)
    accuracy = correct / total
    print(f"Mock Accuracy: {accuracy:.2f}")

    # Plot the confusion matrix
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=classes)
    
    # Use Blues colormap to match typical project aesthetics
    fig, ax = plt.subplots(figsize=(8, 6))
    disp.plot(cmap="Blues", ax=ax, values_format="d")
    
    plt.title("Confusion Matrix (3-Class Fatigue Prediction)")
    plt.tight_layout()
    
    # Determine the output path
    model_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(model_dir, "confusion_matrix_3x3.png")
    
    # Save the plot
    plt.savefig(out_path, dpi=300)
    plt.close()
    
    print(f"Successfully saved 3x3 confusion matrix to: {out_path}")

if __name__ == "__main__":
    main()
