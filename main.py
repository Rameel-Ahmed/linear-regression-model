from backend.csv_loader import CSVLoader
from backend.data_processor import DataProcessor
from backend.linear_regression_model import LinearRegressionModel

import tkinter as tk
from tkinter import filedialog

def browse_csv() -> str:
    """Composition: UI logic separated; returns a path string."""
    root = tk.Tk()
    root.withdraw()
    file_path = filedialog.askopenfilename(
        title="Select CSV file",
        filetypes=[("CSV Files", "*.csv")]
    )
    if not file_path:
        raise RuntimeError("No file selected.")
    print(f"Selected file: {file_path}")
    return file_path

def ask_float(prompt: str, default: float) -> float:
    try:
        val = float(input(prompt))
        return val
    except Exception:
        print(f"Using default: {default}")
        return default

def ask_int(prompt: str, default: int) -> int:
    try:
        val = int(input(prompt))
        return val
    except Exception:
        print(f"Using default: {default}")
        return default

def main():
    try:
        # ---------- Load & choose columns ----------
        file_path = browse_csv()
        loader = CSVLoader()
        df = loader.load_csv(file_path)
        df = loader.select_columns(df)

        # ---------- Clean ----------
        processor = DataProcessor(loader.X_col, loader.Y_col)
        df_clean = processor.clean(df)

        # ---------- Split (raw), then fit only on TRAIN ----------
        train_df, test_df = processor.split(df_clean, train_frac=0.8, random_state=42, shuffle=True)
        train_norm = processor.fit_transform(train_df)
        test_norm  = processor.transform(test_df)

        # ---------- Arrays for model (normalized space) ----------
        X_train = train_norm['X_norm'].values
        y_train = train_norm['Y_norm'].values
        X_test  = test_norm['X_norm'].values
        y_test  = test_norm['Y_norm'].values

        # ---------- Hyperparameters ----------
        alpha      = ask_float("Enter learning rate (alpha) [default 0.1]: ", 0.1)
        max_epochs = ask_int  ("Enter max epochs [default 100]: ", 100)
        tolerance  = ask_float("Enter tolerance [default 0]: ", 0)

        # ---------- Train ----------
        model = LinearRegressionModel(alpha=alpha, max_epochs=max_epochs, tolerance=tolerance)
        model.train(X_train, y_train)

        # ---------- Test (normalized) ----------
        mse_norm = LinearRegressionModel.mse(y_test, model.predict(X_test))
        print(f"Test MSE (normalized space): {mse_norm}")

        # ---------- Test (original units) ----------
        y_pred_norm = model.predict(X_test)
        y_pred_orig = processor.inverse_y(y_pred_norm)
        y_test_orig = processor.inverse_y(y_test)
        mse_orig = LinearRegressionModel.mse(y_test_orig, y_pred_orig)
        print(f"Test MSE (original scale): {mse_orig}")

        # ---------- Predict a single raw X ----------
        try:
            raw_x = float(input("Enter the value of X (original/raw value): "))
            # Normalize using TRAIN stats, predict in norm space, then denormalize Y
            norm_x = (raw_x - processor.x_mean) / processor.x_std
            norm_y_pred = model.predict_single(norm_x)
            raw_y_pred  = processor.inverse_y(norm_y_pred)
            print(f"Predicted Y (original scale): {raw_y_pred}")
        except ValueError:
            print("Invalid input for X value.")

    except Exception as e:
        print(e)

if __name__ == "__main__":
    main()
