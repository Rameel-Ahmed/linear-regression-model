// Global variables
let trainingResults = null;
let modelData = null;
let batchPredictions = [];

// Sidebar toggle functionality
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    console.log('🔍 Sidebar toggle setup:', { sidebarToggle, sidebar, mainContent });
    
    if (sidebarToggle && sidebar && mainContent) {
        console.log('✅ Sidebar toggle elements found, adding event listeners');
        
        sidebarToggle.addEventListener('click', () => {
            console.log('🔄 Sidebar toggle clicked');
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('sidebar-collapsed');
            
            // Update button text based on state
            if (sidebar.classList.contains('collapsed')) {
                sidebarToggle.textContent = '→'; // Arrow right when collapsed
            } else {
                sidebarToggle.textContent = '☰'; // Hamburger when expanded
            }
            
            console.log('📱 Sidebar collapsed:', sidebar.classList.contains('collapsed'));
        });
    } else {
        console.error('❌ Sidebar toggle elements not found:', { sidebarToggle, sidebar, mainContent });
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    setupSidebarToggle();
    initializeTheme();
    loadTrainingResults();
    setupEventListeners();
    displayModelSummary();
});

function initializeTheme() {
    const themeBtn = document.getElementById('themeBtn');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeBtn) {
        themeBtn.textContent = savedTheme === 'light' ? '🌙' : '☀️';
        themeBtn.onclick = function() {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.textContent = newTheme === 'light' ? '🌙' : '☀️';
        };
    }
}

async function loadTrainingResults() {
    try {
        // Load comprehensive results from localStorage
        const comprehensiveResults = localStorage.getItem('comprehensiveResults');
        
        if (!comprehensiveResults) {
            alert('No comprehensive results found. Please complete training and click "View Results Summary" first.');
            window.location.href = 'training.html';
            return;
        }
        
        // Parse comprehensive data
        const comprehensiveData = JSON.parse(comprehensiveResults);
        console.log('📊 Comprehensive results loaded:', comprehensiveData);
        
        // Store all data
        trainingResults = comprehensiveData.trainingData;
        window.sklearnResults = comprehensiveData.sklearnResults;
        
        // Display all results
        displayModelSummary();
        
        // Display sklearn comparison if available
        if (comprehensiveData.sklearnResults && comprehensiveData.sklearnResults.sklearn_results) {
            displaySklearnComparison(comprehensiveData.sklearnResults);
        } else if (comprehensiveData.sklearnResults === null) {
            displaySklearnError('Sklearn comparison was not available during training');
        } else {
            // Try to get sklearn comparison from the training data
            const trainingData = JSON.parse(comprehensiveData.allTrainingData);
            if (trainingData.sklearn_comparison) {
                console.log('🔍 Found sklearn comparison in training data:', trainingData.sklearn_comparison);
                displaySklearnComparison(trainingData.sklearn_comparison);
            } else {
                displaySklearnError('Sklearn comparison not found in training data');
            }
        }
        
        console.log('✅ All results displayed successfully');
        
        // Debug: Show what's actually in localStorage
        console.log('🔍 Debug: localStorage contents:');
        console.log('- comprehensiveResults:', localStorage.getItem('comprehensiveResults'));
        console.log('- allTrainingData:', localStorage.getItem('allTrainingData'));
        console.log('- trainingParams:', localStorage.getItem('trainingParams'));
        

        
    } catch (error) {
        console.error('❌ Error loading comprehensive results:', error);
        alert('Error loading results. Please try again.');
        window.location.href = 'training.html';
    }
}

function displaySklearnError(errorMessage) {
    try {
        console.log('⚠️ Displaying sklearn error:', errorMessage);
        
        // Create error section
        const errorSection = document.createElement('div');
        errorSection.className = 'card error-card';
        errorSection.innerHTML = `
            <h3>⚠️ Sklearn Comparison Unavailable</h3>
            <div class="error-message">
                <p><strong>Error:</strong> ${errorMessage}</p>
                <p>This usually happens when:</p>
                <ul>
                    <li>Training was not completed properly</li>
                    <li>Backend session data was cleared</li>
                    <li>There was a server error</li>
                </ul>
                <p>You can still view your training results below.</p>
            </div>
        `;
        
        // Find where to insert the error section
        const resultsLeft = document.querySelector('.results-left');
        if (resultsLeft) {
            // Insert after the model summary card
            const modelSummaryCard = resultsLeft.querySelector('.model-summary-card');
            if (modelSummaryCard && modelSummaryCard.nextSibling) {
                resultsLeft.insertBefore(errorSection, modelSummaryCard.nextSibling);
            } else {
                resultsLeft.appendChild(errorSection);
            }
        }
        
    } catch (error) {
        console.error('❌ Error displaying sklearn error:', error);
    }
}





function displaySklearnComparison(sklearnResults) {
    try {
        console.log('📊 Displaying sklearn comparison:', sklearnResults);
        
        // Extract sklearn model data from the new structure
        const sklearnModel = sklearnResults.sklearn_results;
        const comparisonAnalysis = sklearnResults.comparison_analysis;
        
        if (sklearnModel) {
            // Add sklearn equation to the model summary
            const sklearnEquation = document.createElement('div');
            sklearnEquation.className = 'sklearn-equation';
            sklearnEquation.innerHTML = `
                <h4>🤖 Sklearn Model</h4>
                <div class="equation-display">${sklearnModel.equation}</div>
                <div class="sklearn-metrics">
                    <div class="metric-item">
                        <div class="metric-value">${sklearnModel.r2?.toFixed(4) || 'N/A'}</div>
                        <div class="metric-label">Sklearn R²</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${sklearnModel.rmse?.toFixed(4) || 'N/A'}</div>
                        <div class="metric-label">Sklearn RMSE</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${sklearnModel.cost?.toFixed(6) || 'N/A'}</div>
                        <div class="metric-label">Sklearn MAE</div>
                    </div>
                </div>
            `;
            
            // Find the model summary card and add sklearn comparison
            const modelSummaryCard = document.querySelector('.model-summary-card');
            if (modelSummaryCard) {
                // Check if sklearn comparison already exists
                const existingSklearn = modelSummaryCard.querySelector('.sklearn-equation');
                if (existingSklearn) {
                    existingSklearn.remove();
                }
                modelSummaryCard.appendChild(sklearnEquation);
            }
            
            // Display comparison analysis if available
            if (comparisonAnalysis) {
                displayComparisonAnalysis(comparisonAnalysis);
            }
        }
        
    } catch (error) {
        console.error('❌ Error displaying sklearn comparison:', error);
    }
}

function displayComparisonAnalysis(comparison) {
    try {
        console.log('📊 Displaying comparison analysis:', comparison);
        
        // Create comparison section
        const comparisonSection = document.createElement('div');
        comparisonSection.className = 'card comparison-card';
        comparisonSection.innerHTML = `
            <h3>🔍 Model Comparison Analysis</h3>
            <div class="comparison-grid">
                <div class="comparison-item">
                    <h4>📉 RMSE Comparison</h4>
                    <div class="comparison-metrics">
                        <div class="metric-row">
                            <span>Custom Model:</span>
                            <span class="metric-value">${comparison.rmse_comparison?.custom_rmse?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="metric-row">
                            <span>Sklearn Model:</span>
                            <span class="metric-value">${comparison.rmse_comparison?.sklearn_rmse?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="metric-row winner">
                            <span>Winner:</span>
                            <span class="winner-badge ${comparison.rmse_comparison?.better_model || 'tie'}">${comparison.rmse_comparison?.better_model?.toUpperCase() || 'TIE'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="comparison-item">
                    <h4>🎯 R² Comparison</h4>
                    <div class="comparison-metrics">
                        <div class="metric-row">
                            <span>Custom Model:</span>
                            <span class="metric-value">${comparison.r2_comparison?.custom_r2?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="metric-row">
                            <span>Sklearn Model:</span>
                            <span>${comparison.r2_comparison?.sklearn_r2?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="metric-row winner">
                            <span>Winner:</span>
                            <span class="winner-badge ${comparison.r2_comparison?.better_model || 'tie'}">${comparison.r2_comparison?.better_model?.toUpperCase() || 'TIE'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="overall-winner">
                <h4>🏆 Overall Assessment</h4>
                <div class="winner-display">
                    <span class="winner-label">Best Model:</span>
                    <span class="winner-badge ${comparison.overall_assessment?.winner || 'tie'}">${comparison.overall_assessment?.winner?.toUpperCase() || 'TIE'}</span>
                </div>
                <div class="score-display">
                    <span>Custom: ${comparison.overall_assessment?.custom_score || 0}</span>
                    <span>Sklearn: ${comparison.overall_assessment?.sklearn_score || 0}</span>
                </div>
            </div>
        `;
        
        // Find where to insert the comparison section
        const resultsLeft = document.querySelector('.results-left');
        if (resultsLeft) {
            // Insert after the model summary card
            const modelSummaryCard = resultsLeft.querySelector('.model-summary-card');
            if (modelSummaryCard && modelSummaryCard.nextSibling) {
                resultsLeft.insertBefore(comparisonSection, modelSummaryCard.nextSibling);
            } else {
                resultsLeft.appendChild(comparisonSection);
            }
        }
        
    } catch (error) {
        console.error('❌ Error displaying comparison analysis:', error);
    }
}

function generateMockResults() {
    // Generate realistic mock results for demo purposes
    const validData = trainingResults.csvData.filter(row => 
        typeof row[trainingResults.xColumn] === 'number' && 
        typeof row[trainingResults.yColumn] === 'number'
    );
    
    const xValues = validData.map(row => row[trainingResults.xColumn]);
    const yValues = validData.map(row => row[trainingResults.yColumn]);
    
    // Simple linear regression calculation for mock
    const n = xValues.length;
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
        numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
        denominator += (xValues[i] - xMean) * (xValues[i] - xMean);
    }
    
    const theta1 = numerator / denominator;
    const theta0 = yMean - theta1 * xMean;
    
    // Calculate R²
    let totalSumSquares = 0;
    let residualSumSquares = 0;
    
    for (let i = 0; i < n; i++) {
        const predicted = theta0 + theta1 * xValues[i];
        totalSumSquares += (yValues[i] - yMean) * (yValues[i] - yMean);
        residualSumSquares += (yValues[i] - predicted) * (yValues[i] - predicted);
    }
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    
    modelData = {
        theta0: theta0,
        theta1: theta1,
        rSquared: Math.max(0, Math.min(1, rSquared)), // Clamp between 0 and 1
        finalCost: Math.random() * 0.001 + 0.0001, // Random small cost
        totalEpochs: Math.floor(Math.random() * 1500) + 500,
        trainingTime: Math.floor(Math.random() * 120) + 30, // 30-150 seconds
        sklearnR2: Math.max(0, Math.min(1, rSquared + (Math.random() * 0.02 - 0.01))) // Slightly different
    };
}

function setupEventListeners() {
    // Prediction inputs
    document.getElementById('predictSingle')?.addEventListener('click', makeSinglePrediction);
    document.getElementById('clearSingle')?.addEventListener('click', clearSinglePrediction);
    
    // Batch upload
    const batchUploadZone = document.getElementById('batchUploadZone');
    const batchFileInput = document.getElementById('batchFileInput');
    
    if (batchUploadZone && batchFileInput) {
        batchUploadZone.onclick = () => batchFileInput.click();
        batchUploadZone.ondragover = handleBatchDragOver;
        batchUploadZone.ondragleave = handleBatchDragLeave;
        batchUploadZone.ondrop = handleBatchDrop;
        batchFileInput.onchange = handleBatchFileSelect;
    }
    
    // Download buttons
    document.getElementById('downloadPDF')?.addEventListener('click', downloadPDFReport);
    document.getElementById('downloadCSV')?.addEventListener('click', downloadCSVResults);
    document.getElementById('downloadBatchResults')?.addEventListener('click', downloadBatchPredictions);
    
    // Enter key for single prediction
    document.getElementById('xValue')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            makeSinglePrediction();
        }
    });
}

function displayModelSummary() {
    try {
        console.log('📊 Displaying model summary...');
        
        // Get comprehensive results
        const comprehensiveResults = JSON.parse(localStorage.getItem('comprehensiveResults') || '{}');
        console.log('🔍 Comprehensive results structure:', comprehensiveResults);
        
        // The training response structure has changed - look for the new structure
        if (!comprehensiveResults.allTrainingData) {
            console.warn('⚠️ No allTrainingData found in comprehensive results');
            return;
        }
        
        // Parse the allTrainingData to get the clean training data structure
        const trainingData = JSON.parse(comprehensiveResults.allTrainingData);
        console.log('🔍 Clean training data structure:', trainingData);
        
        // Extract data directly from the clean structure
        const finalTheta0 = trainingData.final_theta0;
        const finalTheta1 = trainingData.final_theta1;
        const equation = trainingData.equation;
        const finalRmse = trainingData.final_rmse;
        const finalMae = trainingData.final_mae;
        const finalR2 = trainingData.final_r2;
        const testMse = trainingData.test_mse;
        const testR2 = trainingData.test_r2;
        const totalEpochs = trainingData.total_epochs;
        const xColumn = trainingData.x_column;
        const yColumn = trainingData.y_column;
        
        // Training parameters
        const learningRate = trainingData.learning_rate;
        const epochs = trainingData.epochs;
        const tolerance = trainingData.tolerance;
        const earlyStopping = trainingData.early_stopping;
        const trainingSpeed = trainingData.training_speed;
        const trainSplit = trainingData.train_split;

        
        console.log('🔍 Extracted values:', {
            finalTheta0, finalTheta1, equation, finalRmse, finalMae, finalR2, testMse, testR2
        });
        
        // Get training parameters
        const params = comprehensiveResults.trainingParams;
        
        // Update equation displays
        const equationDisplay = document.getElementById('finalEquation');
        if (equationDisplay && equation) {
            equationDisplay.textContent = equation;
        }
        
        const predictionEquationDisplay = document.getElementById('predictionEquation');
        if (predictionEquationDisplay && equation) {
            predictionEquationDisplay.textContent = equation;
        }
        
        // Set modelData for predictions
        modelData = {
            theta0: finalTheta0,
            theta1: finalTheta1,
            equation: equation
        };
        
        // Update metrics - REPLACE the hardcoded values with real data
        const rSquared = document.getElementById('rSquared');
        if (rSquared) {
            rSquared.textContent = finalR2 ? finalR2.toFixed(4) : 'N/A';
        }
        
        const finalRmseElement = document.getElementById('finalRmse');
        if (finalRmseElement) {
            finalRmseElement.textContent = finalRmse ? finalRmse.toFixed(6) : 'N/A';
        }
        
        const finalMaeElement = document.getElementById('finalMae');
        if (finalMaeElement) {
            finalMaeElement.textContent = finalMae ? finalMae.toFixed(6) : 'N/A';
        }
        

        
        const totalEpochsElement = document.getElementById('totalEpochs');
        if (totalEpochsElement) {
            totalEpochsElement.textContent = totalEpochs || 'N/A';
        }
        

        
        // Update training parameters
        const learningRateValue = document.getElementById('learningRateValue');
        if (learningRateValue && learningRate) {
            learningRateValue.textContent = learningRate;
        }
        
        const toleranceValue = document.getElementById('toleranceValue');
        if (toleranceValue && tolerance) {
            toleranceValue.textContent = tolerance;
        }
        
        // Update other training parameters
        const epochsValue = document.getElementById('epochsValue');
        if (epochsValue && epochs) {
            epochsValue.textContent = epochs;
        }
        
        const earlyStoppingValue = document.getElementById('earlyStoppingValue');
        if (earlyStoppingValue && earlyStopping !== undefined) {
            earlyStoppingValue.textContent = earlyStopping ? 'Yes' : 'No';
        }
        
        const trainingSpeedValue = document.getElementById('trainingSpeedValue');
        if (trainingSpeedValue && trainingSpeed !== undefined) {
            trainingSpeedValue.textContent = trainingSpeed;
        }
        
        // Update column names
        const xColumnValue = document.getElementById('xColumnValue');
        if (xColumnValue && xColumn) {
            xColumnValue.textContent = xColumn;
        }
        
        const yColumnValue = document.getElementById('yColumnValue');
        if (yColumnValue && yColumn) {
            yColumnValue.textContent = yColumn;
        }
        

        
        // Update train split if available
        const trainSplitElement = document.getElementById('trainSplit');
        if (trainSplitElement && trainSplit) {
            trainSplitElement.textContent = `${(trainSplit * 100).toFixed(0)}%`;
        }
        
        // Update column names
        const xColumnDisplay = document.getElementById('xColumn');
        if (xColumnDisplay) {
            xColumnDisplay.textContent = xColumn || 'X';
        }
        
        const yColumnDisplay = document.getElementById('yColumn');
        if (yColumnDisplay) {
            yColumnDisplay.textContent = yColumn || 'Y';
        }
        
        // Update sklearn comparison values if available
        if (comprehensiveResults.sklearnResults && comprehensiveResults.sklearnResults.sklearn_results) {
            const sklearnModel = comprehensiveResults.sklearnResults.sklearn_results;
            
            // Update our model metrics in comparison table
            const ourModelR2 = document.getElementById('ourModelR2');
            if (ourModelR2) {
                ourModelR2.textContent = finalR2 ? finalR2.toFixed(4) : 'N/A';
            }
            
            const ourModelRmse = document.getElementById('ourModelRmse');
            if (ourModelRmse) {
                ourModelRmse.textContent = finalRmse ? finalRmse.toFixed(6) : 'N/A';
            }
            
            const ourModelMae = document.getElementById('ourModelMae');
            if (ourModelMae) {
                ourModelMae.textContent = finalMae ? finalMae.toFixed(6) : 'N/A';
            }
            
            const ourModelEquation = document.getElementById('ourModelEquation');
            if (ourModelEquation) {
                ourModelEquation.textContent = equation || 'N/A';
            }
            
            // Update sklearn model metrics in comparison table
            const sklearnR2 = document.getElementById('sklearnR2');
            if (sklearnR2) {
                sklearnR2.textContent = sklearnModel.r2 ? sklearnModel.r2.toFixed(4) : 'N/A';
            }
            
            const sklearnRmse = document.getElementById('sklearnRmse');
            if (sklearnRmse) {
                sklearnRmse.textContent = sklearnModel.rmse ? sklearnModel.rmse.toFixed(6) : 'N/A';
            }
            
            const sklearnMae = document.getElementById('sklearnMae');
            if (sklearnMae) {
                sklearnMae.textContent = sklearnModel.cost ? sklearnModel.cost.toFixed(6) : 'N/A';
            }
            
            const sklearnEquation = document.getElementById('sklearnEquation');
            if (sklearnEquation) {
                sklearnEquation.textContent = sklearnModel.equation || 'N/A';
            }
            
            // Update comparison note
            const comparisonNote = document.getElementById('comparisonNote');
            if (comparisonNote) {
                if (finalR2 && sklearnModel.r2) {
                    if (finalR2 > sklearnModel.r2) {
                        comparisonNote.textContent = 'Our custom model performed better! 🎯';
                    } else if (finalR2 < sklearnModel.r2) {
                        comparisonNote.textContent = 'Sklearn model performed better 🤖';
                    } else {
                        comparisonNote.textContent = 'Both models performed equally well! 🎉';
                    }
                } else {
                    comparisonNote.textContent = 'Model comparison available';
                }
            }
        } else {
            // Try to get sklearn comparison from training data
            if (trainingData.sklearn_comparison) {
                console.log('🔍 Displaying sklearn comparison from training data');
                displaySklearnComparison(trainingData.sklearn_comparison);
            }
        }
        
                // Display sklearn comparison in the model summary card
        if (trainingData.sklearn_comparison && trainingData.sklearn_comparison.sklearn_results) {
            const sklearnModel = trainingData.sklearn_comparison.sklearn_results;
            
            console.log('🔍 Sklearn model data:', sklearnModel);
            console.log('🔍 Sklearn R² value:', sklearnModel.r2);
            console.log('🔍 Sklearn R² type:', typeof sklearnModel.r2);
            
            // Create sklearn comparison section
            const sklearnSection = document.createElement('div');
            sklearnSection.className = 'sklearn-comparison';
            sklearnSection.innerHTML = `
                <h4>🤖 Sklearn Model</h4>
                <div class="comparison-grid">
                    <div class="comparison-item">
                        <div class="comparison-label">θ₀ (Intercept)</div>
                        <div class="comparison-value">${sklearnModel.theta0 ? sklearnModel.theta0.toFixed(6) : 'N/A'}</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">θ₁ (Coefficient)</div>
                        <div class="comparison-value">${sklearnModel.theta1 ? sklearnModel.theta1.toFixed(6) : 'N/A'}</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">R²</div>
                        <div class="comparison-value">${sklearnModel.r2 ? sklearnModel.r2.toFixed(4) : 'N/A'}</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">RMSE</div>
                        <div class="comparison-value">${sklearnModel.rmse ? sklearnModel.rmse.toFixed(6) : 'N/A'}</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">Equation</div>
                        <div class="comparison-value equation">${sklearnModel.equation || 'N/A'}</div>
                    </div>
                </div>
            `;
            
            // Find the model summary card and add sklearn comparison
            const modelSummaryCard = document.querySelector('.model-summary-card');
            if (modelSummaryCard) {
                // Remove existing sklearn comparison if any
                const existingSklearn = modelSummaryCard.querySelector('.sklearn-comparison');
                if (existingSklearn) {
                    existingSklearn.remove();
                }
                modelSummaryCard.appendChild(sklearnSection);
            }
        }
        
        console.log('✅ Model summary displayed with training response data');
        
    } catch (error) {
        console.error('❌ Error displaying model summary:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Stack trace:', error.stack);
    }
}

function makeSinglePrediction() {
    console.log('🔮 Making single prediction...');
    console.log('🔮 modelData:', modelData);
    
    const xInput = document.getElementById('xValue');
    const resultDiv = document.getElementById('predictionResult');
    const predictedValueSpan = document.getElementById('predictedValue');
    
    console.log('🔮 Elements found:', { xInput, resultDiv, predictedValueSpan });
    
    if (!xInput || !modelData) {
        console.error('❌ Missing required data:', { xInput: !!xInput, modelData: !!modelData });
        return;
    }
    
    const xValue = parseFloat(xInput.value);
    console.log('🔮 X value entered:', xValue);
    
    if (isNaN(xValue)) {
        alert('Please enter a valid number for X value');
        return;
    }
    
    // Make prediction using trained model
    const prediction = modelData.theta0 + modelData.theta1 * xValue;
    console.log('🔮 Prediction calculated:', prediction, 'using theta0:', modelData.theta0, 'theta1:', modelData.theta1);
    
    predictedValueSpan.textContent = prediction.toFixed(4);
    resultDiv.style.display = 'block';
    
    console.log('🔮 Prediction result displayed');
    
    // Scroll to result
    setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function clearSinglePrediction() {
    document.getElementById('xValue').value = '';
    document.getElementById('predictionResult').style.display = 'none';
}

// Batch prediction functions
function handleBatchDragOver(e) {
    e.preventDefault();
    document.getElementById('batchUploadZone').classList.add('dragover');
}

function handleBatchDragLeave(e) {
    e.preventDefault();
    document.getElementById('batchUploadZone').classList.remove('dragover');
}

function handleBatchDrop(e) {
    e.preventDefault();
    document.getElementById('batchUploadZone').classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.csv')) {
        processBatchFile(files[0]);
    }
}

function handleBatchFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processBatchFile(file);
    }
}

function processBatchFile(file) {
    if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        parseBatchCSV(e.target.result);
    };
    reader.readAsText(file);
}

function parseBatchCSV(csvText) {
    try {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            alert('CSV must have at least 2 rows (header + data)');
            return;
        }
        
        // Parse data (assuming X values in first column)
        const xValues = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
            const xValue = parseFloat(values[0]);
            if (!isNaN(xValue)) {
                xValues.push(xValue);
            }
        }
        
        if (xValues.length === 0) {
            alert('No valid numeric X values found in the first column');
            return;
        }
        
        // Make batch predictions
        batchPredictions = xValues.map(x => ({
            x: x,
            y: modelData.theta0 + modelData.theta1 * x
        }));
        
        displayBatchResults();
        
    } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
    }
}

function displayBatchResults() {
    const resultsDiv = document.getElementById('batchResults');
    const countSpan = document.getElementById('batchCount');
    const tableBody = document.getElementById('batchTableBody');
    
    countSpan.textContent = `${batchPredictions.length} predictions made`;
    
    // Show preview (first 10 rows)
    const previewData = batchPredictions.slice(0, 10);
    tableBody.innerHTML = previewData.map(pred => 
        `<tr>
            <td>${pred.x.toFixed(4)}</td>
            <td>${pred.y.toFixed(4)}</td>
        </tr>`
    ).join('');
    
    if (batchPredictions.length > 10) {
        tableBody.innerHTML += `<tr><td colspan="2" style="text-align: center; font-style: italic;">... and ${batchPredictions.length - 10} more rows</td></tr>`;
    }
    
    resultsDiv.style.display = 'block';
    
    // Scroll to results
    setTimeout(() => {
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// Download functions
function downloadPDFReport() {
    // Mock API call - replace with actual endpoint
    try {
        alert('PDF report download initiated! (Backend integration needed)');
        // Actual implementation would call:
        // fetch('/api/download-report', { method: 'POST', ... })
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Error generating PDF report');
    }
}

function downloadCSVResults() {
    if (!trainingResults || !modelData) {
        alert('No results data available');
        return;
    }
    
    try {
        // Generate CSV content with training data and predictions
        const validData = trainingResults.csvData.filter(row => 
            typeof row[trainingResults.xColumn] === 'number' && 
            typeof row[trainingResults.yColumn] === 'number'
        );
        
        const csvContent = [
            ['X', 'Y_Actual', 'Y_Predicted', 'Residual'].join(','),
            ...validData.map(row => {
                const x = row[trainingResults.xColumn];
                const yActual = row[trainingResults.yColumn];
                const yPredicted = modelData.theta0 + modelData.theta1 * x;
                const residual = yActual - yPredicted;
                return [x, yActual, yPredicted.toFixed(6), residual.toFixed(6)].join(',');
            })
        ].join('\n');
        
        downloadCSVFile(csvContent, 'training_results.csv');
        
    } catch (error) {
        console.error('Error generating CSV:', error);
        alert('Error generating CSV results');
    }
}

function downloadBatchPredictions() {
    if (batchPredictions.length === 0) {
        alert('No batch predictions available');
        return;
    }
    
    try {
        const csvContent = [
            ['X_Value', 'Predicted_Y'].join(','),
            ...batchPredictions.map(pred => [pred.x, pred.y.toFixed(6)].join(','))
        ].join('\n');
        
        downloadCSVFile(csvContent, 'batch_predictions.csv');
        
    } catch (error) {
        console.error('Error downloading batch predictions:', error);
        alert('Error downloading batch predictions');
    }
}

function downloadCSVFile(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function closeBanner() {
    document.getElementById('successBanner').style.display = 'none';
}

// Utility functions for model evaluation (can be expanded)
function calculateModelMetrics(xValues, yValues, theta0, theta1) {
    const n = xValues.length;
    let totalSumSquares = 0;
    let residualSumSquares = 0;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
    
    for (let i = 0; i < n; i++) {
        const predicted = theta0 + theta1 * xValues[i];
        totalSumSquares += (yValues[i] - yMean) * (yValues[i] - yMean);
        residualSumSquares += (yValues[i] - predicted) * (yValues[i] - predicted);
    }
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    const rmse = Math.sqrt(residualSumSquares / n);
    const mae = yValues.reduce((sum, y, i) => {
        const predicted = theta0 + theta1 * xValues[i];
        return sum + Math.abs(y - predicted);
    }, 0) / n;
    
    return {
        rSquared,
        rmse,
        mae,
        totalSumSquares,
        residualSumSquares
    };
}