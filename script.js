// Task history and navigation variables
let taskHistory = [];
let currentTaskIndex = -1;
const maxHistorySize = 50; // Maximum number of tasks to store in history

// Default verb array in case the JSON file fails to load
const defaultVerbs = ['anbieten', 'anfangen', 'ankommen'];

// Arrays that will hold our data
let verbs = [...defaultVerbs]; // Will contain just the infinitive forms
let verbsData = []; // Will contain the full conjugation data

// Store original arrays for restoring order
const originalPersons = ['1. Person', '2. Person', '3. Person'];
const originalNumeri = ['Singular', 'Plural'];
const originalTempora = ['Präsens', 'Präteritum', 'Perfekt', 'Plusquamperfekt', 'Futur I', 'Futur II'];
const originalGenera = ['Aktiv', 'Passiv'];
const originalModi = ['Indikativ', 'Konjunktiv I', 'Konjunktiv II']; // Removed 'Imperativ'

// Options object for easier reference
const options = {
    person: [...originalPersons],
    numerus: [...originalNumeri],
    tempus: [...originalTempora],
    genus: [...originalGenera],
    modus: [...originalModi]
};

// Use these arrays in the random selection logic
let persons = [...originalPersons];
let numeri = [...originalNumeri];
let tempora = [...originalTempora];
let genera = [...originalGenera];
let modi = [...originalModi];

// Map heading checkbox IDs to section names
const sectionMap = {
    'person-all': 'person',
    'numerus-all': 'numerus',
    'tempus-all': 'tempus',
    'genus-all': 'genus',
    'modus-all': 'modus'
};

// Solution display logic
let currentSolution = "";
let solutionVisible = false;

// Initialize the modal variables at the top level for global access
let gear, modal, closeBtn, prevButton, nextButton;

// Main initialization function to set up event handlers
document.addEventListener('DOMContentLoaded', () => {
    // Load verbs from JSON
    fetch('verbs.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                console.log('Loaded verbs from verbs.json:', data.length);
                
                // Store the full data for later use
                verbsData = data;
                
                // Extract just the infinitive forms for the verbs array
                verbs = data.map(verb => verb.Infinitiv).filter(Boolean);
                
                console.log(`Loaded ${verbs.length} verb infinitives`);
            } else {
                console.warn('verbs.json did not contain a valid array of verbs. Using default verbs.');
            }
        })
        .catch(error => {
            console.warn('Failed to load verbs.json:', error);
            console.log('Using default verbs instead.');
        });

    // Initialize UI elements
    gear = document.getElementById('settings-gear');
    modal = document.getElementById('settings-modal');
    closeBtn = document.getElementById('settings-modal-close');
    prevButton = document.getElementById('prev-task');
    nextButton = document.getElementById('next-task');
    
    // Set up click handlers for UI elements
    setupClickHandlers();
    
    // Initial updates
    updateSectionVisibility();
    updateOptionArrays();
    
    // Initialize with a random task
    generateRandomTask();
});

// Function to set up all click handlers
function setupClickHandlers() {
    // Solution click handler
    const solutionElement = document.getElementById('solution');
    if (solutionElement) {
        solutionElement.classList.add('hidden-solution');
        solutionElement.addEventListener('click', (e) => {
            e.stopPropagation();
            solutionElement.classList.toggle('hidden-solution');
        });
    }
    
    // Modal open/close handlers
    if (gear) {
        gear.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.style.display = 'block';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
    
    // Navigation button handlers
    if (prevButton) {
        prevButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showPreviousTask();
            return false; // Prevent default and further propagation
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showNextTask();
            return false; // Prevent default and further propagation
        });
    }
    
    // "Select all" checkbox handlers
    document.getElementById("person-all")?.addEventListener("change", function() {
        document.querySelectorAll(".person-item").forEach(item => {
            item.checked = this.checked;
        });
        updateOptionArrays();
        updateSectionVisibility(); // Only top-level settings affect visibility
    });
    
    document.getElementById("numerus-all")?.addEventListener("change", function() {
        document.querySelectorAll(".numerus-item").forEach(item => {
            item.checked = this.checked;
        });
        updateOptionArrays();
        updateSectionVisibility(); // Only top-level settings affect visibility
    });
    
    document.getElementById("tempus-all")?.addEventListener("change", function() {
        document.querySelectorAll(".tempus-item").forEach(item => {
            item.checked = this.checked;
        });
        updateOptionArrays();
        updateSectionVisibility(); // Only top-level settings affect visibility
    });
    
    document.getElementById("genus-all")?.addEventListener("change", function() {
        document.querySelectorAll(".genus-item").forEach(item => {
            item.checked = this.checked;
        });
        updateOptionArrays();
        updateSectionVisibility(); // Only top-level settings affect visibility
    });
    
    document.getElementById("modus-all")?.addEventListener("change", function() {
        document.querySelectorAll(".modus-item").forEach(item => {
            item.checked = this.checked;
        });
        updateOptionArrays();
        updateSectionVisibility(); // Only top-level settings affect visibility
    });
    
    // Individual item checkbox handlers - only update arrays, not visibility
    document.querySelectorAll('.person-item, .numerus-item, .tempus-item, .genus-item, .modus-item')
        .forEach(cb => {
            cb.addEventListener('change', () => {
                updateOptionArrays();
                // Do NOT call updateSectionVisibility() here
            });
        });
    
    // Add event listeners to all item checkboxes for section visibility
    document.querySelectorAll('.person-item, .numerus-item, .tempus-item, .genus-item, .modus-item')
        .forEach(cb => {
            cb.addEventListener('change', () => {
                updateOptionArrays();
                updateSectionVisibility(); // Add this line
            });
        });
    
    // Individual click handlers for grid items (except solution)
    document.querySelectorAll(".grid-item").forEach(item => {
        if (item.id !== "solution") {
            item.addEventListener("click", function(e) {
                e.stopPropagation(); // Prevent global click
                generateRandomTask();
            });
        }
    });
    
    // Global click handler to regenerate task
    document.addEventListener('click', (e) => {
        // Don't regenerate if clicking on special elements
        if (e.target === modal || 
            (modal && modal.contains(e.target)) || 
            e.target === gear || 
            e.target === document.getElementById('solution') ||
            e.target === prevButton ||
            e.target === nextButton ||
            e.target.closest('.controls')) { // Exclude clicks on the controls container
            return;
        }
        
        // Don't regenerate if clicking on form elements
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'BUTTON' ||
            e.target.tagName === 'LABEL' ||
            e.target.tagName === 'SELECT') {
            return;
        }
        
        generateRandomTask();
    });
}

// Function to navigate to previous task
function showPreviousTask() {
    if (currentTaskIndex > 0) {
        currentTaskIndex--;
        displayTaskFromHistory(taskHistory[currentTaskIndex]);
        updateNavigationButtons();
    }
}

// Function to navigate to next task
function showNextTask() {
    if (currentTaskIndex < taskHistory.length - 1) {
        currentTaskIndex++;
        displayTaskFromHistory(taskHistory[currentTaskIndex]);
        updateNavigationButtons();
    } else {
        // If at the end of history, generate a new task
        generateRandomTask();
    }
}

// Function to display a task from history
function displayTaskFromHistory(task) {
    document.getElementById("verb").textContent = task.verb;
    document.getElementById("person").textContent = task.person;
    document.getElementById("numerus").textContent = task.numerus;
    document.getElementById("tempus").textContent = task.tempus;
    document.getElementById("genus").textContent = task.genus;
    document.getElementById("modus").textContent = task.modus;
    
    const solutionElement = document.getElementById("solution");
    if (solutionElement) {
        solutionElement.innerText = task.solution;
        solutionElement.classList.add('hidden-solution');
    }
}

// Function to update navigation button states
function updateNavigationButtons() {
    if (prevButton) {
        prevButton.disabled = currentTaskIndex <= 0;
    }
    
    if (nextButton) {
        nextButton.disabled = currentTaskIndex >= taskHistory.length - 1;
    }
}

// Function to update section visibility based on TOP-LEVEL checkboxes only
function updateSectionVisibility() {
    const sections = ['person', 'numerus', 'tempus', 'genus', 'modus'];
    
    sections.forEach(section => {
        const checkboxId = `${section}-all`;
        const checkbox = document.getElementById(checkboxId);
        
        if (checkbox) {
            const isVisible = checkbox.checked;
            const rowContainer = document.getElementById(`row-${section}`);
            
            if (rowContainer) {
                if (isVisible) {
                    rowContainer.style.display = '';
                } else {
                    rowContainer.style.display = 'none';
                }
            }
        }
    });
}

// Function to get enabled options based on checkboxes
function getEnabledOptions(category) {
    const checkboxes = document.querySelectorAll(`.${category}-item:checked`);
    return Array.from(checkboxes).map(checkbox => checkbox.nextSibling.textContent.trim());
}

// Utility to update an array based on checked checkboxes
function updateArrayFromCheckboxes(selector, originalArray) {
    const checkedLabels = Array.from(document.querySelectorAll(selector))
        .filter(cb => cb.checked)
        .map(cb => cb.nextSibling.textContent.trim());
    // Keep original order
    return originalArray.filter(item => checkedLabels.includes(item));
}

// Update arrays when any item checkbox changes
function updateOptionArrays() {
    persons = updateArrayFromCheckboxes('.person-item', originalPersons);
    numeri = updateArrayFromCheckboxes('.numerus-item', originalNumeri);
    tempora = updateArrayFromCheckboxes('.tempus-item', originalTempora);
    genera = updateArrayFromCheckboxes('.genus-item', originalGenera);
    modi = updateArrayFromCheckboxes('.modus-item', originalModi);
}

/**
 * Generates a conjugated form of the given verb based on the selected parameters.
 * Uses the verbsData array to find the correct conjugation if available.
 */
function generateVerbConjugation(verb, person, numerus, tempus, genus, modus) {
    // Try to find the verb in our loaded data
    const verbData = verbsData.find(v => v.Infinitiv === verb);
    
    if (verbData) {
        // Convert the parameters to the key format used in the JSON
        const modusPrefix = modus === 'Indikativ' ? 'IND' : 
                          modus === 'Konjunktiv I' ? 'KONJ1' :
                          modus === 'Konjunktiv II' ? 'KONJ2' : '';
        
        const tempusCode = tempus === 'Präsens' ? 'PRAES' :
                         tempus === 'Präteritum' ? 'PRAET' :
                         tempus === 'Perfekt' ? 'PERF' :
                         tempus === 'Plusquamperfekt' ? 'PLUSQ' :
                         tempus === 'Futur I' ? 'FUT1' :
                         tempus === 'Futur II' ? 'FUT2' : '';
        
        const genusCode = genus === 'Aktiv' ? 'AKT' : 'PASS';
        
        const numerusCode = numerus === 'Singular' ? 'S' : 'P';
        
        const personCode = person === '1. Person' ? '1' :
                         person === '2. Person' ? '2' : '3';
        
        const key = `${modusPrefix}_${tempusCode}_${genusCode}_${numerusCode}_${personCode}`;
        
        // Return the conjugation from the data if it exists
        if (verbData[key]) {
            return verbData[key];
        }
    }
    
    // Fallback basic conjugation logic
    return `[${verb} - ${person} ${numerus} ${tempus} ${genus} ${modus}]`;
}

// Function to generate a random task
function generateRandomTask() {
    console.log('Generating random task');
    
    // Get a random verb from the loaded verbs data
    let randomVerbIndex, verbName, verbObj;
    
    // Use the appropriate data source
    if (verbsData.length > 0) {
        randomVerbIndex = Math.floor(Math.random() * verbsData.length);
        verbObj = verbsData[randomVerbIndex];
        verbName = verbObj.Infinitiv;
        // Check if this verb has transitivity info, otherwise default
        if (typeof verbObj.transitiv === 'undefined') {
            // Look for it in our sample data
            const sampleVerb = verbs.find(v => v.name === verbName);
            verbObj.transitiv = sampleVerb ? sampleVerb.transitiv : 1;
        }
    } else {
        // Use the sample verb array
        randomVerbIndex = Math.floor(Math.random() * verbs.length);
        verbObj = verbs[randomVerbIndex];
        verbName = verbObj.name || verbObj;
        verbObj.transitiv = verbObj.transitiv || 1; // Default to transitive
    }
    
    // Update verb display
    document.getElementById("verb").textContent = verbName;
    
    // Get enabled options for each category
    let enabledPerson = getEnabledOptions("person");
    let enabledNumerus = getEnabledOptions("numerus");
    let enabledTempus = getEnabledOptions("tempus");
    
    // For genus, check if the verb is transitive or not
    let enabledGenus = getEnabledOptions("genus");
    if (verbObj.transitiv === 0) { // If intransitive, remove Passiv
        enabledGenus = enabledGenus.filter(g => g !== "Passiv");
        if (enabledGenus.length === 0) {
            enabledGenus = ["Aktiv"];
        }
    }
    
    let enabledModus = getEnabledOptions("modus");
    
    // If any category has no enabled options, use all options for that category
    if (enabledPerson.length === 0) enabledPerson = originalPersons;
    if (enabledNumerus.length === 0) enabledNumerus = originalNumeri;
    if (enabledTempus.length === 0) enabledTempus = originalTempora;
    if (enabledGenus.length === 0) enabledGenus = originalGenera;
    if (enabledModus.length === 0) enabledModus = originalModi;
    
    // Select a random option from each category
    const randomPerson = enabledPerson[Math.floor(Math.random() * enabledPerson.length)];
    const randomNumerus = enabledNumerus[Math.floor(Math.random() * enabledNumerus.length)];
    const randomTempus = enabledTempus[Math.floor(Math.random() * enabledTempus.length)];
    const randomGenus = enabledGenus[Math.floor(Math.random() * enabledGenus.length)];
    const randomModus = enabledModus[Math.floor(Math.random() * enabledModus.length)];
    
    // Update the UI
    document.getElementById("person").textContent = randomPerson;
    document.getElementById("numerus").textContent = randomNumerus;
    document.getElementById("tempus").textContent = randomTempus;
    document.getElementById("genus").textContent = randomGenus;
    document.getElementById("modus").textContent = randomModus;
    
    // Reset solution and generate new solution
    const solutionElement = document.getElementById("solution");
    let conjugatedVerb = "";
    if (solutionElement) {
        conjugatedVerb = generateVerbConjugation(verbName, randomPerson, randomNumerus, randomTempus, randomGenus, randomModus);
        solutionElement.innerText = conjugatedVerb;
        solutionElement.classList.add('hidden-solution');
    }
    
    // Create task object and store in history
    const task = {
        verb: verbName,
        person: randomPerson,
        numerus: randomNumerus,
        tempus: randomTempus,
        genus: randomGenus,
        modus: randomModus,
        solution: conjugatedVerb
    };
    
    // Remove any future tasks if navigating from middle of history
    if (currentTaskIndex < taskHistory.length - 1) {
        taskHistory = taskHistory.slice(0, currentTaskIndex + 1);
    }
    
    // Add new task to history
    taskHistory.push(task);
    
    // Limit history size
    if (taskHistory.length > maxHistorySize) {
        taskHistory.shift();
        // Since we removed the first item, adjust index
        currentTaskIndex = Math.max(0, currentTaskIndex - 1);
    }
    
    // Update current index
    currentTaskIndex = taskHistory.length - 1;
    
    // Update navigation buttons
    updateNavigationButtons();
}