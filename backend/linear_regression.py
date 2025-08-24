"""
Linear Regression Model for Backend Training.
Handles gradient descent with real-time updates.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Generator
import time
from .metrics_calculator import MetricsCalculator


class LinearRegressionModel:
    """Linear Regression model with gradient descent training."""
    
    def __init__(self, x_data: np.ndarray, y_data: np.ndarray):
        """Initialize the linear regression model with normalized data for training."""
        # Store original data
        self.x_original = x_data.flatten()
        self.y_original = y_data.flatten()
        
        # Compute normalization parameters
        self.x_mean = np.mean(self.x_original)
        self.x_std = np.std(self.x_original)
        self.y_mean = np.mean(self.y_original)
        self.y_std = np.std(self.y_original)
        
        # Handle case where std is 0 (constant data)
        if self.x_std == 0:
            self.x_std = 1.0
            print("⚠️ Warning: X data has zero variance, setting std to 1.0")
        if self.y_std == 0:
            self.y_std = 1.0
            print("⚠️ Warning: Y data has zero variance, setting std to 1.0")
        
        # Normalize data for training
        self.x_data = (self.x_original - self.x_mean) / self.x_std
        self.y_data = (self.y_original - self.y_mean) / self.y_std
        
        # Initialize parameters
        self.theta0 = 0.0  # intercept
        self.theta1 = 0.0  # slope
        self.m = len(self.x_data)  # number of training examples
        
        # Create design matrix with bias term
        self.X = np.column_stack([np.ones(self.m), self.x_data])
        
        # Initialize metrics calculator
        self.metrics_calculator = MetricsCalculator()
        
        print(f"✅ Model initialized with {self.m} training examples (normalized for training)")
        print(f"📊 Data ranges: X: [{self.x_original.min():.2f}, {self.x_original.max():.2f}], Y: [{self.y_original.min():.2f}, {self.y_original.max():.2f}]")
    
    def train_test_split(self, train_ratio: float = 0.8) -> Dict[str, np.ndarray]:
        """
        Split data into training and testing sets.
        
        Args:
            train_ratio: Proportion of data to use for training (0.0 to 1.0)
        
        Returns:
            Dictionary containing x_train, y_train, x_test, y_test (in original scale)
        """
        if not 0.0 < train_ratio < 1.0:
            raise ValueError("train_ratio must be between 0.0 and 1.0")
        
        # Get total number of samples
        n_samples = len(self.x_original)
        n_train = int(n_samples * train_ratio)
        
        # Create random permutation of indices
        indices = np.random.permutation(n_samples)
        train_indices = indices[:n_train]
        test_indices = indices[n_train:]
        
        # Split the original data
        x_train = self.x_original[train_indices]
        y_train = self.y_original[train_indices]
        x_test = self.x_original[test_indices]
        y_test = self.y_original[test_indices]
        
        print(f"📊 Data split: {n_train} train, {n_samples - n_train} test ({train_ratio*100:.1f}% train)")
        
        return {
            'x_train': x_train,
            'y_train': y_train,
            'x_test': x_test,
            'y_test': y_test
        }
    
    def set_training_data(self, x_train: np.ndarray, y_train: np.ndarray):
        """
        Set specific training data and update normalization.
        
        Args:
            x_train: Training feature values (original scale)
            y_train: Training target values (original scale)
        """
        # Store original training data
        self.x_original = x_train.flatten()
        self.y_original = y_train.flatten()
        
        # Update normalization parameters based on training data only
        self.x_mean = np.mean(self.x_original)
        self.x_std = np.std(self.x_original)
        self.y_mean = np.mean(self.y_original)
        self.y_std = np.std(self.y_original)
        
        # Handle case where std is 0
        if self.x_std == 0:
            self.x_std = 1.0
        if self.y_std == 0:
            self.y_std = 1.0
        
        # Normalize training data
        self.x_data = (self.x_original - self.x_mean) / self.x_std
        self.y_data = (self.y_original - self.y_mean) / self.y_std
        
        self.m = len(self.x_data)
        
        # Recreate design matrix with normalized data
        self.X = np.column_stack([np.ones(self.m), self.x_data])
        
        print(f"✅ Training data set: {self.m} examples (normalized for training)")
    
    def hypothesis(self, X: np.ndarray, theta: np.ndarray) -> np.ndarray:
        """Compute hypothesis: h(x) = θ₀ + θ₁x"""
        return X @ theta
    
    def compute_cost(self, theta: np.ndarray) -> float:
        """Compute cost function: J(θ) = (1/2m) * Σ(h(x) - y)²"""
        predictions = self.hypothesis(self.X, theta)
        cost = (1 / (2 * self.m)) * np.sum((predictions - self.y_data) ** 2)
        return float(cost)
    
    def compute_gradients(self, theta: np.ndarray) -> Tuple[float, float]:
        """Compute gradients for θ₀ and θ₁"""
        predictions = self.hypothesis(self.X, theta)
        error = predictions - self.y_data  # Keep as 1D array
        
        # Gradient for θ₀ (intercept)
        grad_theta0 = (1 / self.m) * np.sum(error)
        
        # Gradient for θ₁ (slope)
        grad_theta1 = (1 / self.m) * np.sum(error * self.x_data)
        
        return float(grad_theta0), float(grad_theta1)
    
    def train_epoch_by_epoch(
        self, 
        learning_rate: float, 
        max_epochs: int, 
        tolerance: float = 1e-6,
        early_stopping: bool = True
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Train the model epoch by epoch with real-time updates.
        
        Args:
            learning_rate: Learning rate (α)
            max_epochs: Maximum number of training epochs
            tolerance: Convergence tolerance
            early_stopping: Whether to stop early if cost doesn't improve
        
        Yields:
            Dictionary with epoch info, theta values, and cost
        """
        print(f"🚀 Starting training: α={learning_rate}, epochs={max_epochs}, tolerance={tolerance}")
        
        theta = np.array([self.theta0, self.theta1])
        prev_cost = float('inf')
        no_improvement_count = 0
        
        for epoch in range(1, max_epochs + 1):
            # Compute current cost
            current_cost = self.compute_cost(theta)
            
            # Compute gradients
            grad_theta0, grad_theta1 = self.compute_gradients(theta)
            
            # Debug first few epochs
            if epoch <= 5:
                print(f"🔍 Epoch {epoch}: θ₀={theta[0]:.6f}, θ₁={theta[1]:.6f}, Cost={current_cost:.6f}")
                print(f"🔍 Gradients: grad_θ₀={grad_theta0:.6f}, grad_θ₁={grad_theta1:.6f}")
        
            # Update parameters
            theta[0] -= learning_rate * grad_theta0  # θ₀
            theta[1] -= learning_rate * grad_theta1  # θ₁
            
            # Check for numerical explosion
            if np.isnan(theta).any() or np.isinf(theta).any():
                print(f"❌ Numerical explosion detected at epoch {epoch}")
                print(f"❌ Try reducing learning rate (current: {learning_rate})")
                break
            
            # Update instance variables
            self.theta0 = theta[0]
            self.theta1 = theta[1]
            
            # Check for convergence
            cost_change = abs(prev_cost - current_cost)  # abs() handles both +ve and -ve changes
            converged = cost_change < tolerance
            
            # Simple early stopping: if cost doesn't change much for 15 epochs, stop
            if early_stopping and cost_change < tolerance:
                no_improvement_count += 1
                if no_improvement_count >= 15:  # Wait 15 epochs before stopping
                    print(f"🛑 Early stopping at epoch {epoch} (cost stable for {no_improvement_count} epochs)")
                    break
            else:
                no_improvement_count = 0  # Reset counter if we see improvement
            
            # Calculate performance metrics for current epoch
            # Get predictions in original scale for metrics calculation
            orig_params = self.get_original_scale_parameters()
            predictions = self.predict_original_scale(self.x_original)
            
            # Calculate metrics using the metrics calculator
            metrics = self.metrics_calculator.calculate_metrics(
                y_true=self.y_original,
                y_pred=predictions,
                epoch=epoch
            )
            
            # Yield current state with metrics
            epoch_data = {
                "epoch": epoch,
                "max_epochs": max_epochs,
                "theta0": self.theta0,
                "theta1": self.theta1,
                "cost": current_cost,
                "cost_change": cost_change,
                "converged": converged,
                "is_complete": epoch >= max_epochs or converged,
                # Add performance metrics
                "rmse": metrics['rmse'],
                "mae": metrics['mae'],
                "r2": metrics['r2']
            }
            
            yield epoch_data
            
            # Update previous cost
            prev_cost = current_cost
        
        print(f"✅ Training completed: Final cost = {current_cost:.6f}")
        print(f"📊 Final parameters (normalized): θ₀ = {self.theta0:.4f}, θ₁ = {self.theta1:.4f}")
        
        # Show original scale parameters
        orig_params = self.get_original_scale_parameters()
        print(f"📊 Final parameters (original): θ₀ = {orig_params['theta0']:.4f}, θ₁ = {orig_params['theta1']:.4f}")
    
    def get_model_summary(self) -> Dict[str, Any]:
        """Get summary of the trained model."""
        orig_params = self.get_original_scale_parameters()
        
        # Safely get metrics summary
        metrics_summary = {}
        try:
            if hasattr(self, 'metrics_calculator') and self.metrics_calculator:
                metrics_summary = self.metrics_calculator.get_metrics_summary()
            else:
                print("⚠️ Warning: metrics_calculator not available")
                metrics_summary = {}
        except Exception as e:
            print(f"⚠️ Warning: Error getting metrics summary: {e}")
            metrics_summary = {}
        
        return {
            "normalized_theta0": self.theta0,
            "normalized_theta1": self.theta1,
            "original_theta0": orig_params['theta0'],
            "original_theta1": orig_params['theta1'],
            "equation_normalized": f"y_norm = {self.theta0:.4f} + {self.theta1:.4f}·x_norm",
            "equation_original": f"y = {orig_params['theta0']:.4f} + {orig_params['theta1']:.4f}·x",
            "training_examples": self.m,
            "final_cost": self.compute_cost(np.array([self.theta0, self.theta1])),
            "metrics_summary": metrics_summary
        }
    
    def get_metrics_history(self) -> Dict[str, Any]:
        """Get the complete metrics history from training."""
        return self.metrics_calculator.get_metrics_history()
    
    def get_latest_metrics(self) -> Dict[str, float]:
        """Get the most recent metrics from training."""
        return self.metrics_calculator.get_latest_metrics()

    def get_original_scale_parameters(self) -> Dict[str, float]:
        """Get the parameters in the original data scale."""
        # Convert normalized parameters back to original scale
        # For normalized data: y_norm = θ₀_norm + θ₁_norm * x_norm
        # For original data: y = θ₀ + θ₁ * x
        # Where: x_norm = (x - x_mean) / x_std, y_norm = (y - y_mean) / y_std
        
        # θ₁ in original scale
        original_theta1 = self.theta1 * (self.y_std / self.x_std)
        
        # θ₀ in original scale
        original_theta0 = self.theta0 * self.y_std + self.y_mean - original_theta1 * self.x_mean
        
        return {
            'theta0': original_theta0,
            'theta1': original_theta1
        }

    def predict(self, x_values: np.ndarray) -> np.ndarray:
        """Make predictions using the trained model on original scale data."""
        x_values = np.asarray(x_values).flatten()
        
        # Normalize input data using training statistics
        x_normalized = (x_values - self.x_mean) / self.x_std
        
        # Make prediction on normalized data
        predictions_normalized = self.theta0 + self.theta1 * x_normalized
        
        # Denormalize predictions back to original scale
        predictions = predictions_normalized * self.y_std + self.y_mean
        
        return predictions
    
    def predict_original_scale(self, x_values: np.ndarray) -> np.ndarray:
        """Make predictions on original scale data (used internally for metrics)."""
        x_values = np.asarray(x_values).flatten()
        
        # Normalize input data using training statistics
        x_normalized = (x_values - self.x_mean) / self.x_std
        
        # Make prediction on normalized data
        predictions_normalized = self.theta0 + self.theta1 * x_normalized
        
        # Denormalize predictions back to original scale
        predictions = predictions_normalized * self.y_std + self.y_mean
        
        return predictions
    
    def evaluate(self, x_test: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
        """Evaluate the model on test data."""
        predictions = self.predict(x_test)
        
        # Calculate metrics
        mse = np.mean((predictions - y_test) ** 2)
        rmse = np.sqrt(mse)
        
        # R-squared
        ss_res = np.sum((y_test - predictions) ** 2)
        ss_tot = np.sum((y_test - np.mean(y_test)) ** 2)
        r_squared = 1 - (ss_res / ss_tot)
        
        return {
            'mse': mse,
            'rmse': rmse,
            'r_squared': r_squared
        }