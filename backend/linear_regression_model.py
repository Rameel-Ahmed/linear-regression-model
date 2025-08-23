# linear_regression_model.py
import numpy as np
from typing import Iterable

class LinearRegressionModel:
    """
    Encapsulation:
      - Private parameters __theta_0 / __theta_1.
    Polymorphism:
      - Could be extended later with other regression models.
    """

    def __init__(self, alpha: float = 0.05, max_epochs: int = 100000, tolerance: float = 1e-9):
        self.alpha = alpha
        self.max_epochs = max_epochs
        self.tolerance = tolerance
        self.__theta_0: float = 0.0
        self.__theta_1: float = 0.0
        self.epoch_history = []
        self.cost_history = []

    # Read-only access to learned params
    @property
    def theta_0(self) -> float: return self.__theta_0
    @property
    def theta_1(self) -> float: return self.__theta_1

    def train(self, X: np.ndarray, y: np.ndarray) -> None:
        X = np.asarray(X, dtype=float)
        y = np.asarray(y, dtype=float)
        m = len(X)
        prev_cost = float('inf')

        self.X_train = X
        self.y_train = y

        for epoch in range(self.max_epochs):
            y_pred = self.__theta_0 + self.__theta_1 * X
            error = y_pred - y

            # cost = 0.5 * mean(error^2)
            cost = 0.5 * np.mean(error ** 2)
            print (f"cost: {cost} epoch: {epoch}")

            self.epoch_history.append(epoch)
            self.cost_history.append(cost)

            if abs(prev_cost - cost) < self.tolerance:
                print(f"Converged at epoch {epoch}")
                break
            prev_cost = cost

            d_theta0 = np.mean(error)
            d_theta1 = np.mean(error * X)

            self.__theta_0 -= self.alpha * d_theta0
            self.__theta_1 -= self.alpha * d_theta1

        print(f"Training complete. θ0={self.__theta_0}, θ1={self.__theta_1}")

    def predict(self, X: Iterable[float] | np.ndarray) -> np.ndarray:
        X = np.asarray(X, dtype=float)
        return self.__theta_0 + self.__theta_1 * X

    def predict_single(self, x: float) -> float:
        return float(self.predict([x])[0])

    @staticmethod
    def mse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Utility as static method (no instance state needed)."""
        y_true = np.asarray(y_true, dtype=float)
        y_pred = np.asarray(y_pred, dtype=float)
        return float(np.mean((y_true - y_pred) ** 2))
