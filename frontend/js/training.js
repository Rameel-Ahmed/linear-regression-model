// Global variables
let trainingData = null;
let scatterChart = null;
let costChart = null;
let isTraining = false;
let trainingId = null;
let updateInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    loadTrainingData();
    setupEventListeners();
    setupCharts();
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

function loadTrainingData() {
    const data = localStorage.getItem('regressionData');
    if (!data) {
        alert('No training data found. Please upload data first.');
        window.location.href = 'index.html';
        return;
    }
    
    trainingData = JSON.parse(data);
    updateDataSummary();
}

function updateDataSummary() {
    document.getElementById('xVariable').textContent = trainingData.xColumn;
    document.getElementById('yVariable').textContent = trainingData.yColumn;
    document.getElementById('dataPoints').textContent = trainingData.csvData.length;
    
    // Calculate correlation
    const validData = trainingData.csvData.filter(row => 
        typeof row[trainingData.xColumn] === 'number' && 
        typeof row[trainingData.yColumn] === 'number'
    );
    
    if (validData.length > 0) {
        const xValues = validData.map(row => row[trainingData.xColumn]);
        const yValues = validData.map(row => row[trainingData.yColumn]);
        const correlation = calculateCorrelation(xValues, yValues);
        document.getElementById('correlation').textContent = correlation.toFixed(3);
    }
}

function setupEventListeners() {
    // Slider synchronization
    syncSliders();
    
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
    document.getElementById('stopBtn').onclick = stopTraining;
    document.getElementById('restartBtn').onclick = restartTraining;
    document.getElementById('saveModel').onclick = saveModel;
    document.getElementById('viewResults').onclick = viewResults;
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
}

function setTrainingMode(mode) {
    const presets = {
        fast: { lr: 0.1, epochs: 200, tolerance: 0.01 },
        balanced: { lr: 0.01, epochs: 500, tolerance: 0.001 },
        accurate: { lr: 0.001, epochs: 1000, tolerance: 0.0001 },
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
    const ctx = document.getElementById('costChart').getContext('2d');
    
    costChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Cost',
                data: [],
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false },
            scales: {
                x: { 
                    title: { display: true, text: 'Epochs', font: { weight: 'bold' } }
                },
                y: { 
                    title: { display: true, text: 'Cost Function', font: { weight: 'bold' } },
                    beginAtZero: false
                }
            },
            plugins: {
                title: { 
                    display: true, 
                    text: 'Training Cost Over Time',
                    font: { size: 16, weight: 'bold' }
                },
                legend: { display: false }
            }
        }
    });
}

function showChart(type) {
    const scatterContainer = document.getElementById('scatterContainer');
    const costContainer = document.getElementById('costContainer');
    const chartGrid = document.getElementById('chartGrid');
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Configure layout
    if (type === 'both') {
        scatterContainer.style.display = 'block';
        costContainer.style.display = 'block';
        chartGrid.style.gridTemplateColumns = '1fr 1fr';
    } else if (type === 'scatter') {
        scatterContainer.style.display = 'block';
        costContainer.style.display = 'none';
        chartGrid.style.gridTemplateColumns = '1fr';
    } else if (type === 'cost') {
        scatterContainer.style.display = 'none';
        costContainer.style.display = 'block';
        chartGrid.style.gridTemplateColumns = '1fr';
    }
    
    // Resize charts
    setTimeout(() => {
        if (scatterChart) scatterChart.resize();
        if (costChart) costChart.resize();
    }, 100);
}

async function startTraining() {
    if (isTraining) return;
    
    const params = {
        learning_rate: parseFloat(document.getElementById('learningRate').value),
        epochs: parseInt(document.getElementById('epochs').value),
        tolerance: parseFloat(document.getElementById('tolerance').value),
        early_stopping: document.getElementById('earlyStop').checked,
        live_updates: document.getElementById('liveUpdate').checked,
        x_column: trainingData.xColumn,
        y_column: trainingData.yColumn,
        csv_data: trainingData.csvData,
        cleaning_options: trainingData.cleaning,
        filename: trainingData.fileName
    };

    try {
        const response = await fetch('/api/start-training', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        
        trainingId = result.training_id;
        startTrainingLoop();
        
    } catch (error) {
        console.log('Backend not available, starting demo mode');
        simulateTraining();
    }
}

function startTrainingLoop() {
    isTraining = true;
    updateControlButtons();
    updateStatus('🟡', 'Training in progress...');
    
    // Clear previous data
    costChart.data.labels = [];
    costChart.data.datasets[0].data = [];
    costChart.update();
    
    // Start polling
    updateInterval = setInterval(pollTrainingProgress, 200);
}

async function pollTrainingProgress() {
    if (!trainingId || !isTraining) return;
    
    try {
        const response = await fetch(`/api/training-progress/${trainingId}`);
        const progress = await response.json();
        
        updateTrainingDisplay(progress);
        
        if (progress.is_complete) {
            completeTraining();
        }
        
    } catch (error) {
        console.error('Failed to get training progress:', error);
    }
}

function updateTrainingDisplay(progress) {
    // Update equation
    document.getElementById('equationDisplay').textContent = 
        `y = ${progress.theta0.toFixed(4)} + ${progress.theta1.toFixed(4)}·x`;
    
    // Update regression line
    const validData = trainingData.csvData.filter(row => 
        typeof row[trainingData.xColumn] === 'number' && 
        typeof row[trainingData.yColumn] === 'number'
    );
    
    if (validData.length > 0) {
        const xValues = validData.map(row => row[trainingData.xColumn]);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        
        const lineData = [
            { x: minX, y: progress.theta0 + progress.theta1 * minX },
            { x: maxX, y: progress.theta0 + progress.theta1 * maxX }
        ];
        
        scatterChart.data.datasets[1].data = lineData;
        scatterChart.update('none');
    }
    
    // Update cost chart
    costChart.data.labels.push(progress.epoch);
    costChart.data.datasets[0].data.push(progress.cost);
    
    // Keep only last 100 points for performance
    if (costChart.data.labels.length > 100) {
        costChart.data.labels.shift();
        costChart.data.datasets[0].data.shift();
    }
    
    costChart.update('none');
    
    // Update progress
    const progressPercent = (progress.epoch / progress.max_epochs) * 100;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
    document.getElementById('progressText').textContent = `${progress.epoch}/${progress.max_epochs} epochs`;
    document.getElementById('costValue').textContent = `Cost: ${progress.cost.toFixed(6)}`;
}

function pauseTraining() {
    if (!isTraining) return;
    isTraining = false;
    clearInterval(updateInterval);
    updateControlButtons();
    updateStatus('🟠', 'Paused');
    
    // Don't reset trainingId - keep it for resume
    if (trainingId) {
        fetch('/api/pause-training', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ training_id: trainingId })
        });
    }
}

function stopTraining() {
    if (!isTraining) return;
    completeTraining();
    
    if (trainingId) {
        fetch('/api/stop-training', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ training_id: trainingId })
        });
    }
}

function restartTraining() {
    stopTraining();
    
    // Reset UI
    document.getElementById('equationDisplay').textContent = 'y = NaN + NaN·x';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = 'Ready to start';
    document.getElementById('costValue').textContent = 'Cost: -';
    
    // Clear charts
    scatterChart.data.datasets[1].data = [];
    scatterChart.update();
    
    costChart.data.labels = [];
    costChart.data.datasets[0].data = [];
    costChart.update();
    
    updateStatus('⚪', 'Ready to train');
}

function completeTraining() {
    isTraining = false;
    trainingId = null;
    clearInterval(updateInterval);
    updateControlButtons();
    updateStatus('🟢', 'Training complete');
    
    // Enable export buttons
    document.getElementById('saveModel').disabled = false;
    document.getElementById('viewResults').disabled = false;
}

function updateControlButtons() {
    document.getElementById('startBtn').disabled = isTraining;
    document.getElementById('pauseBtn').disabled = !isTraining;
    document.getElementById('stopBtn').disabled = !isTraining;
}

function updateStatus(indicator, text) {
    document.getElementById('statusIndicator').textContent = indicator;
    document.getElementById('statusText').textContent = text;
}

function saveModel() {
    alert('Model saved! (Backend integration needed)');
}

function viewResults() {
    alert('Proceeding to results page...');
    // window.location.href = 'results.html';
}

// Demo simulation for testing
function simulateTraining() {
    startTrainingLoop();
    
    const maxEpochs = parseInt(document.getElementById('epochs').value);
    const learningRate = parseFloat(document.getElementById('learningRate').value);
    let epoch = 0;
    let theta0 = Math.random() * 10 - 5;
    let theta1 = Math.random() * 2 - 1;
    let cost = 10;
    
    const simulate = () => {
        if (!isTraining || epoch >= maxEpochs) {
            completeTraining();
            return;
        }
        
        epoch++;
        
        // Simulate gradient descent
        theta0 += (Math.random() - 0.5) * learningRate * 0.1;
        theta1 += (Math.random() - 0.5) * learningRate * 0.1;
        cost = cost * 0.995 + Math.random() * 0.01; // Gradual decrease
        
        updateTrainingDisplay({
            epoch,
            max_epochs: maxEpochs,
            theta0,
            theta1,
            cost,
            is_complete: epoch >= maxEpochs
        });
        
        setTimeout(simulate, 50);
    };
    
    simulate();
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