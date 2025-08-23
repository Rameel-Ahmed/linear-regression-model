# data_processor.py
import numpy as np
import pandas as pd
from typing import Tuple

class DataProcessor:
    """
    Encapsulation:
      - Keeps normalization stats private.
    Abstraction:
      - Exposes clean(), split(), fit(), transform(), inverse_y().
    Composition:
      - Works with DataFrames; other classes use this processor.
    """

    def __init__(self, x_col: str, y_col: str):
        self.x_col = x_col
        self.y_col = y_col

        # Private (name-mangled) stats; access via properties
        self.__x_mean: float | None = None
        self.__x_std: float | None = None
        self.__y_mean: float | None = None
        self.__y_std: float | None = None

    # ---------- Properties (read-only view of private state) ----------
    @property
    def x_mean(self) -> float: return self.__x_mean
    @property
    def x_std(self) -> float:  return self.__x_std
    @property
    def y_mean(self) -> float: return self.__y_mean
    @property
    def y_std(self) -> float:  return self.__y_std

    # ---------- Cleaning ----------
    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        try:
            df = df.drop_duplicates()
            df = df.copy()
            df[self.x_col] = pd.to_numeric(df[self.x_col], errors='coerce')
            df[self.y_col] = pd.to_numeric(df[self.y_col], errors='coerce')
            df = df.dropna()
            if df.empty:
                raise ValueError("Data is empty after cleaning.")
            print("Data cleaned successfully!")
            return df
        except Exception as e:
            raise RuntimeError(f"Error cleaning data: {e}")

    # ---------- Split (raw df) ----------
    def split(self, df: pd.DataFrame, train_frac: float = 0.8,
            random_state: int = 42, shuffle: bool = True):
        if not (0 < train_frac <= 1.0):
            raise ValueError("train_frac must be between 0 and 1.")

        if shuffle:
            df = df.sample(frac=1, random_state=random_state).reset_index(drop=True)

        train_size = int(train_frac * len(df))

        if train_size == len(df):  # edge case: 100% training
            train_df = df.copy()
            test_df = pd.DataFrame(columns=df.columns)  # empty test set
            print(f"Split: train={len(train_df)}, test=0 (all data used for training)")
        else:
            train_df = df.iloc[:train_size].copy()
            test_df = df.iloc[train_size:].copy()
            print(f"Split: train={len(train_df)}, test={len(test_df)}")

        return train_df, test_df

    # ---------- Fit/train-only stats ----------
    def fit(self, train_df: pd.DataFrame) -> None:
        self.__x_mean = float(train_df[self.x_col].mean())
        self.__x_std  = float(train_df[self.x_col].std())
        self.__y_mean = float(train_df[self.y_col].mean())
        self.__y_std  = float(train_df[self.y_col].std())

        if np.isclose(self.__x_std, 0.0):
            raise ValueError("Std of X is zero; cannot normalize.")
        if np.isclose(self.__y_std, 0.0):
            raise ValueError("Std of Y is zero; cannot normalize.")

        print("Fitted normalization stats on TRAIN only.")

    # ---------- Transform (use stored stats) ----------
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        if any(v is None for v in [self.__x_mean, self.__x_std, self.__y_mean, self.__y_std]):
            raise RuntimeError("Processor is not fitted. Call fit(train_df) first.")

        out = df.copy()
        out['X_norm'] = (out[self.x_col] - self.__x_mean) / self.__x_std
        out['Y_norm'] = (out[self.y_col] - self.__y_mean) / self.__y_std
        return out

    def fit_transform(self, train_df: pd.DataFrame) -> pd.DataFrame:
        self.fit(train_df)
        return self.transform(train_df)

    # ---------- Inverse transform for Y ----------
    def inverse_y(self, y_norm):
        """Convert normalized y back to original scale (uses TRAIN stats)."""
        return (np.asarray(y_norm, dtype=float) * self.__y_std) + self.__y_mean

    # ---------- (Optional) helper as static method ----------
    @staticmethod
    def zscore(series: pd.Series, mean: float, std: float) -> pd.Series:
        return (series - mean) / std
