"""
Simple Sklearn Comparison Module for Linear Regression.
Just calculates sklearn results and returns basic metrics.
"""

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

class SklearnComparison:
    """Simple sklearn linear regression calculation."""
    
    def __init__(self):
        """Initialize the sklearn model."""
        self.sklearn_model = LinearRegression()
    
    def calculate_sklearn_results(self, x_data: np.ndarray, y_data: np.ndarray) -> dict:
        """
        Calculate sklearn linear regression results.
        
        Args:
            x_data: Input features
            y_data: Target values
            
        Returns:
            Dictionary with sklearn results: theta0, theta1, r2, rmse, cost
        """
        # Reshape x_data if needed (sklearn expects 2D array)
        if x_data.ndim == 1:
            x_data = x_data.reshape(-1, 1)
        
        # Train sklearn model
        self.sklearn_model.fit(x_data, y_data)
        
        # Get predictions
        y_pred = self.sklearn_model.predict(x_data)
        
        # Calculate basic metrics
        mse = mean_squared_error(y_data, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_data, y_pred)
        mae = mean_absolute_error(y_data, y_pred)
        
        # Get coefficients
        theta0 = float(self.sklearn_model.intercept_)  # intercept
        theta1 = float(self.sklearn_model.coef_[0])   # coefficient
        
        return {
            'theta0': theta0,
            'theta1': theta1,
            'r2': r2,
            'rmse': rmse,
            'mae': mae,
            'cost': mae,  # MAE as cost
            'equation': f"y = {theta0:.4f} + {theta1:.4f}x"
        }
