// Global variables
let csvData = [];
let headers = [];
let chart = null;
let currentChart = 'scatter';

// API configuration
const API_BASE_URL = 'http://localhost:8000/api';

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
    console.log('=== APP STARTING ===');
    
    // THEME TOGGLE - BULLETPROOF
    const themeBtn = document.getElementById('themeBtn');
    console.log('Theme button found:', !!themeBtn);
    
    if (themeBtn) {
        themeBtn.onclick = function() {
            console.log('🎯 THEME CLICKED!');
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = current === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.textContent = newTheme === 'light' ? '🌙' : '☀️';
            
            console.log('Theme changed:', current, '->', newTheme);
        };       

    }
    


// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
if (themeBtn) {
    themeBtn.textContent = savedTheme === 'light' ? '🌙' : '☀️';
}

setupEventListeners();
console.log('=== APP READY ===');
});

// DOM Elements
const elements = {
    get fileInput() { return document.getElementById('fileInput'); },
    get uploadZone() { return document.getElementById('uploadZone'); },
    get previewSection() { return document.getElementById('previewSection'); },
    get columnSection() { return document.getElementById('columnSection'); },
    get vizSection() { return document.getElementById('vizSection'); },
    get cleaningSection() { return document.getElementById('cleaningSection'); },
    get tableHead() { return document.getElementById('tableHead'); },
    get tableBody() { return document.getElementById('tableBody'); },
    get rowCount() { return document.getElementById('rowCount'); },
    get colCount() { return document.getElementById('colCount'); },
    get xColumn() { return document.getElementById('xColumn'); },
    get yColumn() { return document.getElementById('yColumn'); },
    get generatePlot() { return document.getElementById('generatePlot'); },
    get scatterChart() { return document.getElementById('scatterChart'); },
    get histogramChart() { return document.getElementById('histogramChart'); },
    get boxChart() { return document.getElementById('boxChart'); },
    get densityChart() { return document.getElementById('densityChart'); },

    get chartStats() { return document.getElementById('chartStats'); },
    get missingInfo() { return document.getElementById('missingInfo'); },
    get proceedTraining() { return document.getElementById('proceedTraining'); }

};

function setupEventListeners() {
    // File upload events
    if (elements.uploadZone) {
        elements.uploadZone.onclick = () => elements.fileInput?.click();
        elements.uploadZone.ondragover = handleDragOver;
        elements.uploadZone.ondragleave = handleDragLeave;
        elements.uploadZone.ondrop = handleDrop;
    }
    
    if (elements.fileInput) {
        elements.fileInput.onchange = handleFileSelect;
    }

    // Column selection events
    if (elements.xColumn) {
        elements.xColumn.onchange = checkColumnSelection;
    }
    
    if (elements.yColumn) {
        elements.yColumn.onchange = checkColumnSelection;
    }

    // Generate plot button
    if (elements.generatePlot) {
        elements.generatePlot.onclick = generateVisualization;
    }

    // Training setup
    if (elements.proceedTraining) {
        elements.proceedTraining.onclick = processDataWithCleaning;
    }
}

// File handling functions
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.csv')) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        return;
    }

    // Store the filename globally
    window.csvFileName = file.name;  // ADD THIS LINE
    
    const reader = new FileReader();
    reader.onload = function(e) {
        parseCSV(e.target.result);
    };
    reader.readAsText(file);
}

function parseCSV(csvText) {
    try {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            alert('CSV must have at least 2 rows (header + data)');
            return;
        }

        // Parse headers
        let separator = ',';
        if (lines[0].includes(';')) separator = ';';
        if (lines[0].includes('\t')) separator = '\t';
        
        headers = lines[0].split(separator).map(h => h.trim().replace(/['"]/g, ''));
        
        // Parse data rows
        csvData = [];
        for (let i = 1; i < lines.length && i < 1001; i++) {
            const values = lines[i].split(separator).map(v => v.trim().replace(/['"]/g, ''));
            
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    const value = values[index];
                    const numValue = parseFloat(value);
                    row[header] = !isNaN(numValue) && value !== '' ? numValue : value;
                });
                csvData.push(row);
            }
        }
        
        if (csvData.length === 0) {
            alert('No valid data rows found in CSV');
            return;
        }

        updateDataPreview();
        populateColumnSelectors();
        
    } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
    }
}

function updateDataPreview() {
    elements.tableHead.innerHTML = '<tr>' + 
        headers.map(h => `<th>${h}</th>`).join('') + 
        '</tr>';
    
    const previewRows = csvData.slice(0, 10);
    elements.tableBody.innerHTML = previewRows.map(row => 
        '<tr>' + 
        headers.map(h => `<td>${row[h] !== null && row[h] !== undefined ? row[h] : ''}</td>`).join('') + 
        '</tr>'
    ).join('');

    elements.rowCount.textContent = `Rows: ${csvData.length}`;
    elements.colCount.textContent = `Columns: ${headers.length}`;
    elements.previewSection.style.display = 'block';
}

function populateColumnSelectors() {
    const numericColumns = [];
    headers.forEach(header => {
        const numericCount = csvData.filter(row => 
            typeof row[header] === 'number' && !isNaN(row[header])
        ).length;
        
        if (numericCount > 0) {
            numericColumns.push(header);
        }
    });

    if (numericColumns.length < 2) {
        alert('Need at least 2 numeric columns for regression');
        return;
    }

    elements.xColumn.innerHTML = '<option value="">Select X column...</option>';
    elements.yColumn.innerHTML = '<option value="">Select Y column...</option>';

    numericColumns.forEach(column => {
        elements.xColumn.innerHTML += `<option value="${column}">${column}</option>`;
        elements.yColumn.innerHTML += `<option value="${column}">${column}</option>`;
    });

    elements.columnSection.style.display = 'block';
}

function checkColumnSelection() {
    const xCol = elements.xColumn.value;
    const yCol = elements.yColumn.value;
    
    const hasSelection = xCol && yCol;
    const differentColumns = xCol !== yCol;
    
    elements.generatePlot.disabled = !(hasSelection && differentColumns);
    
    if (hasSelection && !differentColumns) {
        alert('X and Y columns must be different');
        return;
    }
    
    // Show cleaning section when columns are selected
    if (hasSelection && differentColumns) {
        elements.cleaningSection.style.display = 'block';
        console.log('✅ Columns selected, showing cleaning options');
    }
}

function generateVisualization() {
    const xCol = elements.xColumn.value;
    const yCol = elements.yColumn.value;

    if (!xCol || !yCol || xCol === yCol) {
        alert('Please select different X and Y columns');
        return;
    }

    const validData = csvData.filter(row => {
        const xVal = row[xCol];
        const yVal = row[yCol];
        return typeof xVal === 'number' && !isNaN(xVal) && 
               typeof yVal === 'number' && !isNaN(yVal);
    });

    if (validData.length < 3) {
        alert('Need at least 3 valid data points');
        return;
    }

    createScatterPlot(validData, xCol, yCol);
    createHistogram(validData, xCol, yCol);
    createBoxPlot(validData, xCol, yCol);
createDensityPlot(validData, xCol, yCol);

    updateDataStats(validData, xCol, yCol);
    analyzeDataCleaning(xCol, yCol);
    
    elements.vizSection.style.display = 'block';
    elements.cleaningSection.style.display = 'block';
    // In showChart function, add this line after hiding other charts:
    
    setTimeout(() => {
        elements.vizSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// Chart functions
function showChart(type) {
    // Hide all charts
    elements.scatterChart.style.display = 'none';
    elements.histogramChart.style.display = 'none';
    elements.boxChart.style.display = 'none';
    elements.densityChart.style.display = 'none';

    
    // Show selected chart
    const chartElement = elements[type + 'Chart'];
    if (chartElement) {
        chartElement.style.display = 'block';
    }
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    currentChart = type;
}

function createScatterPlot(data, xCol, yCol) {
    const ctx = elements.scatterChart.getContext('2d');
    
    if (chart) chart.destroy();

    const chartData = data.map(row => ({x: row[xCol], y: row[yCol]}));

    chart = new Chart(ctx, {
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

function createHistogram(data, xCol, yCol) {
    const ctx = elements.histogramChart.getContext('2d');
    
    const xValues = data.map(row => row[xCol]);
    const yValues = data.map(row => row[yCol]);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['X Distribution', 'Y Distribution'],
            datasets: [{
                label: 'Data Distribution',
                data: [xValues.length, yValues.length],
                backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Data Distribution Overview' }
            }
        }
    });
}

function createBoxPlot(data, xCol, yCol) {
    const ctx = elements.boxChart.getContext('2d');
    
    const xValues = data.map(row => row[xCol]);
    const yValues = data.map(row => row[yCol]);
    
    // Simple representation using bar chart for box plot concept
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [xCol + ' Range', yCol + ' Range'],
            datasets: [{
                label: 'Data Range',
                data: [Math.max(...xValues) - Math.min(...xValues), 
                       Math.max(...yValues) - Math.min(...yValues)],
                backgroundColor: ['rgba(168, 85, 247, 0.6)', 'rgba(236, 72, 153, 0.6)']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Data Range Analysis' }
            }
        }
    });
}

function createDensityPlot(data, xCol, yCol) {
    const ctx = elements.densityChart.getContext('2d');
    
    const xValues = data.map(row => row[xCol]);
    const yValues = data.map(row => row[yCol]);
    
    // Create grid for density calculation
    const gridSize = 20;
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
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
    
    new Chart(ctx, {
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
}
function updateDataStats(data, xCol, yCol) {
    const xValues = data.map(row => row[xCol]);
    const yValues = data.map(row => row[yCol]);

    const formatNumber = (num) => {
        if (Math.abs(num) >= 1000) {
            return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
        }
        return num.toFixed(3);
    };

    elements.chartStats.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Sample Size</span>
            <span class="stat-value">${data.length}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">${xCol} Mean</span>
            <span class="stat-value">${formatNumber(calculateMean(xValues))}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">${yCol} Mean</span>
            <span class="stat-value">${formatNumber(calculateMean(yValues))}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Correlation (r)</span>
            <span class="stat-value">${calculateCorrelation(xValues, yValues).toFixed(3)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">${xCol} Std Dev</span>
            <span class="stat-value">${formatNumber(calculateStdDev(xValues))}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">${yCol} Std Dev</span>
            <span class="stat-value">${formatNumber(calculateStdDev(yValues))}</span>
        </div>
    `;
}

function analyzeDataCleaning(xCol, yCol) {
    const totalRows = csvData.length;
    const validRows = csvData.filter(row => 
        typeof row[xCol] === 'number' && !isNaN(row[xCol]) &&
        typeof row[yCol] === 'number' && !isNaN(row[yCol])
    ).length;
    
    const missingRows = totalRows - validRows;
    elements.missingInfo.textContent = missingRows > 0 ? 
        `${missingRows} rows have missing/invalid values` : 
        'No missing values detected';
}

sidebar.classList.remove('open');

// Utility functions
function calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateStdDev(values) {
    const mean = calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(calculateMean(squaredDiffs));
}

function calculateCorrelation(xValues, yValues) {
    const xMean = calculateMean(xValues);
    const yMean = calculateMean(yValues);
    
    let numerator = 0;
    let xSumSq = 0;
    let ySumSq = 0;
    
    for (let i = 0; i < xValues.length; i++) {
        const xDiff = xValues[i] - xMean;
        const yDiff = yValues[i] - yMean;
        
        numerator += xDiff * yDiff;
        xSumSq += xDiff * xDiff;
        ySumSq += yDiff * yDiff;
    }
    
    return numerator / Math.sqrt(xSumSq * ySumSq);
}
async function processDataWithCleaning() {
    try {
        // Get the selected file
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a CSV file first');
            return;
        }
        
        // Get selected columns
        const xColumn = document.getElementById('xColumn').value;
        const yColumn = document.getElementById('yColumn').value;
        
        if (!xColumn || !yColumn) {
            alert('Please select both X and Y columns first');
            return;
        }
        
        // Get cleaning options
        const removeDuplicates = document.getElementById('removeDuplicates').checked;
        const removeOutliers = document.getElementById('removeOutliers').checked;
        const handleMissing = document.querySelector('input[name="missingY"]:checked').value;
        
        // Create FormData and send
        const formData = new FormData();
        formData.append('file', file);
        formData.append('x_column', xColumn);
        formData.append('y_column', yColumn);
        formData.append('remove_duplicates', removeDuplicates);
        formData.append('remove_outliers', removeOutliers);
        formData.append('handle_missing', handleMissing);
        
        // Send to backend
        const response = await fetch(`${API_BASE_URL}/process-data`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Store the complete response for training page
            localStorage.setItem('trainingData', JSON.stringify(result));
            
            // Navigate to training page
            window.location.href = '/static/training.html';
        } else {
            const error = await response.json();
            alert('Error: ' + error.detail);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}