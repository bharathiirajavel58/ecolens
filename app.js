// EcoLens Application JavaScript (TensorFlow.js MobileNet integration)

// DOM Elements
const startScanningBtn = document.getElementById('start-scanning');
const uploadOption = document.getElementById('upload-option');
const cameraOption = document.getElementById('camera-option');
const uploadArea = document.getElementById('upload-area');
const cameraArea = document.getElementById('camera-area');
const analysisArea = document.getElementById('analysis-area');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const startCameraBtn = document.getElementById('start-camera');
const captureBtn = document.getElementById('capture-btn');
const retakeBtn = document.getElementById('retake-btn');
const cameraFeed = document.getElementById('camera-feed');
const cameraCanvas = document.getElementById('camera-canvas');
const resultsSection = document.getElementById('results-section');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const resultImage = document.getElementById('result-image');
const objectName = document.getElementById('object-name');
const carbonValue = document.getElementById('carbon-value');
const footprintVisual = document.getElementById('footprint-visual');
const footprintLabel = document.getElementById('footprint-label');
const manufacturingImpact = document.getElementById('manufacturing-impact');
const transportationImpact = document.getElementById('transportation-impact');
const usageImpact = document.getElementById('usage-impact');
const disposalImpact = document.getElementById('disposal-impact');
const alternativesList = document.getElementById('alternatives-list');
const listenBtn = document.getElementById('listen-btn');
const stopBtn = document.getElementById('stop-btn');
const voiceStatus = document.getElementById('voice-status');
const scanAgainBtn = document.getElementById('scan-again');
const saveResultBtn = document.getElementById('save-result');
const totalScans = document.getElementById('total-scans');
const totalCarbon = document.getElementById('total-carbon');
const savingsPotential = document.getElementById('savings-potential');
const historyList = document.getElementById('history-list');
const impactCategories = document.getElementById('impact-categories');

let stream = null;
let currentImage = null;
let scanHistory = JSON.parse(localStorage.getItem('ecolens_history')) || [];
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let mobilenetModel = null;
let lastResult = null; // store last detection for Listen button

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    updateDashboard();
    // Start loading MobileNet in background
    loadModel();
});

function initializeApp() {
    // Navigation
    setupNavigation();
    
    // Scanner options
    setupScannerOptions();
    
    // File upload
    setupFileUpload();
    
    // Camera
    setupCamera();
    
    // Voice assistant
    setupVoiceAssistant();
    
    // Results actions
    setupResultsActions();
}

// Navigation
function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Scroll to section when clicking nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Start scanning button
    startScanningBtn.addEventListener('click', function() {
        document.querySelector('#scan').scrollIntoView({
            behavior: 'smooth'
        });
    });
}

// Scanner Options
function setupScannerOptions() {
    uploadOption.addEventListener('click', function() {
        setActiveOption('upload');
    });
    
    cameraOption.addEventListener('click', function() {
        setActiveOption('camera');
    });
}

function setActiveOption(option) {
    if (option === 'upload') {
        uploadOption.classList.add('active');
        cameraOption.classList.remove('active');
        uploadArea.classList.remove('hidden');
        cameraArea.classList.add('hidden');
        stopCamera(); // Stop camera if it's running
    } else {
        cameraOption.classList.add('active');
        uploadOption.classList.remove('active');
        cameraArea.classList.remove('hidden');
        uploadArea.classList.add('hidden');
    }
}

// File Upload
function setupFileUpload() {
    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            processImageFile(file);
        }
    });
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.style.backgroundColor = '';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.match('image.*')) {
                processImageFile(file);
            } else {
                alert('Please upload an image file (JPG, PNG, WebP)');
            }
        }
    });
}

function processImageFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        currentImage = e.target.result;
        analyzeImage(currentImage);
    };
    
    reader.readAsDataURL(file);
}

// Camera
function setupCamera() {
    startCameraBtn.addEventListener('click', startCamera);
    captureBtn.addEventListener('click', captureImage);
    retakeBtn.addEventListener('click', retakeImage);
}

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        cameraFeed.srcObject = stream;
        startCameraBtn.classList.add('hidden');
        captureBtn.classList.remove('hidden');
        retakeBtn.classList.add('hidden');
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Unable to access camera. Please check permissions and try again.');
    }
}

function captureImage() {
    const context = cameraCanvas.getContext('2d');
    cameraCanvas.width = cameraFeed.videoWidth;
    cameraCanvas.height = cameraFeed.videoHeight;
    context.drawImage(cameraFeed, 0, 0, cameraFeed.videoWidth, cameraFeed.videoHeight);
    
    currentImage = cameraCanvas.toDataURL('image/jpeg');
    stopCamera();
    captureBtn.classList.add('hidden');
    retakeBtn.classList.remove('hidden');
    
    analyzeImage(currentImage);
}

function retakeImage() {
    retakeBtn.classList.add('hidden');
    startCameraBtn.classList.remove('hidden');
    currentImage = null;
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Load MobileNet model
async function loadModel() {
    try {
        progressText.textContent = "Loading AI model...";
        mobilenetModel = await mobilenet.load();
        console.log('MobileNet loaded');
        progressText.textContent = "Model ready";
        // small visual reset
        setTimeout(() => {
            progressFill.style.width = `0%`;
            progressText.textContent = 'Identifying object...';
        }, 600);
    } catch (err) {
        console.error('Error loading MobileNet:', err);
        progressText.textContent = 'Model load failed (check console)';
    }
}

// Analyze Image using MobileNet
async function analyzeImage(imageData) {
    // Show analysis area
    uploadArea.classList.add('hidden');
    cameraArea.classList.add('hidden');
    analysisArea.classList.remove('hidden');
    resultsSection.classList.add('hidden');

    // Reset progress UI
    progressFill.style.width = `0%`;
    progressText.textContent = 'Preparing analysis...';

    // Small progress animation while loading/processing
    let fakeProgress = 0;
    const fakeInterval = setInterval(() => {
        fakeProgress += Math.random() * 12;
        if (fakeProgress > 70) fakeProgress = 70; // keep room for actual progress
        progressFill.style.width = `${Math.floor(fakeProgress)}%`;
    }, 300);

    // Ensure model loaded
    if (!mobilenetModel) {
        progressText.textContent = "Loading AI model...";
        await loadModel();
    }

    progressText.textContent = 'Analyzing image...';

    // Create image element for model classification
    const img = new Image();
    img.src = imageData;
    await new Promise((res) => { img.onload = res; });

    // Run classification
    try {
        const predictions = await mobilenetModel.classify(img);
        console.log('MobileNet predictions:', predictions);
        // simulate progress to 100%
        clearInterval(fakeInterval);
        let percent = 70;
        const finInterval = setInterval(() => {
            percent += Math.random() * 10;
            if (percent >= 100) {
                percent = 100;
                progressFill.style.width = `100%`;
                clearInterval(finInterval);
                setTimeout(() => {
                    // Map prediction to result and show
                    const top = (predictions && predictions.length > 0) ? predictions[0].className : 'unknown';
                    const mapped = mapPredictionToData(top.toLowerCase());
                    showRealResults(mapped, imageData, predictions);
                }, 500);
            } else {
                progressFill.style.width = `${Math.floor(percent)}%`;
            }
        }, 200);
    } catch (err) {
        clearInterval(fakeInterval);
        console.error('Error during classification:', err);
        progressText.textContent = 'Analysis failed';
        alert('Analysis failed. See console for details.');
    }
}

// Map top prediction to your dataset
function mapPredictionToData(prediction) {
    // mapping with keyword contains
    const mappings = [
        {
            keywords: ["bottle", "water bottle", "soda bottle", "wine bottle", "plastic bottle"],
            name: "Plastic Water Bottle",
            carbonFootprint: 0.082,
            manufacturingImpact: "Production of PET plastic requires petroleum and emits greenhouse gases. The process consumes significant energy and water.",
            transportationImpact: "Typically transported long distances from manufacturing plants to stores, contributing to emissions from freight vehicles.",
            usageImpact: "Single-use nature means repeated production and disposal impacts. If reused, potential leaching of chemicals.",
            disposalImpact: "Only about 30% are recycled. Most end up in landfills or oceans, taking 450+ years to decompose.",
            alternatives: [
                { name: "Reusable Stainless Steel Bottle", icon: "fas fa-wine-bottle" },
                { name: "Glass Water Bottle", icon: "fas fa-glass-whiskey" },
                { name: "BPA-Free Reusable Bottle", icon: "fas fa-recycle" },
                { name: "Filtered Tap Water", icon: "fas fa-faucet" }
            ]
        },
        {
            keywords: ["cell phone", "mobile", "smartphone", "phone"],
            name: "Smartphone",
            carbonFootprint: 55,
            manufacturingImpact: "Extraction of rare earth minerals is energy-intensive. Assembly processes consume significant electricity.",
            transportationImpact: "Components sourced globally, assembled overseas, then shipped worldwide. Complex supply chain.",
            usageImpact: "Charging consumes electricity. Data usage contributes to server farm emissions.",
            disposalImpact: "E-waste is problematic. Only 20% is properly recycled. Toxic components can leach.",
            alternatives: [
                { name: "Refurbished Phone", icon: "fas fa-mobile-alt" },
                { name: "Phone with Modular Design", icon: "fas fa-cubes" },
                { name: "Longer Usage Period", icon: "fas fa-history" },
                { name: "E-Waste Recycling", icon: "fas fa-recycle" }
            ]
        },
        {
            keywords: ["t-shirt", "shirt", "jersey", "clothing", "garment"],
            name: "Cotton T-Shirt",
            carbonFootprint: 2.1,
            manufacturingImpact: "Cotton farming is water-intensive and uses pesticides. Fabric production involves energy-consuming processes.",
            transportationImpact: "Often manufactured overseas and shipped long distances. Supply chain involves multiple transportation stages.",
            usageImpact: "Washing and drying consume water and energy. Frequent replacement increases overall footprint.",
            disposalImpact: "Natural fiber decomposes but dye chemicals may leach. Many end up in landfills.",
            alternatives: [
                { name: "Organic Cotton Clothing", icon: "fas fa-leaf" },
                { name: "Hemp Fabric", icon: "fas fa-seedling" },
                { name: "Bamboo Clothing", icon: "fas fa-tree" },
                { name: "Secondhand Clothing", icon: "fas fa-tshirt" }
            ]
        },
        {
            keywords: ["coffee cup", "paper cup", "cup", "coffee"],
            name: "Paper Coffee Cup",
            carbonFootprint: 0.11,
            manufacturingImpact: "Paper production from trees is resource-intensive. Plastic lining makes recycling difficult.",
            transportationImpact: "Cups are lightweight but often transported long distances to coffee shops.",
            usageImpact: "Single-use design means repeated production impacts. Lid adds additional plastic waste.",
            disposalImpact: "Most end up in landfills due to plastic lining. Decomposition releases methane.",
            alternatives: [
                { name: "Reusable Coffee Mug", icon: "fas fa-mug-hot" },
                { name: "Ceramic Cup", icon: "fas fa-coffee" },
                { name: "Compostable Cup", icon: "fas fa-leaf" },
                { name: "Dine In", icon: "fas fa-utensils" }
            ]
        }
    ];

    const predLower = prediction.toLowerCase();

    for (let item of mappings) {
        for (let k of item.keywords) {
            if (predLower.includes(k)) {
                return item;
            }
        }
    }

    // fallback generic
    return {
        name: prediction.split(',')[0] || prediction,
        carbonFootprint: 1.0,
        manufacturingImpact: "Detailed manufacturing data not available for this item.",
        transportationImpact: "Detailed transportation data not available for this item.",
        usageImpact: "Detailed usage data not available for this item.",
        disposalImpact: "Detailed disposal data not available for this item.",
        alternatives: []
    };
}

// Show results in UI (no auto-voice; listen button triggers speech)
function showRealResults(result, imageData, predictions = []) {
    analysisArea.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    // Set result image
    resultImage.src = imageData;
    
    // Update UI with results
    objectName.textContent = result.name;
    carbonValue.textContent = `${result.carbonFootprint} kg CO₂`;
    
    // Set footprint visualization
    let footprintLevel = 'low';
    if (result.carbonFootprint > 10) footprintLevel = 'high';
    else if (result.carbonFootprint > 3) footprintLevel = 'medium';
    
    footprintVisual.className = 'footprint-fill';
    footprintVisual.classList.add(footprintLevel);
    footprintVisual.style.width = `${Math.min(result.carbonFootprint * 5, 100)}%`;
    
    footprintLabel.textContent = `${footprintLevel.charAt(0).toUpperCase() + footprintLevel.slice(1)} Impact`;
    if (footprintLevel === 'low') footprintLabel.style.color = '#2ecc71';
    else if (footprintLevel === 'medium') footprintLabel.style.color = '#f39c12';
    else footprintLabel.style.color = '#e74c3c';
    
    // Update impact details
    manufacturingImpact.textContent = result.manufacturingImpact;
    transportationImpact.textContent = result.transportationImpact;
    usageImpact.textContent = result.usageImpact;
    disposalImpact.textContent = result.disposalImpact;
    
    // Update alternatives
    updateAlternatives(result.alternatives);

    // Save to history
    saveToHistory({
        objectName: result.name,
        carbonFootprint: result.carbonFootprint
    });

    // Store last result for Listen button
    lastResult = {
        name: result.name,
        carbon: result.carbonFootprint,
        manufacturing: result.manufacturingImpact,
        alternatives: result.alternatives
    };

    // Update dashboard counters
    updateDashboard();

    // Enable/disable listen/stop buttons appropriately
    listenBtn.disabled = false;
    stopBtn.disabled = true;
    voiceStatus.textContent = "Ready to explain";
}

// Update alternatives list in UI
function updateAlternatives(alternatives) {
    alternativesList.innerHTML = '';
    
    if (!alternatives || alternatives.length === 0) {
        alternativesList.innerHTML = '<p class="no-alternatives">No alternatives available.</p>';
        return;
    }
    
    alternatives.forEach(alt => {
        const altElement = document.createElement('div');
        altElement.className = 'alternative-item';
        altElement.innerHTML = `
            <i class="${alt.icon}"></i>
            <h4>${alt.name}</h4>
        `;
        alternativesList.appendChild(altElement);
    });
}

// Voice Assistant
function setupVoiceAssistant() {
    listenBtn.addEventListener('click', startVoiceExplanation);
    stopBtn.addEventListener('click', stopVoiceExplanation);

    // Initially disabled until a result exists
    listenBtn.disabled = true;
    stopBtn.disabled = true;
}

function startVoiceExplanation() {
    if (!lastResult) {
        alert('No result to explain. Please scan an item first.');
        return;
    }

    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    
    const object = lastResult.name;
    const carbon = lastResult.carbon;
    
    let text = `The ${object} has an estimated carbon footprint of ${carbon} kilograms of CO2. `;
    text += `${lastResult.manufacturing} `;
    if (lastResult.alternatives && lastResult.alternatives.length > 0) {
        text += `Eco-friendly alternatives include `;
        const altNames = lastResult.alternatives.map(a => a.name).join(', ');
        text += altNames + '.';
    }
    
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 0.95;
    currentUtterance.pitch = 1;
    currentUtterance.volume = 1;
    
    currentUtterance.onstart = function() {
        voiceStatus.textContent = "Speaking...";
        listenBtn.disabled = true;
        stopBtn.disabled = false;
    };
    
    currentUtterance.onend = function() {
        voiceStatus.textContent = "Finished explanation";
        listenBtn.disabled = false;
        stopBtn.disabled = true;
    };
    
    speechSynthesis.speak(currentUtterance);
}

function stopVoiceExplanation() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        voiceStatus.textContent = "Stopped";
        listenBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

// Results Actions
function setupResultsActions() {
    scanAgainBtn.addEventListener('click', function() {
        resultsSection.classList.add('hidden');
        setActiveOption('upload');
        uploadArea.classList.remove('hidden');
        currentImage = null;
        fileInput.value = '';
        
        // Scroll to scanner
        document.querySelector('#scan').scrollIntoView({
            behavior: 'smooth'
        });

        // Reset last result
        lastResult = null;
        listenBtn.disabled = true;
        stopBtn.disabled = true;
        voiceStatus.textContent = "Ready to explain";
    });
    
    saveResultBtn.addEventListener('click', function() {
        alert('Result saved to your dashboard!');
        updateDashboard();
    });
}

// History and Dashboard
function saveToHistory(results) {
    const historyItem = {
        id: Date.now(),
        name: results.objectName,
        carbon: results.carbonFootprint,
        image: currentImage,
        date: new Date().toLocaleDateString()
    };
    
    scanHistory.unshift(historyItem);
    
    // Keep only last 10 items
    if (scanHistory.length > 10) {
        scanHistory = scanHistory.slice(0, 10);
    }
    
    localStorage.setItem('ecolens_history', JSON.stringify(scanHistory));
}

function updateDashboard() {
    // Update stats
    totalScans.textContent = scanHistory.length;
    
    const totalCarbonValue = scanHistory.reduce((sum, item) => sum + (+item.carbon || 0), 0);
    totalCarbon.textContent = `${totalCarbonValue.toFixed(1)} kg`;
    
    // Calculate potential savings (assuming 30% reduction with alternatives)
    const savings = totalCarbonValue * 0.3;
    savingsPotential.textContent = `${savings.toFixed(1)} kg`;
    
    // Update history list
    updateHistoryList();
    
    // Update impact categories
    updateImpactCategories();
}

function updateHistoryList() {
    historyList.innerHTML = '';
    
    if (scanHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">No scan history yet. Start scanning items to see your history here.</p>';
        return;
    }
    
    scanHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="history-info">
                <h4>${item.name}</h4>
                <p>${item.carbon} kg CO₂ • ${item.date}</p>
            </div>
        `;
        historyList.appendChild(historyItem);
    });
}

function updateImpactCategories() {
    // In a real app, this would analyze the history to determine categories
    const mockCategories = [
        { name: "Plastics", value: 35 },
        { name: "Electronics", value: 25 },
        { name: "Textiles", value: 20 },
        { name: "Paper", value: 15 },
        { name: "Other", value: 5 }
    ];
    
    impactCategories.innerHTML = '';
    
    mockCategories.forEach(cat => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'impact-category';
        categoryElement.innerHTML = `
            <span>${cat.name}</span>
            <div class="category-bar">
                <div class="category-fill" style="width: ${cat.value}%; background-color: ${getCategoryColor(cat.name)};"></div>
            </div>
            <span>${cat.value}%</span>
        `;
        impactCategories.appendChild(categoryElement);
    });
}

function getCategoryColor(category) {
    const colors = {
        "Plastics": "#e74c3c",
        "Electronics": "#3498db",
        "Textiles": "#9b59b6",
        "Paper": "#f1c40f",
        "Other": "#95a5a6"
    };
    
    return colors[category] || "#95a5a6";
}
