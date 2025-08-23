import os
import sqlite3
import uuid
from datetime import datetime

DB_FILE = "model/models1.db"

class ModelStorage:
    """
    SQLite storage for trained models.
    Stores θ0, θ1, metadata, and user_id for ownership.
    """

    def __init__(self, db_file: str = DB_FILE):
        self.db_file = db_file
        # Ensure directory exists if a path is provided
        os.makedirs(os.path.dirname(db_file), exist_ok=True) if os.path.dirname(db_file) else None
        self.conn = sqlite3.connect(db_file, check_same_thread=False)
        self._create_table()

    def _create_table(self):
        query = """
        CREATE TABLE IF NOT EXISTS models (
            model_id    TEXT PRIMARY KEY,
            user_id     TEXT,
            file_path   TEXT,
            x_col       TEXT,
            y_col       TEXT,
            theta0      REAL,
            theta1      REAL,
            created_at  TEXT,
            epochs      INTEGER,
            tolerance   REAL
        );
        """
        self.conn.execute(query)
        self.conn.commit()

    def add_model(
        self,
        user_id: str,
        file_path: str,
        x_col: str,
        y_col: str,
        theta0: float,
        theta1: float,
        epochs: int,
        tolerance: float
    ) -> str:
        model_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()

        query = """
        INSERT INTO models (model_id, user_id, file_path, x_col, y_col,
                            theta0, theta1, created_at, epochs, tolerance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        self.conn.execute(
            query,
            (model_id, user_id, file_path, x_col, y_col,
             float(theta0), float(theta1), created_at, int(epochs), float(tolerance))
        )
        self.conn.commit()
        return model_id

    def get_model(self, model_id: str) -> dict | None:
        query = "SELECT * FROM models WHERE model_id=?"
        cursor = self.conn.execute(query, (model_id,))
        row = cursor.fetchone()
        if row:
            return {
                "model_id":  row[0],
                "user_id":   row[1],
                "file_path": row[2],
                "x_col":     row[3],
                "y_col":     row[4],
                "theta0":    row[5],
                "theta1":    row[6],
                "created_at":row[7],
                "epochs":    row[8],
                "tolerance": row[9],
            }
        return None

    def list_models(self, user_id: str | None = None):
        if user_id:
            query = "SELECT model_id, x_col, y_col, created_at FROM models WHERE user_id=?"
            cursor = self.conn.execute(query, (user_id,))
        else:
            query = "SELECT model_id, x_col, y_col, created_at FROM models"
            cursor = self.conn.execute(query)
        return cursor.fetchall()

    def close(self):
        try:
            self.conn.close()
        except:
            pass
