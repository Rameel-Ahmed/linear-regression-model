// Global variables
let trainingData = null;
let scatterChart = null;
let costChart = null;
let isTraining = false;
let isPaused = false;
let trainingId = null;

// Initialize
async function loadTrainingData() {
    try {
        console.log('🔄 Loading training data...');
        
        // Get data from localStorage (set by first page)
        const trainingDataStr = localStorage.getItem('trainingData');
        
        if (!trainingDataStr) {
            console.error('❌ No training data found in localStorage');
            alert('No training data found. Please process data first.');
            window.location.href = '/';
            return;
        }
        
        trainingData = JSON.parse(trainingDataStr);
        console.log('📊 Training data loaded:', trainingData);
        console.log('📋 Training data keys:', Object.keys(trainingData));
        
        // Debug data structure
        if (trainingData.cleaned_data) {
            console.log('📊 Cleaned data structure:', {
                length: trainingData.cleaned_data.length,
                columns: Object.keys(trainingData.cleaned_data[0] || {}),
                xColumn: trainingData.xColumn,
                yColumn: trainingData.yColumn
            });
        }
        
        // Add error handling for each function
        try {
            updateDataSummary();
            console.log('✅ Summary updated successfully');
        } catch (e) {
            console.error('❌ Error updating summary:', e);
        }
        
        try {
            createDataVisualizations();
            console.log('✅ Visualizations created successfully');
        } catch (e) {
            console.error('❌ Error creating visualizations:', e);
        }
        
        try {
            updateTrainingStatus('Data loaded and ready for training', '✅');
            console.log('✅ Status updated successfully');
        } catch (e) {
            console.error('❌ Error updating status:', e);
        }
        
    } catch (error) {
        console.error('❌ Failed to load training data:', error);
        alert('Failed to load training data. Please try again.');
        window.location.href = '/';
    }
}

// Auto-load when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded, initializing...');
    initializeTheme();
    loadTrainingData();
    setupEventListeners(); // Add this line to connect button events
    setupSidebarToggle(); // Add this line to initialize sidebar toggle
    
            // Ensure charts are created when page loads
        setTimeout(() => {
            if (!window.costChart) {
                console.log('🔄 Creating cost chart on page load...');
                createCostChart();
            }
            if (!window.scatterChart) {
                console.log('🔄 Creating scatter chart on page load...');
                createScatterPlot();
            }
            
            // Initialize performance metrics if data is available
            if (trainingData && trainingData.cleaned_data) {
                console.log('🔄 Performance metrics will be initialized when charts are shown');
            }
        }, 1000); // Small delay to ensure DOM is fully ready
});

function initializeTheme() {
    console.log('🎨 Initializing theme...');
    const themeBtn = document.getElementById('themeBtn');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    console.log('🌙 Saved theme:', savedTheme);
    console.log('🔘 Theme button found:', !!themeBtn);
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeBtn) {
        themeBtn.textContent = savedTheme === 'light' ? '🌙' : '☀️';
        themeBtn.onclick = function() {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = current === 'light' ? 'dark' : 'light';
            console.log('🔄 Switching theme from', current, 'to', newTheme);
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.textContent = newTheme === 'light' ? '🌙' : '☀️';
            
            console.log('✅ Theme updated to:', newTheme);
        };
    } else {
        console.error('❌ Theme button not found!');
    }
}

function updateDataSummary() {
    try {
        if (!trainingData) {
            console.log('❌ No training data available for summary');
        return;
    }
    
        console.log('📊 Updating data summary with:', trainingData);
        
        // Update X and Y variable names
        const xVariableElement = document.getElementById('xVariable');
        const yVariableElement = document.getElementById('yVariable');
        
        if (xVariableElement && trainingData.columns?.x_column) {
            xVariableElement.textContent = trainingData.columns.x_column;
        }
        
        if (yVariableElement && trainingData.columns?.y_column) {
            yVariableElement.textContent = trainingData.columns.y_column;
        }
        
        // Update statistics
        const xMeanElement = document.getElementById('xMean');
        const xStdElement = document.getElementById('xStd');
        const yMeanElement = document.getElementById('yMean');
        const yStdElement = document.getElementById('yStd');
        
        if (xMeanElement && trainingData.statistics?.x_mean !== undefined) {
            xMeanElement.textContent = trainingData.statistics.x_mean.toFixed(4);
        }
        
        if (xStdElement && trainingData.statistics?.x_std !== undefined) {
            xStdElement.textContent = trainingData.statistics.x_std.toFixed(4);
        }
        
        if (yMeanElement && trainingData.statistics?.y_mean !== undefined) {
            yMeanElement.textContent = trainingData.statistics.y_mean.toFixed(4);
        }
        
        if (yStdElement && trainingData.statistics?.y_std !== undefined) {
            yStdElement.textContent = trainingData.statistics.y_std.toFixed(4);
        }
        
        // Update row counts
        const originalRowsElement = document.getElementById('originalRows');
        const cleanedRowsElement = document.getElementById('cleanedRows');
        const rowsRemovedElement = document.getElementById('rowsRemoved');
        
        if (originalRowsElement && trainingData.file_info?.original_shape?.[0] !== undefined) {
            originalRowsElement.textContent = trainingData.file_info.original_shape[0].toLocaleString();
        }
        
        if (cleanedRowsElement && trainingData.file_info?.cleaned_shape?.[0] !== undefined) {
            cleanedRowsElement.textContent = trainingData.file_info.cleaned_shape[0].toLocaleString();
        }
        
        if (rowsRemovedElement && trainingData.cleaning_summary?.rows_removed !== undefined) {
            rowsRemovedElement.textContent = trainingData.cleaning_summary.rows_removed.toLocaleString();
        }
        
        console.log('✅ Data summary updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating summary:', error);
    }
}

function setupEventListeners() {
    // Slider synchronization
    syncSliders();
    
    // Train split slider and input synchronization
    const trainSplitSlider = document.getElementById('trainSplit');
    const trainSplitValue = document.getElementById('trainSplitInput');
    
    if (trainSplitSlider && trainSplitValue) {
        trainSplitSlider.addEventListener('input', function() {
            trainSplitValue.value = this.value;
        });
        
        trainSplitValue.addEventListener('input', function() {
            const value = this.value;
            if (value >= 0.1 && value <= 1.0) {
                trainSplitSlider.value = value;
            }
        });
    }
    
    // Training speed slider and input synchronization
    const trainingSpeedSlider = document.getElementById('trainingSpeed');
    const trainingSpeedValue = document.getElementById('trainingSpeedInput');
    
    if (trainingSpeedSlider && trainingSpeedValue) {
        trainingSpeedSlider.addEventListener('input', function() {
            trainingSpeedValue.value = this.value;
        });
        
        trainingSpeedValue.addEventListener('input', function() {
            const value = this.value;
            if (value >= 0.1 && value <= 3.0) {
                trainingSpeedSlider.value = value;
            }
        });
    }
    
    // Removed old updateSpeed controls - now using single trainingSpeed control
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            setTrainingMode(this.dataset.mode);
        };
    });

    // Control buttons
    document.getElementById('startBtn').onclick = startTraining;
    document.getElementById('pauseBtn').onclick = pauseTraining;
    document.getElementById('resumeBtn').onclick = resumeTraining;
    document.getElementById('stopBtn').onclick = stopTraining;
    document.getElementById('restartBtn').onclick = restartTraining;
    
    // View Results button - now directly clickable
    const viewResultsBtn = document.getElementById('viewResults');
    if (viewResultsBtn) {
        console.log('✅ View Results button found and ready');
    } else {
        console.error('❌ View Results button not found');
    }
}

function syncSliders() {
    // Learning Rate
    const lr = document.getElementById('learningRate');
    const lrInput = document.getElementById('learningRateInput');
    lr.oninput = () => lrInput.value = lr.value;
    lrInput.oninput = () => lr.value = lrInput.value;

    // Epochs
    const epochs = document.getElementById('epochs');
    const epochsInput = document.getElementById('epochsInput');
    epochs.oninput = () => epochsInput.value = epochs.value;
    epochsInput.oninput = () => epochs.value = epochsInput.value;

    // Tolerance
    const tolerance = document.getElementById('tolerance');
    const toleranceInput = document.getElementById('toleranceInput');
    tolerance.oninput = () => toleranceInput.value = tolerance.value;
    toleranceInput.oninput = () => tolerance.value = toleranceInput.value;

    // Train Split
    const trainSplit = document.getElementById('trainSplit');
    const trainSplitInput = document.getElementById('trainSplitInput');
    if (trainSplit && trainSplitInput) {
        trainSplit.oninput = () => trainSplitInput.value = trainSplit.value;
        trainSplitInput.oninput = () => trainSplit.value = trainSplitInput.value;
    }
}

function setTrainingMode(mode) {
    const presets = {
        fast: { lr: 0.8, epochs: 200, tolerance: 0.0001 },
        balanced: { lr: 0.3, epochs: 500, tolerance: 0.0001 },
        accurate: { lr: 0.01, epochs: 1000, tolerance: 0.00001 },
        custom: null
    };

    if (presets[mode]) {
        document.getElementById('learningRate').value = presets[mode].lr;
        document.getElementById('learningRateInput').value = presets[mode].lr;
        document.getElementById('epochs').value = presets[mode].epochs;
        document.getElementById('epochsInput').value = presets[mode].epochs;
        document.getElementById('tolerance').value = presets[mode].tolerance;
        document.getElementById('toleranceInput').value = presets[mode].tolerance;
    }
}

function setupCharts() {
    createScatterChart();
    createCostChart();
}

function createScatterChart() {
    const ctx = document.getElementById('scatterChart').getContext('2d');
    
    // Get clean data
    const validData = trainingData.csvData.filter(row => 
        typeof row[trainingData.xColumn] === 'number' && 
        typeof row[trainingData.yColumn] === 'number'
    );
    
    const scatterData = validData.map(row => ({
        x: row[trainingData.xColumn],
        y: row[trainingData.yColumn]
    }));

    scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Data Points',
                data: scatterData,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                pointRadius: 3
            }, {
                label: 'Regression Line',
                data: [],
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'transparent',
                borderWidth: 3,
                type: 'line',
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false },
            scales: {
                x: { 
                    title: { display: true, text: trainingData.xColumn, font: { weight: 'bold' } }
                },
                y: { 
                    title: { display: true, text: trainingData.yColumn, font: { weight: 'bold' } }
                }
            },
            plugins: {
                title: { 
                    display: true, 
                    text: `${trainingData.yColumn} vs ${trainingData.xColumn}`,
                    font: { size: 16, weight: 'bold' }
                },
                legend: { position: 'bottom' }
            }
        }
    });
}

function createCostChart() {
    console.log('🔄 Creating cost chart...');
    
    const ctx = document.getElementById('costChart');
    if (!ctx) {
        console.error('❌ Cost chart canvas not found!');
        return;
    }
    
    console.log('✅ Found cost chart canvas');
    
    // Destroy existing chart if it exists
    if (window.costChart && typeof window.costChart.destroy === 'function') {
        window.costChart.destroy();
        console.log('🗑️ Destroyed existing cost chart');
    }
    
    try {
        window.costChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                    label: 'Training Cost',
                data: [],
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                    tension: 0.1,
                    pointRadius: 2,
                    pointHoverRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false },
                animation: {
                    duration: 300, // Enable animations for user to see plotting
                    easing: 'easeOutQuart'
                },
            scales: {
                x: { 
                        title: { display: true, text: 'Epochs', font: { weight: 'bold' } },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                },
                y: { 
                    title: { display: true, text: 'Cost Function', font: { weight: 'bold' } },
                        beginAtZero: false,
                        grid: { color: 'rgba(0,0,0,0.1)' }
                }
            },
            plugins: {
                title: { 
                    display: true, 
                    text: 'Training Cost Over Time',
                    font: { size: 16, weight: 'bold' }
                },
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(context) {
                                return `Epoch ${context[0].label}`;
                            },
                            label: function(context) {
                                return `Cost: ${context.parsed.y.toFixed(6)}`;
                            }
                        }
                    }
                }
            }
        });
        console.log('✅ Cost chart created successfully');
    } catch (error) {
        console.error('❌ Error creating cost chart:', error);
    }
}

// Update createDataVisualizations to use the stored data
function createDataVisualizations() {
    if (!trainingData) {
        console.log('❌ No training data available');
        return;
    }
    
    try {
        console.log('🔄 Creating data visualizations...');
        console.log('📊 Training data structure:', trainingData);
        
        const xData = trainingData.statistics.x_data;
        const yData = trainingData.statistics.y_data;
        const xColumn = trainingData.columns.x_column;
        const yColumn = trainingData.columns.y_column;
        
        console.log('📈 Data for plotting:', {
            xData: xData ? xData.length : 'undefined',
            yData: yData ? yData.length : 'undefined',
            xColumn,
            yColumn
        });
        
        if (xData && yData && xData.length > 0 && yData.length > 0) {
            // Create data array in the same format as script.js
            const validData = xData.map((x, i) => ({
                [xColumn]: x,
                [yColumn]: yData[i]
            }));
            
            console.log('✅ Valid data created:', {
                length: validData.length,
                sample: validData.slice(0, 3)
            });
            
            // Create plots using the same functions as script.js
            createScatterPlot(validData, xColumn, yColumn);
            createDensityPlot(validData, xColumn, yColumn);
            createCostChart(); // Also create the cost chart
            
            console.log('📊 Charts created with stored data');
        } else {
            console.error('❌ Invalid data for plotting:', { xData, yData, xColumn, yColumn });
        }
    } catch (error) {
        console.error('❌ Error creating visualizations:', error);
    }
}

// Add this function back
function createDemoCharts() {
    console.log('🔄 Creating demo charts...');
    const sampleX = [1, 2, 3, 4, 5];
    const sampleY = [2, 4, 6, 8, 10];
    const sampleData = sampleX.map((x, i) => ({ X: x, Y: sampleY[i] }));
    
    createScatterPlot(sampleData, 'X', 'Y');
    createDensityPlot(sampleData, 'X', 'Y');
    console.log('✅ Demo charts created');
}

// Use the exact same plotting functions as script.js
function createScatterPlot(data, xCol, yCol) {
    const ctx = document.getElementById('scatterChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists - check if it's actually a Chart object
    if (window.scatterChart && typeof window.scatterChart.destroy === 'function') {
        window.scatterChart.destroy();
    }
    
    const chartData = data.map(row => ({x: row[xCol], y: row[yCol]}));
    
    window.scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: `${yCol} vs ${xCol}`,
                data: chartData,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: xCol }},
                y: { title: { display: true, text: yCol }}
            },
            plugins: {
                title: { display: true, text: `${yCol} vs ${xCol}` },
                legend: { display: false }
            }
        }
    });
}

function createDensityPlot(data, xCol, yCol) {
    console.log('🔄 Creating density plot with data:', { data: data.length, xCol, yCol });
    
    const ctx = document.getElementById('densityChart');
    if (!ctx) {
        console.error('❌ Density chart canvas not found!');
        return;
    }
    
    console.log('✅ Found density chart canvas');
    
    // Destroy existing chart if it exists
    if (window.densityChart && typeof window.densityChart.destroy === 'function') {
        window.densityChart.destroy();
        console.log('🗑️ Destroyed existing density chart');
    }
    
    const xValues = data.map(row => row[xCol]);
    const yValues = data.map(row => row[yCol]);
    
    console.log('📊 Data for density plot:', {
        xValues: xValues.length,
        yValues: yValues.length,
        xCol: xCol,
        yCol: yCol,
        sampleX: xValues.slice(0, 5),
        sampleY: yValues.slice(0, 5)
    });
    
    // Create grid for density calculation - EXACTLY as in script.js
    const gridSize = 20;
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    console.log('📐 Grid bounds:', { xMin, xMax, yMin, yMax });
    
    const xStep = (xMax - xMin) / gridSize;
    const yStep = (yMax - yMin) / gridSize;
    
    // Calculate density grid
    const densityData = [];
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const xCenter = xMin + (i + 0.5) * xStep;
            const yCenter = yMin + (j + 0.5) * yStep;
            
            // Count points within this grid cell
            const count = data.filter(row => {
                const x = row[xCol];
                const y = row[yCol];
                return x >= xMin + i * xStep && x < xMin + (i + 1) * xStep &&
                       y >= yMin + j * yStep && y < yMin + (j + 1) * yStep;
            }).length;
            
            if (count > 0) {
                densityData.push({
                    x: xCenter,
                    y: yCenter,
                    r: Math.sqrt(count) * 3 // Bubble size based on density
                });
            }
        }
    }
    
    console.log('📊 Density data calculated:', densityData.length, 'bubbles');
    
    try {
        window.densityChart = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Data Density',
                    data: densityData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        title: { display: true, text: xCol },
                        min: xMin,
                        max: xMax
                    },
                    y: { 
                        title: { display: true, text: yCol },
                        min: yMin,
                        max: yMax
                    }
                },
                plugins: {
                    title: { display: true, text: `${yCol} vs ${xCol} - Density Map` },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Density: ${Math.round(context.raw.r / 3)} points`;
                            }
                        }
                    }
                }
            }
        });
        console.log('✅ Density chart created successfully');
    } catch (error) {
        console.error('❌ Error creating density chart:', error);
    }
}

// Removed: Old chart tab functionality replaced with main/optional chart layout

// Function removed - no chart needed, just metrics display

// Function to update training metrics dashboard


function startTraining() {
    if (isTraining) return;
    
    // Get training parameters
    const learningRate = parseFloat(document.getElementById('learningRate').value);
    const epochs = parseInt(document.getElementById('epochs').value);
    const tolerance = parseFloat(document.getElementById('tolerance').value);
    const earlyStopping = document.getElementById('earlyStop').checked;
    const trainingSpeed = parseFloat(document.getElementById('trainingSpeed').value);
    const trainSplit = parseFloat(document.getElementById('trainSplit').value);
    
    // Validate parameters
    if (learningRate <= 0 || epochs <= 0 || tolerance < 0 || trainSplit <= 0 || trainSplit >= 1) {
        alert('Please enter valid training parameters');
        return;
    }
    
    console.log('🚀 Starting training with parameters:', {
        learningRate, epochs, tolerance, earlyStopping, trainingSpeed, trainSplit
    });
    
    // Ensure cost chart is ready for training
    if (!window.costChart) {
        console.log('🔄 Cost chart not found, creating it...');
        createCostChart();
    }
    
    // Ensure cost chart container is visible and active
    const costContainer = document.getElementById('costContainer');
    if (costContainer) {
        costContainer.style.display = 'block';
        console.log('✅ Cost chart container made visible');
        
        // Also show the cost chart tab as active
        const costTab = document.querySelector('[onclick="showChart(\'cost\')"]');
        if (costTab) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            costTab.classList.add('active');
            console.log('✅ Cost chart tab activated');
        }
    }
    
    // Cancel any existing animations before starting new training
    cancelAllAnimations();
    
    // Initialize animation variables for smooth transitions
    window.currentTheta0 = 0;
    window.currentTheta1 = 0;
    console.log('🎬 Animation variables initialized');
    
    // Clear previous training data from cost chart
    if (window.costChart && typeof window.costChart.data !== 'undefined') {
        window.costChart.data.labels = [];
        window.costChart.data.datasets[0].data = [];
        window.costChart.update('none');
        console.log('🗑️ Cost chart cleared for new training');
        
        // Force chart to redraw with empty data
    setTimeout(() => {
            if (window.costChart) {
                window.costChart.update('none');
                console.log('🔄 Cost chart redrawn with empty data');
            }
    }, 100);
}

    // Store training parameters in localStorage for next page
    const trainingParams = {
        learning_rate: learningRate,
        epochs: epochs,
        tolerance: tolerance,
        early_stopping: earlyStopping,
        training_speed: trainingSpeed,
        train_split: trainSplit,
        timestamp: new Date().toISOString(),
        x_column: trainingData?.columns?.x_column || 'X',
        y_column: trainingData?.columns?.y_column || 'Y'
    };
    
    localStorage.setItem('trainingParams', JSON.stringify(trainingParams));
    console.log('💾 Training parameters stored in localStorage:', trainingParams);
    
    // Create form data
    const formData = new FormData();
    formData.append('learning_rate', learningRate);
    formData.append('epochs', epochs);
    formData.append('tolerance', tolerance);
    formData.append('early_stopping', earlyStopping);
    formData.append('training_speed', trainingSpeed);
    formData.append('train_split', trainSplit);
    
    // Start streaming training
    startStreamingTraining(formData);
    
    // Update initial training status
    const trainingStatus = document.getElementById('trainingStatus');
    if (trainingStatus) {
        trainingStatus.textContent = 'Starting training...';
    }
}

async function startStreamingTraining(formData) {
    try {
        console.log('📡 Starting streaming training...');
        
        // Update UI to show training is starting
        isTraining = true;
        isPaused = false;
        updateControlButtons();
        updateStatus('Starting training...');
        
        // Send POST request to start training
        const response = await fetch('/api/start-training', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('✅ Training started, beginning streaming...');
        updateStatus('Training in progress...');
        
        // Handle streaming response with speed control
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // Removed: No longer needed with backend control
        let trainingSpeed = parseFloat(document.getElementById('trainingSpeed').value);
        
        // Speed control is now handled by backend
        
        // Set up page unload handler to stop training
        const handlePageUnload = () => {
            if (isTraining) {
                console.log('🛑 Page unloading - stopping training');
                fetch('/api/stop-training', { method: 'POST' }).catch(() => {});
            }
        };
        window.addEventListener('beforeunload', handlePageUnload);
        
        // Set up speed display updates
        const speedSlider = document.getElementById('trainingSpeed');
        const speedInput = document.getElementById('trainingSpeedInput');
        
        const updateSpeedDisplay = () => {
            trainingSpeed = parseFloat(speedSlider.value);
            if (speedInput) speedInput.value = trainingSpeed;
            
            // Update speed display
            const currentSpeedDisplay = document.getElementById('currentSpeed');
            if (currentSpeedDisplay) {
                let speedText = '';
                if (trainingSpeed >= 0.8) {
                    speedText = '⚡ Speed 1.0 (Fast)';
                } else if (trainingSpeed >= 0.6) {
                    speedText = '🚀 Speed 0.8 (Fast-Medium)';
                } else if (trainingSpeed >= 0.4) {
                    speedText = '🐌 Speed 0.6 (Medium)';
                } else if (trainingSpeed >= 0.2) {
                    speedText = '🐌 Speed 0.4 (Slow)';
                } else {
                    speedText = '🐌 Speed 0.2 (Very Slow)';
                }
                currentSpeedDisplay.textContent = speedText;
            }
            console.log('⚡ Speed updated to:', trainingSpeed);
        };
        
        speedSlider.addEventListener('input', updateSpeedDisplay);
        if (speedInput) {
            speedInput.addEventListener('input', () => {
                const value = parseFloat(speedInput.value);
                if (value >= 0.2 && value <= 1.0) {
                    // Snap to nearest valid step (0.2, 0.4, 0.6, 0.8, 1.0)
                    const snappedValue = Math.round(value * 5) / 5;
                    speedSlider.value = snappedValue;
                    trainingSpeed = snappedValue;
                    updateSpeedDisplay();
                }
            });
        }
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log('📡 Training stream ended');
                break;
            }
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const epochData = JSON.parse(line.slice(6));
                        console.log('📊 Epoch data received:', epochData);
                        
                        if (epochData.error) {
                            console.error('❌ Training error:', epochData.message);
                            // Remove page unload handler
                            window.removeEventListener('beforeunload', handlePageUnload);
                            updateStatus('Training error: ' + epochData.message);
                            isTraining = false;
    updateControlButtons();
                            return;
                        }
                        
                        if (epochData.training_complete) {
                            console.log('✅ Training completed:', epochData);
                            console.log('🔍 Training response structure:', {
                                has_final_theta0: 'final_theta0' in epochData,
                                has_final_theta1: 'final_theta1' in epochData,
                                has_equation: 'equation' in epochData,
                                has_sklearn_comparison: 'sklearn_comparison' in epochData,
                                keys: Object.keys(epochData)
                            });
                            
                            // Remove page unload handler
                            window.removeEventListener('beforeunload', handlePageUnload);
                            
                            // Store ALL the essential data we need for results page
                            const trainingParams = JSON.parse(localStorage.getItem('trainingParams') || '{}');
                            const essentialTrainingData = {
                                // Final model parameters
                                final_theta0: epochData.final_theta0,
                                final_theta1: epochData.final_theta1,
                                equation: epochData.equation,
                                
                                // Performance metrics
                                final_rmse: epochData.final_rmse,
                                final_mae: epochData.final_mae,
                                final_r2: epochData.final_r2,
                                test_mse: epochData.test_mse,
                                test_r2: epochData.test_r2,
                                
                                // Training info
                                total_epochs: epochData.total_epochs || epochData.epoch || 'Unknown',
                                
                                // Training parameters
                                learning_rate: trainingParams.learning_rate,
                                epochs: trainingParams.epochs,
                                tolerance: trainingParams.tolerance,
                                early_stopping: trainingParams.early_stopping,
                                training_speed: trainingParams.training_speed,
                                train_split: trainingParams.train_split,
                                x_column: trainingParams.x_column,
                                y_column: trainingParams.y_column,
                                

                                
                                // Sklearn comparison
                                sklearn_comparison: epochData.sklearn_comparison,
                                

                            };
                            
                            console.log('🔍 About to store essential training data:', essentialTrainingData);
                            console.log('🔍 epochData keys:', Object.keys(epochData));
                            console.log('🔍 epochData.final_theta0:', epochData.final_theta0);
                            console.log('🔍 epochData.final_theta1:', epochData.final_theta1);
                            
                            localStorage.setItem('allTrainingData', JSON.stringify(essentialTrainingData));
                            console.log('💾 Essential training data stored (clean structure):', essentialTrainingData);
                            
                            // Verify what was actually stored
                            const storedData = localStorage.getItem('allTrainingData');
                            console.log('🔍 Verification - what was actually stored:', storedData);
                            console.log('🔍 Verification - parsed stored data:', JSON.parse(storedData));
                            
                            // Add a marker to prove our code ran
                            localStorage.setItem('NEW_CODE_EXECUTED', 'YES');
                            console.log('🚨 NEW CODE EXECUTED - MARKER SET');
                            
                            // Call completeTraining for UI updates
                            completeTraining(epochData);
                            return;
                        }
                        
                        // Debug: Log what we're receiving
                        console.log('🔍 Epoch data received:', {
                            epoch: epochData.epoch,
                            training_complete: epochData.training_complete,
                            is_complete: epochData.is_complete,
                            converged: epochData.converged
                        });
                        

                        
                        // Speed-controlled UI updates for visual elements
                        // Backend-controlled speed: Update immediately when data arrives
                        if (trainingSpeed > 0) {
                            // Backend is already controlling the speed, so update immediately
                            console.log(`🎨 Epoch ${epochData.epoch} received from backend - updating immediately`);
                            
                            // Update all visual elements immediately
                            updateTrainingDisplay(epochData);
                            updateCostChart(epochData);
                            updateProgressBar(epochData);
                            
                            // Update performance metrics
                            updatePerformanceMetrics(epochData);
                            
                            // Show current speed to user
                            const speedInfo = document.getElementById('currentSpeed');
                            if (speedInfo) {
                                let speedText = '';
                                if (trainingSpeed >= 0.8) {
                                    speedText = '⚡ Speed 1.0 (Fast)';
                                } else if (trainingSpeed >= 0.6) {
                                    speedText = '🚀 Speed 0.8 (Fast-Medium)';
                                } else if (trainingSpeed >= 0.4) {
                                    speedText = '🐌 Speed 0.6 (Medium)';
                                } else if (trainingSpeed >= 0.2) {
                                    speedText = '🐌 Speed 0.4 (Slow)';
                                } else {
                                    speedText = '🐌 Speed 0.2 (Very Slow)';
                                }
                                
                                // Add pause indicator if training is paused
                                if (isPaused) {
                                    speedText += ' ⏸️ (Paused)';
                                }
                                
                                speedInfo.textContent = speedText;
                            }
                        }
                        // If speed = 0, don't update visual elements (paused)
                        
                        // Show training progress in status
                        const trainingStatus = document.getElementById('trainingStatus');
                        if (trainingStatus) {
                            trainingStatus.textContent = `Training Epoch ${epochData.epoch}...`;
                        }
                        
                    } catch (parseError) {
                        console.error('❌ Error parsing epoch data:', parseError);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Streaming training error:', error);
        // Remove page unload handler
        if (typeof handlePageUnload !== 'undefined') {
            window.removeEventListener('beforeunload', handlePageUnload);
        }
        updateStatus('Training error: ' + error.message);
        isTraining = false;
        updateControlButtons();
    }
}

// Function to update cost chart - ALWAYS called regardless of speed
function updateCostChart(epochData) {
    try {
        if (window.costChart && typeof window.costChart.data !== 'undefined') {
            // Ensure epoch and cost are valid numbers
            const epoch = parseInt(epochData.epoch);
            const cost = parseFloat(epochData.cost);
            
            if (!isNaN(epoch) && !isNaN(cost)) {
                // Add new data point
                window.costChart.data.labels.push(epoch);
                window.costChart.data.datasets[0].data.push(cost);
                
                // Keep only last 200 points for performance (optional)
                if (window.costChart.data.labels.length > 200) {
                    window.costChart.data.labels.shift();
                    window.costChart.data.datasets[0].data.shift();
                }
                
                // Update chart with new data - show animation for user to see plotting
                window.costChart.update('active'); // Use 'active' instead of 'none' to show animation
                console.log(`📊 Cost chart updated: Epoch ${epoch}, Cost ${cost.toFixed(6)} (total points: ${window.costChart.data.labels.length})`);
            } else {
                console.warn('⚠️ Invalid epoch or cost data:', { epoch: epochData.epoch, cost: epochData.cost });
            }
        } else {
            console.warn('⚠️ Cost chart not available for update');
        }
    } catch (error) {
        console.error('❌ Error updating cost chart:', error);
    }
}

// Global function to cancel all running animations
function cancelAllAnimations() {
    if (window.currentAnimationId) {
        clearTimeout(window.currentAnimationId);
        window.currentAnimationId = null;
        console.log('🛑 All animations cancelled');
    }
}

// Removed: No longer needed with backend-controlled speed

// Removed: startSmoothAnimation function was unused

// Function to toggle optional charts visibility
function toggleOptionalCharts() {
    const optionalChartsGrid = document.getElementById('optionalChartsGrid');
    const toggleChartsText = document.getElementById('toggleChartsText');
    
    if (optionalChartsGrid.style.display === 'none') {
        optionalChartsGrid.style.display = 'grid';
        toggleChartsText.textContent = '👁️ Hide Optional Charts';
        // Initialize EDA charts when showing
        initializeEDACharts();
    } else {
        optionalChartsGrid.style.display = 'none';
        toggleChartsText.textContent = '👁️ Show Optional Charts';
    }
}

// Function removed - replaced with performance metrics

// Function to initialize performance metrics
function initializePerformanceMetrics() {
    console.log('📊 Initializing performance metrics...');
    
    // Set initial metric values
    const rmseMetric = document.getElementById('rmseMetric');
    if (rmseMetric) {
        rmseMetric.textContent = '0';
        rmseMetric.style.color = '#6b7280';
    }
    
    const maeMetric = document.getElementById('maeMetric');
    if (maeMetric) {
        maeMetric.textContent = '0';
        maeMetric.style.color = '#6b7280';
    }
    
    const r2Metric = document.getElementById('r2Metric');
    if (r2Metric) {
        r2Metric.textContent = '0';
        r2Metric.style.color = '#6b7280';
    }
    
    console.log('✅ Performance metrics initialized');
}

// Function to update performance metrics during training
function updatePerformanceMetrics(epochData) {
    console.log('📊 Updating performance metrics with:', epochData);
    
    // Use metrics from backend (more accurate and efficient)
    if (epochData.rmse !== undefined && epochData.mae !== undefined && epochData.r2 !== undefined) {
        const rmse = epochData.rmse;
        const mae = epochData.mae;
        const r2 = epochData.r2;
        
        // Update metric displays
        const rmseMetric = document.getElementById('rmseMetric');
        if (rmseMetric) {
            rmseMetric.textContent = rmse.toFixed(4);
            rmseMetric.style.color = rmse < 1 ? '#10b981' : rmse < 5 ? '#f59e0b' : '#ef4444';
        }
        
        const maeMetric = document.getElementById('maeMetric');
        if (maeMetric) {
            maeMetric.textContent = mae.toFixed(4);
            maeMetric.style.color = mae < 1 ? '#10b981' : mae < 5 ? '#f59e0b' : '#ef4444';
        }
        
        const r2Metric = document.getElementById('r2Metric');
        if (r2Metric) {
            r2Metric.textContent = r2.toFixed(4);
            r2Metric.style.color = r2 > 0.8 ? '#10b981' : r2 > 0.6 ? '#f59e0b' : '#ef4444';
        }
        

        
        console.log('📊 Performance metrics updated from backend:', { rmse, mae, r2 });
    } else {
        console.warn('⚠️ Metrics not available in epoch data');
    }
}

// Function to toggle optional charts visibility
function toggleOptionalCharts() {
    const optionalChartsGrid = document.getElementById('optionalChartsGrid');
    const toggleChartsText = document.getElementById('toggleChartsText');
    
    if (optionalChartsGrid.style.display === 'none') {
        optionalChartsGrid.style.display = 'grid';
        toggleChartsText.textContent = '👁️ Hide Optional Charts';
        
        // Initialize performance metrics when first shown
        initializePerformanceMetrics();
    } else {
        optionalChartsGrid.style.display = 'none';
        toggleChartsText.textContent = '👁️ Show Optional Charts';
    }
}

function updateTrainingDisplay(epochData) {
    try {
        console.log('🔄 Updating training display with:', epochData);
        console.log('📊 Cost chart status:', {
            exists: !!window.costChart,
            hasData: window.costChart ? !!window.costChart.data : false,
            labelsLength: window.costChart?.data?.labels?.length || 0,
            dataLength: window.costChart?.data?.datasets?.[0]?.data?.length || 0
        });
        
        // Update displays
        const equationDisplay = document.getElementById('equationDisplay');
        if (equationDisplay) {
            equationDisplay.textContent = `y = ${epochData.theta0.toFixed(4)} + ${epochData.theta1.toFixed(4)}x`;
        }
        
        const theta0Display = document.getElementById('theta0Display');
        if (theta0Display) {
            theta0Display.textContent = epochData.theta0.toFixed(6);
        }
        
        const theta1Display = document.getElementById('theta1Display');
        if (theta1Display) {
            theta1Display.textContent = epochData.theta1.toFixed(6);
        }
        
        const trainingStatus = document.getElementById('trainingStatus');
        if (trainingStatus) {
            trainingStatus.textContent = `Training (Epoch ${epochData.epoch}/${epochData.max_epochs})`;
        }
        
        // Cost chart is now updated separately via updateCostChart() function
        // This function only updates visual elements (equation, theta values, regression line)
        
        // FIXED: Correct regression line calculation
        if (window.scatterChart) {
            console.log('🔍 Scatter chart found, updating regression line...');
            const scatterData = window.scatterChart.data.datasets[0].data;
            if (scatterData && scatterData.length > 0) {
                // Get actual X range from data points
                const xValues = scatterData.map(point => point.x);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        
                // Calculate regression line endpoints
                const y1 = epochData.theta0 + epochData.theta1 * minX;
                const y2 = epochData.theta0 + epochData.theta1 * maxX;
                
                console.log(`📐 Regression line: (${minX}, ${y1}) to (${maxX}, ${y2}) with θ₀=${epochData.theta0}, θ₁=${epochData.theta1}`);
                
                // Find or create regression line dataset
                let regressionDataset = window.scatterChart.data.datasets.find(ds => ds.label === 'Regression Line');
                
                if (regressionDataset) {
                    // Update existing line
                    regressionDataset.data = [
                        {x: minX, y: y1},
                        {x: maxX, y: y2}
                    ];
                    console.log('✅ Updated existing regression line');
                } else {
                    // Create new line
                    window.scatterChart.data.datasets.push({
                        label: 'Regression Line',
                        data: [
                            {x: minX, y: y1},
                            {x: maxX, y: y2}
                        ],
                        type: 'line',
                        borderColor: 'red',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0,
                        tension: 0
                    });
                    console.log('✅ Created new regression line');
                }
                
                window.scatterChart.update('none');
                console.log('🔄 Scatter chart updated');
            } else {
                console.warn('⚠️ No scatter data found for regression line');
            }
        } else {
            console.warn('⚠️ Scatter chart not found for regression line update');
        }
        
    } catch (error) {
        console.error('Error updating training display:', error);
    }
}

function updateProgressBar(epochData) {
    try {
        // Update progress bar and text (always smooth)
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill && progressText) {
            const progress = (epochData.epoch / epochData.max_epochs) * 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = `Epoch ${epochData.epoch}/${epochData.max_epochs}`;
        }
        
        // Update cost value (always smooth)
        const costValue = document.getElementById('costValue');
        if (costValue) {
            costValue.textContent = `Cost: ${epochData.cost.toFixed(6)}`;
        }
        
    } catch (error) {
        console.error('❌ Error updating progress bar:', error);
    }
}

function updateTrainingStatus(message, icon = '✅') {
    try {
        const statusElement = document.getElementById('trainingStatus');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="status-message">
                    <span class="status-icon">${icon}</span>
                    <span class="status-text">${message}</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error in updateTrainingStatus:', error);
    }
}

function pauseTraining() {
    if (!isTraining) return;
    
    // Pause animations by setting isTraining to false (animations check this)
    // Don't cancel animations completely, just pause them
    updateStatus('Training paused - animations paused');
}

async function pauseTraining() {
    if (!isTraining || isPaused) return;
    
    try {
        const response = await fetch('/api/pause-training', {
            method: 'POST'
        });
        if (response.ok) {
            isPaused = true;
    updateControlButtons();
            updateStatus('Training paused');
            console.log('⏸️ Training paused');
        }
    } catch (error) {
        console.error('❌ Error pausing training:', error);
    }
}

async function resumeTraining() {
    if (!isTraining || !isPaused) return;
    
    try {
        const response = await fetch('/api/resume-training', {
            method: 'POST'
        });
        if (response.ok) {
            isPaused = false;
            updateControlButtons();
            updateStatus('Training resumed');
            console.log('▶️ Training resumed');
        }
    } catch (error) {
        console.error('❌ Error resuming training:', error);
    }
}

async function stopTraining() {
    if (!isTraining) return;
    isTraining = false;
    isPaused = false;
    updateControlButtons();
    
    // Cancel any running animations immediately
    if (window.currentAnimationId) {
        clearTimeout(window.currentAnimationId);
        window.currentAnimationId = null;
        console.log('🛑 Cancelled running animation on stop');
    }
    
    // Clear pending epochs (no longer needed with backend control)
    if (window.pendingEpochs) {
        window.pendingEpochs = [];
        console.log('🛑 Cleared pending epochs on stop');
    }
    
    // Stop backend training
    try {
        const response = await fetch('/api/stop-training', {
            method: 'POST'
        });
        if (response.ok) {
            console.log('🛑 Backend training stopped');
        }
    } catch (error) {
        console.error('❌ Error stopping backend training:', error);
    }
    
    updateStatus('Training stopped');
}

async function restartTraining() {
    await stopTraining();
    
    // Reset pause state
    isPaused = false;
    
    // Cancel any running animations immediately
    if (window.currentAnimationId) {
        clearTimeout(window.currentAnimationId);
        window.currentAnimationId = null;
        console.log('🛑 Cancelled running animation on restart');
    }
    
    // Clear pending epochs (no longer needed with backend control)
    if (window.pendingEpochs) {
        window.pendingEpochs = [];
        console.log('🛑 Cleared pending epochs on restart');
    }
    
    // Animation variables no longer needed
    
    // Reset UI
    document.getElementById('equationDisplay').textContent = 'y = NaN + NaN·x';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = 'Ready to start';
    document.getElementById('costValue').textContent = 'Cost: -';
    
    // Clear scatter chart - remove regression line only (keep original data)
    if (window.scatterChart) {
        // Remove regression line dataset if it exists
        const regressionIndex = window.scatterChart.data.datasets.findIndex(ds => ds.label === 'Regression Line');
        if (regressionIndex !== -1) {
            window.scatterChart.data.datasets.splice(regressionIndex, 1);
        }
        window.scatterChart.update();
    }
    
    // Clear cost chart - remove all training data
    if (window.costChart && typeof window.costChart.data !== 'undefined') {
        try {
            window.costChart.data.labels = [];
            window.costChart.data.datasets[0].data = [];
            window.costChart.update('none');
            console.log('🗑️ Cost chart cleared successfully');
        } catch (error) {
            console.error('❌ Error clearing cost chart:', error);
        }
    }
    
    // Keep density chart data - don't clear it
    // The density chart shows your original data, not training results
    
    updateStatus('Ready to train');
    console.log('🔄 Training restart complete - all animations stopped');
}

function completeTraining(epochData) {
    isTraining = false;
    isPaused = false;
    updateControlButtons();
    updateStatus('Training completed!');
    
    console.log('🎯 Starting completeTraining function...');
    console.log('🔍 completeTraining received epochData:', epochData);
    console.log('🔍 completeTraining epochData keys:', Object.keys(epochData));
    
    console.log('🎉 Training completed with final results:', epochData);
    
    // Update final training status and values
    const trainingStatus = document.getElementById('trainingStatus');
    if (trainingStatus) {
        trainingStatus.textContent = 'Training Complete!';
    }
    
    // Update final equation and theta values
    const equationDisplay = document.getElementById('equationDisplay');
    if (equationDisplay) {
        equationDisplay.textContent = `y = ${epochData.final_theta0.toFixed(4)} + ${epochData.final_theta1.toFixed(4)}x`;
    }
    
    const theta0Display = document.getElementById('theta0Display');
    if (theta0Display) {
        theta0Display.textContent = epochData.final_theta0.toFixed(6);
    }
    
    const theta1Display = document.getElementById('theta1Display');
    if (theta1Display) {
        theta1Display.textContent = epochData.final_theta1.toFixed(6);
    }
    
    // NOTE: We don't store training results here anymore because the streaming response
    // already stores the complete data in allTrainingData. This function only updates the UI.
    console.log('💾 No need to store training results - streaming response already did that');
    
    // Check if our new code ran
    const newCodeExecuted = localStorage.getItem('NEW_CODE_EXECUTED');
    console.log('🔍 Did our new code execute?', newCodeExecuted);
    
    // Check what's currently in allTrainingData
    const currentAllTrainingData = localStorage.getItem('allTrainingData');
    console.log('🔍 Current allTrainingData after completeTraining:', currentAllTrainingData);
    
    // Training completed - View Results button is already clickable
            console.log('✅ Training flow completed successfully');
}



function updateControlButtons() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const stopBtn = document.getElementById('stopBtn');
    const restartBtn = document.getElementById('restartBtn');
    
    if (startBtn) startBtn.disabled = isTraining;
    if (pauseBtn) pauseBtn.disabled = !isTraining || isPaused;
    if (resumeBtn) resumeBtn.disabled = !isTraining || !isPaused;
    if (stopBtn) stopBtn.disabled = !isTraining;
    if (restartBtn) restartBtn.disabled = false; // Always enabled
}

function updateStatus(text) {
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = text;
    }
    
    // Also update training status display
    const trainingStatus = document.getElementById('trainingStatus');
    if (trainingStatus) {
        trainingStatus.textContent = text;
    }
}





async function prepareAndGoToResults() {
    try {
        console.log('🚀 Preparing to go to results page...');
        
        // Check if we have training data
        const allTrainingData = localStorage.getItem('allTrainingData');
        if (!allTrainingData) {
            alert('No training data found. Please complete training first.');
            return;
        }
        
        console.log('🔍 Training data found, preparing comprehensive results...');
        console.log('🔍 Raw allTrainingData:', allTrainingData);
        
        // Parse training data to get sklearn comparison
        const trainingData = JSON.parse(allTrainingData);
        console.log('🔍 Parsed training data:', trainingData);
        console.log('🔍 Training data keys:', Object.keys(trainingData));
        
        const sklearnComparison = trainingData.sklearn_comparison;
        console.log('🔍 Sklearn comparison from training:', sklearnComparison);
        
        // Check if our new data structure is working
        const trainingDataStored = localStorage.getItem('TRAINING_DATA_STORED');
        console.log('🔍 Did we store training data?', trainingDataStored);
        
        // Store comprehensive training session data
        const comprehensiveData = {
            trainingData: trainingData,
            trainingParams: JSON.parse(localStorage.getItem('trainingParams') || '{}'),
            allTrainingData: allTrainingData, // This now contains the actual training response
            sklearnResults: sklearnComparison,
            sessionTimestamp: new Date().toISOString()
        };
        
        localStorage.setItem('comprehensiveResults', JSON.stringify(comprehensiveData));
        console.log('💾 Comprehensive results stored:', comprehensiveData);
        
        // Navigate to results page
        console.log('📊 Navigating to results page...');
        window.location.href = 'results.html';
        
    } catch (error) {
        console.error('❌ Error preparing results:', error);
        alert('Error preparing results. Please try again.');
    }
}

function viewResults() {
    console.log('📊 Proceeding to results page...');
    window.location.href = 'results.html';
}

// Utility functions
function calculateCorrelation(xValues, yValues) {
    const n = xValues.length;
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
    
    let numerator = 0;
    let xSumSq = 0;
    let ySumSq = 0;
    
    for (let i = 0; i < n; i++) {
        const xDiff = xValues[i] - xMean;
        const yDiff = yValues[i] - yMean;
        numerator += xDiff * yDiff;
        xSumSq += xDiff * xDiff;
        ySumSq += yDiff * yDiff;
    }
    
    return numerator / Math.sqrt(xSumSq * ySumSq);
}

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

