# csv_loader.py
import pandas as pd
from typing import Optional

class CSVLoader:
    """
    Encapsulation + Abstraction:
    - Hides how CSV is read/validated.
    - Exposes simple methods to load and choose columns.
    """

    def __init__(self):
        self._x_col: Optional[str] = None
        self._y_col: Optional[str] = None

    @property
    def X_col(self) -> str:
        return self._x_col

    @property
    def Y_col(self) -> str:
        return self._y_col

    def load_csv(self, file_path: str) -> pd.DataFrame:
        try:
            df = pd.read_csv(file_path)
            print("CSV loaded successfully!")
            return df
        except Exception as e:
            raise RuntimeError(f"Error reading CSV: {e}")

    @staticmethod
    def list_columns(df: pd.DataFrame) -> None:
        print("\nAvailable columns in CSV:")
        for idx, col in enumerate(df.columns):
            print(f"{idx + 1}. {col}")

    def select_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        self.list_columns(df)
        try:
            x_choice = int(input("Enter the number of the column to use as X(Input): ")) - 1
            y_choice = int(input("Enter the number of the column to use as Y(Output): ")) - 1
            self._x_col = df.columns[x_choice]
            self._y_col = df.columns[y_choice]
            print(f"Selected X: {self._x_col}, Y: {self._y_col}")
        except Exception as e:
            raise ValueError(f"Invalid selection: {e}")

        return df[[self._x_col, self._y_col]]
