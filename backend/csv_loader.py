"""
CSV Loader for Backend Data Processing.
Simple and clean.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any


class CSVLoader:
    """Handles CSV data cleaning operations."""
    
    def __init__(self, x_column: str, y_column: str):
        self._x_column = x_column
        self._y_column = y_column
    
    @property
    def x_column(self) -> str:
        return self._x_column
    
    @property
    def y_column(self) -> str:
        return self._y_column
    
    def clean_data(self, df: pd.DataFrame, remove_duplicates: bool = True, 
                   remove_outliers: bool = False, handle_missing: str = "remove",
                   remove_strings: bool = True) -> pd.DataFrame:
        """Clean data based on user preferences."""
        df_clean = df.copy()
        original_count = len(df_clean)
        
        print(f"🧹 Cleaning data: {original_count} rows")
        
        # Remove strings first
        if remove_strings:
            df_clean = self._remove_string_rows(df_clean)
        
        # Handle missing values
        if handle_missing == "mean":
            df_clean[self._x_column].fillna(df_clean[self._x_column].mean(), inplace=True)
            df_clean[self._y_column].fillna(df_clean[self._y_column].mean(), inplace=True)
        else:
            df_clean = df_clean.dropna(subset=[self._x_column, self._y_column])
        
        # Remove duplicates
        if remove_duplicates:
            df_clean = df_clean.drop_duplicates()
        
        # Remove outliers
        if remove_outliers:
            df_clean = self._remove_outliers(df_clean)
        
        # Convert to numeric
        df_clean[self._x_column] = pd.to_numeric(df_clean[self._x_column], errors='coerce')
        df_clean[self._y_column] = pd.to_numeric(df_clean[self._y_column], errors='coerce')
        
        final_count = len(df_clean)
        print(f"✅ Cleaning complete: {original_count} → {final_count} rows")
        
        return df_clean
    
    def _remove_string_rows(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove rows with string values."""
        x_numeric = pd.to_numeric(df[self._x_column], errors='coerce')
        y_numeric = pd.to_numeric(df[self._y_column], errors='coerce')
        return df[x_numeric.notna() & y_numeric.notna()]
    
    def _remove_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove outliers using IQR method."""
        Q1 = df[self._x_column].quantile(0.25)
        Q3 = df[self._x_column].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        return df[(df[self._x_column] >= lower) & (df[self._x_column] <= upper)]
    
    def get_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get basic statistics for X and Y columns."""
        return {
            'x_stats': {
                'mean': float(df[self._x_column].mean()),
                'std': float(df[self._x_column].std()),
                'min': float(df[self._x_column].min()),
                'max': float(df[self._x_column].max())
            },
            'y_stats': {
                'mean': float(df[self._y_column].mean()),
                'std': float(df[self._y_column].std()),
                'min': float(df[self._y_column].min()),
                'max': float(df[self._y_column].max())
            }
        }
    
    def get_cleaning_summary(self, original_df: pd.DataFrame, cleaned_df: pd.DataFrame) -> Dict[str, Any]:
        """Get summary of cleaning operations."""
        return {
            "original_rows": len(original_df),
            "cleaned_rows": len(cleaned_df),
            "rows_removed": len(original_df) - len(cleaned_df),
            "x_column": self._x_column,
            "y_column": self._y_column
        }
