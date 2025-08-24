from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
import pandas as pd
import io
from typing import Dict, Any
import numpy as np
import json
from backend.sklearn_comparison import SklearnComparison

app = FastAPI(title="Linear Regression API", version="1.0.0")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage for session data
session_data: Dict[str, Any] = {}


@app.get("/", response_class=HTMLResponse)
async def root() -> HTMLResponse:
    """Serve the main HTML page"""
    with open("static/index.html", "r") as f:
        return HTMLResponse(content=f.read())


@app.post("/api/process-data")
async def process_data(
    file: UploadFile = File(...),
    x_column: str = Form(...),
    y_column: str = Form(...),
    remove_duplicates: bool = Form(True),
    remove_outliers: bool = Form(False),
    handle_missing: str = Form("remove"),
    remove_strings: bool = Form(True)
):
    """Process CSV data with cleaning options"""
    try:
        print(f"📁 File: {file.filename}, X: {x_column}, Y: {y_column}")
        
        # Read CSV
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Validate columns
        if x_column not in df.columns or y_column not in df.columns:
            raise HTTPException(status_code=400, detail="Columns not found")
        
        # Store data
        session_data['csv_data'] = df
        session_data['columns'] = df.columns.tolist()
        session_data['filename'] = file.filename
        
        # Clean data using CSVLoader
        from backend.csv_loader import CSVLoader
        loader = CSVLoader(x_column, y_column)
        df_clean = loader.clean_data(df, remove_duplicates, remove_outliers, handle_missing, remove_strings)
        
        # Get statistics for visualization
        statistics = loader.get_statistics(df_clean)
        
        # Store results
        session_data['cleaned_data'] = df_clean
        session_data['csv_loader'] = loader
        session_data['cleaning_options'] = {
            'x_column': x_column, 'y_column': y_column,
            'remove_duplicates': remove_duplicates, 'remove_outliers': remove_outliers,
            'handle_missing': handle_missing, 'remove_strings': remove_strings
        }
        
        # Create the response
        response_data = {
            "message": "Data processed successfully!",
            "file_info": {"filename": file.filename, "original_shape": df.shape, "cleaned_shape": df_clean.shape},
            "columns": {"x_column": x_column, "y_column": y_column, "all_columns": df.columns.tolist()},
            "cleaning_summary": loader.get_cleaning_summary(df, df_clean),
            "statistics": {
                "x_data": df_clean[x_column].values.tolist(),
                "y_data": df_clean[y_column].values.tolist(),
                "x_mean": float(df_clean[x_column].mean()),
                "y_mean": float(df_clean[y_column].mean()),
                "x_std": float(df_clean[x_column].std()),
                "y_std": float(df_clean[y_column].std())
            },
            "model_summary": {
                "data_quality": "clean",
                "total_features": 2,
                "data_type": "numerical",
                "ready_for_training": True
            },
            "next_step": "ready_for_training"
        }
        
        # Debug print
        print("=== RESPONSE DATA ===")
        print(f"X data length: {len(response_data['statistics']['x_data'])}")
        print(f"Y data length: {len(response_data['statistics']['y_data'])}")
        print(f"X mean: {response_data['statistics']['x_mean']}")
        print(f"Y mean: {response_data['statistics']['y_mean']}")
        print("====================")
        
        return response_data
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")



# Add this debug endpoint to check what's in session_data
@app.get("/api/debug")
async def debug_session():
    """Debug: Check what's in session_data"""
    cleaning_options = session_data.get('cleaning_options', {})
    return {
        "session_keys": list(session_data.keys()),
        "has_cleaned_data": 'cleaned_data' in session_data,
        "cleaning_options": cleaning_options,
        "x_column": cleaning_options.get('x_column', 'NOT FOUND'),
        "y_column": cleaning_options.get('y_column', 'NOT FOUND'),
        "data_shape": session_data.get('cleaned_data', {}).shape if 'cleaned_data' in session_data else 'No data'
    }


# Clean training endpoint
@app.post("/api/start-training")
async def start_training(
    learning_rate: float = Form(...),
    epochs: int = Form(...),
    tolerance: float = Form(...),
    early_stopping: bool = Form(True),
    train_split: float = Form(0.8),
    training_speed: float = Form(1.0)
) -> StreamingResponse:
    """Start linear regression training."""
    try:
        if 'cleaned_data' not in session_data:
            raise HTTPException(status_code=400, detail="No cleaned data available")
        
        # Get data
        df_clean = session_data['cleaned_data']
        cleaning_options = session_data['cleaning_options']
        x_column = cleaning_options['x_column']
        y_column = cleaning_options['y_column']
        
        x_data = df_clean[x_column].values
        y_data = df_clean[y_column].values
        print(x_data)
        print(y_data)
        # Initialize and setup model
        from backend.linear_regression import LinearRegressionModel
        model = LinearRegressionModel(x_data, y_data)
        split_result = model.train_test_split(train_ratio=train_split)
        model.set_training_data(split_result['x_train'], split_result['y_train'])
        
        x_test = split_result['x_test']
        y_test = split_result['y_test']
        x_train_orig = split_result['x_train']
        y_train_orig = split_result['y_train']
        
        async def training_stream():
            try:
                # Calculate delay based on training speed
                import asyncio
                
                # Map speed to actual delays (in seconds)
                speed_delays = {
                    1.0: 0.1,    # Fast: 100ms between epochs
                    0.8: 0.3,    # Fast-Medium: 300ms between epochs
                    0.6: 0.6,    # Medium: 800ms between epochs
                    0.4: 1,    # Slow: 2s between epochs
                    0.2: 1.5     # Very Slow: 4s between epochs
                }
                
                # Get delay for current speed (snap to nearest valid speed)
                current_speed = min(speed_delays.keys(), key=lambda x: abs(x - training_speed))
                epoch_delay = speed_delays[current_speed]
                
                print(f"🚀 Training with speed {current_speed} (delay: {epoch_delay}s between epochs)")
                
                # Store training state in session for potential pausing/stopping
                session_data['training_active'] = True
                session_data['training_paused'] = False
                session_data['training_model'] = model
                
                for epoch_data in model.train_epoch_by_epoch(
                    learning_rate=learning_rate,
                    max_epochs=epochs,
                    tolerance=tolerance,
                    early_stopping=early_stopping
                ):
                    # Check if training was stopped
                    if not session_data.get('training_active', False):
                        print("🛑 Training stopped by user request")
                        break
                    
                    # Check if training is paused
                    while session_data.get('training_paused', False) and session_data.get('training_active', False):
                        print("⏸️ Training paused - waiting for resume...")
                        await asyncio.sleep(0.5)  # Check every 500ms
                    
                    # Check again if training was stopped while paused
                    if not session_data.get('training_active', False):
                        print("🛑 Training stopped while paused")
                        break
                    
                    # Get original scale parameters
                    original_params = model.get_original_scale_parameters()
                    
                    # Calculate original scale cost every 10 epochs for performance
                    if epoch_data['epoch'] % 10 == 0 or epoch_data['is_complete']:
                        train_predictions = model.predict(x_train_orig)
                        original_cost = np.mean((train_predictions - y_train_orig) ** 2)
                    else:
                        original_cost = epoch_data['cost']  # Use normalized cost
                    
                    response_data = {
                        "epoch": int(epoch_data['epoch']),
                        "max_epochs": int(epoch_data['max_epochs']),
                        "theta0": float(original_params['theta0']),
                        "theta1": float(original_params['theta1']),
                        "cost": float(original_cost),
                        "converged": bool(epoch_data['converged']),
                        "is_complete": bool(epoch_data['is_complete']),
                        # Add performance metrics from backend
                        "rmse": float(epoch_data.get('rmse', 0.0)),
                        "mae": float(epoch_data.get('mae', 0.0)),
                        "r2": float(epoch_data.get('r2', 0.0))
                    }
                    
                    # Send epoch data immediately
                    yield f"data: {json.dumps(response_data)}\n\n"
                    
                    # Add delay between epochs (except for the last one)
                    if not epoch_data['is_complete']:
                        print(f"⏳ Waiting {epoch_delay}s before next epoch...")
                        await asyncio.sleep(epoch_delay)
                
                # Mark training as complete
                session_data['training_active'] = False
                session_data['training_paused'] = False
                
                # Final results
                test_predictions = model.predict(x_test)
                test_mse = np.mean((test_predictions - y_test) ** 2)
                
                ss_res = np.sum((y_test - test_predictions) ** 2)
                ss_tot = np.sum((y_test - np.mean(y_test)) ** 2)
                test_r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
                
                final_params = model.get_original_scale_parameters()
                
                # Get final training metrics
                final_metrics = model.get_latest_metrics()
                metrics_summary = model.get_model_summary()
                
                # Calculate sklearn comparison during training
                print("🔍 Calculating sklearn comparison during training...")
                try:
                    sklearn_comp = SklearnComparison()
                    
                    # Calculate sklearn results on the full dataset
                    sklearn_results = sklearn_comp.calculate_sklearn_results(x_data, y_data)
                    
                    print("✅ Sklearn comparison completed successfully")
                    print(f"🔍 Sklearn results: {sklearn_results}")
                    
                except Exception as e:
                    print(f"⚠️ Warning: Sklearn comparison failed: {e}")
                    print(f"⚠️ Error details: {type(e).__name__}: {str(e)}")
                    import traceback
                    print(f"⚠️ Full traceback: {traceback.format_exc()}")
                    sklearn_results = None
                final_data = {
                    "training_complete": True,
                    "final_theta0": final_params['theta0'],
                    "final_theta1": final_params['theta1'],
                    "equation": f"y = {final_params['theta0']:.4f} + {final_params['theta1']:.4f} * x",
                    "test_mse": test_mse,
                    "test_r2": test_r2,
                    "x_range": [float(np.min(x_data)), float(np.max(x_data))],
                    "y_range": [float(np.min(y_data)), float(np.max(y_data))],
                    # Add final performance metrics
                    "final_rmse": final_metrics.get('rmse', 0.0),
                    "final_mae": final_metrics.get('mae', 0.0),
                    "final_r2": final_metrics.get('r2', 0.0),
                    "metrics_summary": metrics_summary,
                                    # Include sklearn comparison results
                "sklearn_comparison": {
                    "sklearn_results": sklearn_results,
                    "status": "success" if sklearn_results else "failed"
                }
                }
                
                session_data['trained_model'] = model
                print(f"✅ Trained model stored in session_data. Model type: {type(model)}")
                print(f"✅ Session data keys after storing model: {list(session_data.keys())}")
                print(f"✅ Model has metrics_calculator: {hasattr(model, 'metrics_calculator')}")
                if hasattr(model, 'metrics_calculator'):
                    print(f"✅ Metrics calculator type: {type(model.metrics_calculator)}")
                    print(f"✅ Metrics calculator methods: {[method for method in dir(model.metrics_calculator) if not method.startswith('_')]}")
                yield f"data: {json.dumps(final_data)}\n\n"
                
            except Exception as e:
                yield f"data: {json.dumps({'error': True, 'message': str(e)})}\n\n"
        
        return StreamingResponse(training_stream(), media_type="text/plain")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/api/pause-training")
async def pause_training():
    """Pause ongoing training."""
    try:
        if 'training_active' in session_data and session_data['training_active']:
            if not session_data.get('training_paused', False):
                session_data['training_paused'] = True
                print("⏸️ Training pause requested by user")
                return {"message": "Training paused"}
            else:
                return {"message": "Training already paused"}
        else:
            return {"message": "No active training to pause"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to pause training: {str(e)}")

@app.post("/api/resume-training")
async def resume_training():
    """Resume paused training."""
    try:
        if 'training_active' in session_data and session_data['training_active']:
            if session_data.get('training_paused', False):
                session_data['training_paused'] = False
                print("▶️ Training resume requested by user")
                return {"message": "Training resumed"}
            else:
                return {"message": "Training not paused"}
        else:
            return {"message": "No active training to resume"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resume training: {str(e)}")

@app.post("/api/stop-training")
async def stop_training():
    """Stop ongoing training."""
    try:
        if 'training_active' in session_data and session_data['training_active']:
            session_data['training_active'] = False
            session_data['training_paused'] = False
            print("🛑 Training stop requested by user")
            return {"message": "Training stop requested"}
        else:
            return {"message": "No active training to stop"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop training: {str(e)}")     
# Optional: Add endpoint to get model predictions for visualization
@app.post("/api/get-predictions")
async def get_predictions(
    x_values: list = Form(...),  # List of X values to predict
) -> dict:
    """Get model predictions for visualization."""
    try:
        if 'trained_model' not in session_data:
            raise HTTPException(status_code=400, detail="No trained model available")
        
        model = session_data['trained_model']
        x_array = np.array(x_values, dtype=float)
        predictions = model.predict(x_array)
        
        return {
            "x_values": x_values,
            "predictions": predictions.tolist(),
            "equation": f"y = {model.get_original_scale_parameters()['theta0']:.4f} + {model.get_original_scale_parameters()['theta1']:.4f} * x"
        }
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/api/debug-session")
async def debug_session() -> dict:
    """Debug endpoint to check what's in session_data."""
    try:
        return {
            "session_keys": list(session_data.keys()),
            "has_trained_model": 'trained_model' in session_data,
            "has_cleaned_data": 'cleaned_data' in session_data,
            "has_training_model": 'training_model' in session_data,
            "training_active": session_data.get('training_active', False),
            "training_paused": session_data.get('training_paused', False),
            "session_size": len(str(session_data))
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)