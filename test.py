import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

def get_sklearn_results(csv_path, x_column, y_column):
    # Load and clean data
    df = pd.read_csv(csv_path)
    X = df[x_column].values.reshape(-1, 1)
    y = df[y_column].values
    
    # Remove NaN values
    mask = ~(np.isnan(X.flatten()) | np.isnan(y))
    X_clean = X[mask]
    y_clean = y[mask]
    
    # Fit model
    model = LinearRegression()
    model.fit(X_clean, y_clean)
    
    # Get results
    theta0 = model.intercept_
    theta1 = model.coef_[0]
    
    # Calculate cost (MSE)
    predictions = model.predict(X_clean)
    cost = mean_squared_error(y_clean, predictions)
    
    print(f"Sklearn Results:")
    print(f"theta0: {theta0:.6f}")
    print(f"theta1: {theta1:.6f}")
    print(f"cost: {cost:.6f}")
    
    return theta0, theta1, cost

# Usage:
theta0, theta1, cost = get_sklearn_results("/home/rameel/Downloads/Dataset.csv", "12", "18")