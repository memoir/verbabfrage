// Task history and navigation variables
let taskHistory = [];
let currentTaskIndex = -1;
const maxHistorySize = 50; // Maximum number of tasks to store in history

// Default verb array in case the JSON file fails to load
const defaultVerbs = ['anbieten', 'anfangen', 'ankommen'];

// Arrays that will hold our data
let verbs = []; // Will contain just the infinitive forms - start empty
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

// Loading state flag
let dataLoaded = false;
let appInitialized = false;

// Create a loading indicator
function showLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.innerHTML = 'Loading verb data...';
    loadingDiv.style.position = 'fixed';
    loadingDiv.style.top = '50%';
    loadingDiv.style.left = '50%';
    loadingDiv.style.transform = 'translate(-50%, -50%)';
    loadingDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingDiv.style.color = 'white';
    loadingDiv.style.padding = '20px';
    loadingDiv.style.borderRadius = '10px';
    loadingDiv.style.zIndex = '1000';
    document.body.appendChild(loadingDiv);
}

// Remove the loading indicator
function hideLoadingIndicator() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Main initialization function to set up event handlers
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting app initialization');
    
    // Show loading indicator immediately
    showLoadingIndicator();
    
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
    
    // Load verbs from JSON first, then initialize the app
    loadVerbData()
        .then(() => {
            console.log('Verb data loaded successfully');
            dataLoaded = true;
            initializeApp();
        })
        .catch(error => {
            console.error('Failed to load verb data:', error);
            // Use default verbs as fallback
            verbs = [...defaultVerbs];
            verbsData = [];
            dataLoaded = true; // Consider data "loaded" even if it's defaults
            
            console.warn('Using default verbs instead.');
            initializeApp();
        });
});

// Function to load verb data
function loadVerbData() {
    return new Promise((resolve, reject) => {
        console.log('Loading verb data from JSON');
        
        // Set a timeout to make sure we don't wait forever
        const timeout = setTimeout(() => {
            reject(new Error('Timeout while loading verb data'));
        }, 10000); // 10 seconds timeout
        
        fetch('verbs.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                clearTimeout(timeout);
                
                if (Array.isArray(data) && data.length > 0) {
                    console.log('Loaded verbs from verbs.json:', data.length);
                    
                    // Store the full data for later use
                    verbsData = data;
                    
                    // Extract just the infinitive forms for the verbs array
                    verbs = data.map(verb => verb.Infinitiv).filter(Boolean);
                    
                    console.log(`Loaded ${verbs.length} verb infinitives`);
                    resolve();
                } else {
                    console.warn('verbs.json did not contain a valid array of verbs.');
                    reject(new Error('Invalid verb data'));
                }
            })
            .catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
    });
}

// Function to initialize the app once data is loaded
function initializeApp() {
    if (dataLoaded && !appInitialized) {
        console.log('Initializing app with loaded data');
        
        // Hide loading indicator
        hideLoadingIndicator();
        
        // Initialize with a random task
        generateRandomTask();
        
        appInitialized = true;
    }
}

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
    // Check if verb is intransitive and handle passive voice accordingly
    let lookupVerbData = verbsData.find(v => v.Infinitiv === verb);
    if (lookupVerbData && lookupVerbData.transitiv === 0 && genus === 'Passiv') {
        return `[${verb} ist intransitiv und kann nicht im Passiv verwendet werden]`;
    }

    // These forms should be read directly from the JSON data, not generated:
    // - Indikativ Präsens Aktiv
    // - Indikativ Präteritum Aktiv
    // - Konjunktiv I Präsens Aktiv
    // - Konjunktiv II Präsens Aktiv
    if (genus === 'Aktiv' && 
        ((modus === 'Indikativ' && (tempus === 'Präsens' || tempus === 'Präteritum')) ||
         (modus === 'Konjunktiv I' && tempus === 'Präsens') ||
         (modus === 'Konjunktiv II' && tempus === 'Präsens'))) {
        // Try to find the form directly in the JSON data
        const key = constructVerbDataKey(modus, tempus, genus, numerus, person);
        
        if (lookupVerbData && lookupVerbData[key]) {
            return lookupVerbData[key];
        }
    }

    // Handle special cases for tenses that need specific handling
    if (modus === 'Indikativ') {
        if (genus === 'Aktiv') {
            if (tempus === 'Perfekt') {
                return generatePerfectIndicative(verb, person, numerus);
            } else if (tempus === 'Plusquamperfekt') {
                return generatePlusquamperfektIndicative(verb, person, numerus);
            } else if (tempus === 'Futur I') {
                return generateFuturIIndicative(verb, person, numerus);
            } else if (tempus === 'Futur II') {
                return generateFuturIIIndicative(verb, person, numerus);
            }
        } else if (genus === 'Passiv') {
            // Generate all passive forms directly
            if (tempus === 'Präsens') {
                return generatePassivPraesensIndicative(verb, person, numerus);
            } else if (tempus === 'Präteritum') {
                return generatePassivPraeteritumIndicative(verb, person, numerus);
            } else if (tempus === 'Perfekt') {
                return generatePassivPerfektIndicative(verb, person, numerus);
            } else if (tempus === 'Plusquamperfekt') {
                return generatePassivPlusquamperfektIndicative(verb, person, numerus);
            } else if (tempus === 'Futur I') {
                return generatePassivFuturIIndicative(verb, person, numerus);
            } else if (tempus === 'Futur II') {
                return generatePassivFuturIIIndicative(verb, person, numerus);
            }
        }
    } else if (modus === 'Konjunktiv I') {
        if (genus === 'Aktiv') {
            // For Konjunktiv I Präsens Aktiv we're already trying to get it from JSON above
            // Only generate other forms
            if (tempus === 'Perfekt' || tempus === 'Präteritum' || tempus === 'Plusquamperfekt') {
                return generateKonjunktiv1PerfektAktiv(verb, person, numerus);
            } else if (tempus === 'Futur I') {
                return generateKonjunktiv1FuturIAktiv(verb, person, numerus);
            } else if (tempus === 'Futur II') {
                return generateKonjunktiv1FuturIIAktiv(verb, person, numerus);
            }
        } else if (genus === 'Passiv') {
            // Generate all Konjunktiv I passive forms directly
            if (tempus === 'Präsens') {
                return generateKonjunktiv1PraesensPassiv(verb, person, numerus);
            } else if (tempus === 'Perfekt' || tempus === 'Präteritum' || tempus === 'Plusquamperfekt') {
                return generateKonjunktiv1PerfektPassiv(verb, person, numerus);
            } else if (tempus === 'Futur I') {
                return generateKonjunktiv1FuturIPassiv(verb, person, numerus);
            } else if (tempus === 'Futur II') {
                return generateKonjunktiv1FuturIIPassiv(verb, person, numerus);
            }
        }
    } else if (modus === 'Konjunktiv II') {
        if (genus === 'Aktiv') {
            // For Konjunktiv II Präsens Aktiv we're already trying to get it from JSON above
            // Only generate other forms
            if (tempus === 'Perfekt' || tempus === 'Präteritum' || tempus === 'Plusquamperfekt') {
                return generateKonjunktiv2PerfektAktiv(verb, person, numerus);
            } else if (tempus === 'Futur I') {
                return generateKonjunktiv2FuturIAktiv(verb, person, numerus);
            } else if (tempus === 'Futur II') {
                return generateKonjunktiv2FuturIIAktiv(verb, person, numerus);
            }
        } else if (genus === 'Passiv') {
            // Generate all Konjunktiv II passive forms directly
            if (tempus === 'Präsens') {
                return generateKonjunktiv2PraesensPassiv(verb, person, numerus);
            } else if (tempus === 'Perfekt' || tempus === 'Präteritum' || tempus === 'Plusquamperfekt') {
                return generateKonjunktiv2PerfektPassiv(verb, person, numerus);
            } else if (tempus === 'Futur I') {
                return generateKonjunktiv2FuturIPassiv(verb, person, numerus);
            } else if (tempus === 'Futur II') {
                return generateKonjunktiv2FuturIIPassiv(verb, person, numerus);
            }
        }
    }
    
    // Try to find the verb in our loaded data
    lookupVerbData = verbsData.find(v => v.Infinitiv === verb);
    
    if (lookupVerbData) {
        // Convert the parameters to the key format used in the JSON
        const key = constructVerbDataKey(modus, tempus, genus, numerus, person);
        
        // Return the conjugation from the data if it exists
        if (lookupVerbData[key]) {
            return lookupVerbData[key];
        }
    }
    
    // Fallback basic conjugation logic
    return `[${verb} - ${person} ${numerus} ${tempus} ${genus} ${modus}]`;
}

/**
 * Helper function to construct the key format used in the JSON data
 */
function constructVerbDataKey(modus, tempus, genus, numerus, person) {
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
    
    return `${modusPrefix}_${tempusCode}_${genusCode}_${numerusCode}_${personCode}`;
}

/**
 * Generates the Präsens tense in Indicative mood, Passive voice
 * Formula: "werden" conjugated in present tense + past participle
 */
function generatePassivPraesensIndicative(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Präsens Passiv - no PP available]`;
    }
    
    let werdenConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                werdenConjugated = "ich werde";
                break;
            case "2. Person":
                werdenConjugated = "du wirst";
                break;
            case "3. Person":
                werdenConjugated = "er/sie/es wird";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                werdenConjugated = "wir werden";
                break;
            case "2. Person":
                werdenConjugated = "ihr werdet";
                break;
            case "3. Person":
                werdenConjugated = "sie werden";
                break;
        }
    }
    
    return `${werdenConjugated} ${pastParticiple}`;
}

/**
 * Generates the Präteritum tense in Indicative mood, Passive voice
 * Formula: "werden" conjugated in past tense + past participle
 */
function generatePassivPraeteritumIndicative(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Präteritum Passiv - no PP available]`;
    }
    
    let wurdeConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                wurdeConjugated = "ich wurde";
                break;
            case "2. Person":
                wurdeConjugated = "du wurdest";
                break;
            case "3. Person":
                wurdeConjugated = "er/sie/es wurde";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                wurdeConjugated = "wir wurden";
                break;
            case "2. Person":
                wurdeConjugated = "ihr wurdet";
                break;
            case "3. Person":
                wurdeConjugated = "sie wurden";
                break;
        }
    }
    
    return `${wurdeConjugated} ${pastParticiple}`;
}

/**
 * Generates the Perfekt tense in Indicative mood, Passive voice
 * Formula: "sein" conjugated in present tense + past participle + "worden"
 */
function generatePassivPerfektIndicative(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Perfekt Passiv - no PP available]`;
    }
    
    let seinConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                seinConjugated = "ich bin";
                break;
            case "2. Person":
                seinConjugated = "du bist";
                break;
            case "3. Person":
                seinConjugated = "er/sie/es ist";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                seinConjugated = "wir sind";
                break;
            case "2. Person":
                seinConjugated = "ihr seid";
                break;
            case "3. Person":
                seinConjugated = "sie sind";
                break;
        }
    }
    
    return `${seinConjugated} ${pastParticiple} worden`;
}

/**
 * Generates the Futur I tense in Indicative mood, Passive voice
 * Formula: "werden" conjugated in present tense + past participle + "werden"
 */
function generatePassivFuturIIndicative(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Futur I Passiv - no PP available]`;
    }
    
    let werdenConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                werdenConjugated = "ich werde";
                break;
            case "2. Person":
                werdenConjugated = "du wirst";
                break;
            case "3. Person":
                werdenConjugated = "er/sie/es wird";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                werdenConjugated = "wir werden";
                break;
            case "2. Person":
                werdenConjugated = "ihr werdet";
                break;
            case "3. Person":
                werdenConjugated = "sie werden";
                break;
        }
    }
    
    return `${werdenConjugated} ${pastParticiple} werden`;
}

/**
 * Generates the Futur II tense in Indicative mood, Passive voice
 * Formula: "werden" conjugated in present tense + past participle + "worden sein"
 */
function generatePassivFuturIIIndicative(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Futur II Passiv - no PP available]`;
    }
    
    let werdenConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                werdenConjugated = "ich werde";
                break;
            case "2. Person":
                werdenConjugated = "du wirst";
                break;
            case "3. Person":
                werdenConjugated = "er/sie/es wird";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                werdenConjugated = "wir werden";
                break;
            case "2. Person":
                werdenConjugated = "ihr werdet";
                break;
            case "3. Person":
                werdenConjugated = "sie werden";
                break;
        }
    }
    
    return `${werdenConjugated} ${pastParticiple} worden sein`;
}

/**
 * Generates the Perfect tense in Indicative mood.
 * Formula: auxiliary verb (haben/sein) conjugated in present tense + past participle
 */
function generatePerfectIndicative(verb, person, numerus) {
    // Get the verb data
    const verbData = verbsData.find(v => v.Infinitiv === verb);
    
    if (!verbData) {
        return `[${verb} - ${person} ${numerus} Perfekt]`;
    }
    
    // Get past participle (PP) from verb data
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        console.error(`No past participle (PP) found for ${verb}`);
        return `[${verb} - ${person} ${numerus} Perfekt - no PP available]`;
    }
    
    // Get auxiliary verb (HV) from verb data, default to "haben"
    // Now specifically checking for the Infinitive of the HV
    let auxiliaryVerb = "haben"; // Default

    if (verbData.HV) {
        // Check if HV is an infinitive form or just h/s abbreviation
        if (verbData.HV === "haben" || verbData.HV === "sein") {
            auxiliaryVerb = verbData.HV.toLowerCase();
        } else if (verbData.HV === "h") {
            auxiliaryVerb = "haben";
        } else if (verbData.HV === "s") {
            auxiliaryVerb = "sein";
        }
        console.log(`Using auxiliary verb: ${auxiliaryVerb} for ${verb}`);
    }
    
    // Generate the conjugated form based on person and number
    let auxiliaryConjugated = "";
    
    if (auxiliaryVerb === "haben") {
        if (numerus === "Singular") {
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "ich habe";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "du hast";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "er/sie/es hat";
                    break;
            }
        } else { // Plural
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "wir haben";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "ihr habt";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "sie haben";
                    break;
            }
        }
    } else if (auxiliaryVerb === "sein") {
        if (numerus === "Singular") {
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "ich bin";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "du bist";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "er/sie/es ist";
                    break;
            }
        } else { // Plural
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "wir sind";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "ihr seid";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "sie sind";
                    break;
            }
        }
    } else {
        // Fallback in case of unknown auxiliary
        return `[${verb} - ${person} ${numerus} Perfekt - unknown auxiliary "${auxiliaryVerb}"]`;
    }
    
    return `${auxiliaryConjugated} ${pastParticiple}`;
}

/**
 * Generates the Plusquamperfekt tense in Indicative mood.
 * Formula: auxiliary verb (haben/sein) conjugated in past tense + past participle
 */
function generatePlusquamperfektIndicative(verb, person, numerus) {
    // Get the verb data
    const verbData = verbsData.find(v => v.Infinitiv === verb);
    
    if (!verbData) {
        return `[${verb} - ${person} ${numerus} Plusquamperfekt]`;
    }
    
    // Get past participle (PP) from verb data
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        console.error(`No past participle (PP) found for ${verb}`);
        return `[${verb} - ${person} ${numerus} Plusquamperfekt - no PP available]`;
    }
    
    // Get auxiliary verb (HV) from verb data, default to "haben"
    let auxiliaryVerb = "haben"; // Default

    if (verbData.HV) {
        // Check if HV is an infinitive form or just h/s abbreviation
        if (verbData.HV === "haben" || verbData.HV === "sein") {
            auxiliaryVerb = verbData.HV.toLowerCase();
        } else if (verbData.HV === "h") {
            auxiliaryVerb = "haben";
        } else if (verbData.HV === "s") {
            auxiliaryVerb = "sein";
        }
    }
    
    // Generate the conjugated form based on person and number
    let auxiliaryConjugated = "";
    
    if (auxiliaryVerb === "haben") {
        if (numerus === "Singular") {
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "ich hatte";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "du hattest";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "er/sie/es hatte";
                    break;
            }
        } else { // Plural
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "wir hatten";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "ihr hattet";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "sie hatten";
                    break;
            }
        }
    } else if (auxiliaryVerb === "sein") {
        if (numerus === "Singular") {
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "ich war";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "du warst";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "er/sie/es war";
                    break;
            }
        } else { // Plural
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "wir waren";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "ihr wart";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "sie waren";
                    break;
            }
        }
    } else {
        // Fallback in case of unknown auxiliary
        return `[${verb} - ${person} ${numerus} Plusquamperfekt - unknown auxiliary "${auxiliaryVerb}"]`;
    }
    
    return `${auxiliaryConjugated} ${pastParticiple}`;
}

/**
 * Generates the Futur I tense in Indicative mood.
 * Formula: "werden" conjugated in present tense + infinitive
 */
function generateFuturIIndicative(verb, person, numerus) {
    const verbData = verbsData.find(v => v.Infinitiv === verb);
    
    if (!verbData) {
        return `[${verb} - ${person} ${numerus} Futur I]`;
    }
    
    // Use the infinitive form directly
    const infinitive = verb;
    
    if (!infinitive) {
        console.error(`No infinitive found for ${verb}`);
        return `[${verb} - ${person} ${numerus} Futur I - no infinitive available]`;
    }
    
    // Generate the conjugated form based on person and number
    let werdenConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                werdenConjugated = "ich werde";
                break;
            case "2. Person":
                werdenConjugated = "du wirst";
                break;
            case "3. Person":
                werdenConjugated = "er/sie/es wird";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                werdenConjugated = "wir werden";
                break;
            case "2. Person":
                werdenConjugated = "ihr werdet";
                break;
            case "3. Person":
                werdenConjugated = "sie werden";
                break;
        }
    }
    
    return `${werdenConjugated} ${infinitive}`;
}

/**
 * Generates the Futur II tense in Indicative mood (Active voice)
 * Formula: "werden" conjugated in present tense + past participle + "haben/sein"
 */
function generateFuturIIIndicative(verb, person, numerus) {
    // Get the verb data
    const verbData = verbsData.find(v => v.Infinitiv === verb);
    
    if (!verbData) {
        return `[${verb} - ${person} ${numerus} Futur II]`;
    }
    
    // Get past participle
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        console.error(`No past participle found for ${verb}`);
        return `[${verb} - ${person} ${numerus} Futur II - no PP available]`;
    }
    
    // Determine auxiliary verb (haben/sein) based on verb data
    let auxiliaryVerb = "haben"; // Default
    if (verbData.HV) {
        // Check if HV is an infinitive form or just h/s abbreviation
        if (verbData.HV === "sein" || verbData.HV === "s") {
            auxiliaryVerb = "sein";
        }
    }
    
    // Generate the conjugated form based on person and number
    let werdenConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                werdenConjugated = "ich werde";
                break;
            case "2. Person":
                werdenConjugated = "du wirst";
                break;
            case "3. Person":
                werdenConjugated = "er/sie/es wird";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                werdenConjugated = "wir werden";
                break;
            case "2. Person":
                werdenConjugated = "ihr werdet";
                break;
            case "3. Person":
                werdenConjugated = "sie werden";
                break;
        }
    }
    
    return `${werdenConjugated} ${pastParticiple} ${auxiliaryVerb}`;
}

/**
 * Generates the Konjunktiv I Präsens Passive voice
 * Formula: "werden" conjugated in Konjunktiv I + past participle
 */
function generateKonjunktiv1PraesensPassiv(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Konjunktiv I Präsens Passiv - no PP available]`;
    }
    
    let werdeConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                werdeConjugated = "ich werde";
                break;
            case "2. Person":
                werdeConjugated = "du werdest";
                break;
            case "3. Person":
                werdeConjugated = "er/sie/es werde";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                werdeConjugated = "wir werden";
                break;
            case "2. Person":
                werdeConjugated = "ihr werdet";
                break;
            case "3. Person":
                werdeConjugated = "sie werden";
                break;
        }
    }
    
    return `${werdeConjugated} ${pastParticiple}`;
}

/**
 * Generates the Konjunktiv I Perfekt/Präteritum/Plusquamperfekt Passive voice
 * Formula: "sein" conjugated in Konjunktiv I + past participle + "worden"
 */
function generateKonjunktiv1PerfektPassiv(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Konjunktiv I Perfekt Passiv - no PP available]`;
    }
    
    let seiConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                seiConjugated = "ich sei";
                break;
            case "2. Person":
                seiConjugated = "du seist";
                break;
            case "3. Person":
                seiConjugated = "er/sie/es sei";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                seiConjugated = "wir seien";
                break;
            case "2. Person":
                seiConjugated = "ihr seiet";
                break;
            case "3. Person":
                seiConjugated = "sie seien";
                break;
        }
    }
    
    return `${seiConjugated} ${pastParticiple} worden`;
}

/**
 * Generates the Konjunktiv I Futur I Passive voice
 * Formula: "werden" conjugated in Konjunktiv I + past participle + "werden"
 */
function generateKonjunktiv1FuturIPassiv(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Konjunktiv I Futur I Passiv - no PP available]`;
    }
    
    let werdeConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                werdeConjugated = "ich werde";
                break;
            case "2. Person":
                werdeConjugated = "du werdest";
                break;
            case "3. Person":
                werdeConjugated = "er/sie/es werde";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                werdeConjugated = "wir werden";
                break;
            case "2. Person":
                werdeConjugated = "ihr werdet"; // This is correct
                break;
            case "3. Person":
                werdeConjugated = "sie werden";
                break;
        }
    }
    
    return `${werdeConjugated} ${pastParticiple} werden`;
}

/**
 * Generates the Konjunktiv I Futur II Passive voice
 * Formula: "werden" conjugated in Konjunktiv I + past participle + "worden sein"
 */
function generateKonjunktiv1FuturIIPassiv(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Konjunktiv I Futur II Passiv - no PP available]`;
    }
    
    let werdeConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                werdeConjugated = "ich werde";
                break;
            case "2. Person":
                werdeConjugated = "du werdest";
                break;
            case "3. Person":
                werdeConjugated = "er/sie/es werde";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                werdeConjugated = "wir werden";
                break;
            case "2. Person":
                werdeConjugated = "ihr werdet";
                break;
            case "3. Person":
                werdeConjugated = "sie werden";
                break;
        }
    }
    
    return `${werdeConjugated} ${pastParticiple} worden sein`;
}

/**
 * Generates the Konjunktiv II Präsens Passive voice
 * Formula: "würde" + past participle
 */
function generateKonjunktiv2PraesensPassiv(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Konjunktiv II Präsens Passiv - no PP available]`;
    }
    
    let wurdeConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                wurdeConjugated = "ich würde";
                break;
            case "2. Person":
                wurdeConjugated = "du würdest";
                break;
            case "3. Person":
                wurdeConjugated = "er/sie/es würde";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                wurdeConjugated = "wir würden";
                break;
            case "2. Person":
                wurdeConjugated = "ihr würdet";
                break;
            case "3. Person":
                wurdeConjugated = "sie würden";
                break;
        }
    }
    
    return `${wurdeConjugated} ${pastParticiple}`;
}

/**
 * Generates the Konjunktiv II Perfekt/Präteritum/Plusquamperfekt Passive voice
 * Formula: "wäre" conjugated + past participle + "worden"
 */
function generateKonjunktiv2PerfektPassiv(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Konjunktiv II Perfekt Passiv - no PP available]`;
    }
    
    let waereConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                waereConjugated = "ich wäre";
                break;
            case "2. Person":
                waereConjugated = "du wärest";
                break;
            case "3. Person":
                waereConjugated = "er/sie/es wäre";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                waereConjugated = "wir wären";
                break;
            case "2. Person":
                waereConjugated = "ihr wäret";
                break;
            case "3. Person":
                waereConjugated = "sie wären";
                break;
        }
    }
    
    return `${waereConjugated} ${pastParticiple} worden`;
}

/**
 * Generates the Konjunktiv II Futur I Passive voice
 * Formula: "würde" conjugated + past participle + "werden"
 */
function generateKonjunktiv2FuturIPassiv(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Konjunktiv II Futur I Passiv - no PP available]`;
    }
    
    let wurdeConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                wurdeConjugated = "ich würde";
                break;
            case "2. Person":
                wurdeConjugated = "du würdest";
                break;
            case "3. Person":
                wurdeConjugated = "er/sie/es würde";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                wurdeConjugated = "wir würden";
                break;
            case "2. Person":
                wurdeConjugated = "ihr würdet";
                break;
            case "3. Person":
                wurdeConjugated = "sie würden";
                break;
        }
    }
    
    return `${wurdeConjugated} ${pastParticiple} werden`;
}

/**
 * Generates the Konjunktiv II Futur II Passive voice
 * Formula: "würde" conjugated + past participle + "worden sein"
 */
function generateKonjunktiv2FuturIIPassiv(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Konjunktiv II Futur II Passiv - no PP available]`;
    }
    
    let wurdeConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                wurdeConjugated = "ich würde";
                break;
            case "2. Person":
                wurdeConjugated = "du würdest";
                break;
            case "3. Person":
                wurdeConjugated = "er/sie/es würde";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                wurdeConjugated = "wir würden";
                break;
            case "2. Person":
                wurdeConjugated = "ihr würdet";
                break;
            case "3. Person":
                wurdeConjugated = "sie würden";
                break;
        }
    }
    
    return `${wurdeConjugated} ${pastParticiple} worden sein`;
}

/**
 * Function to generate a random task
 */
function generateRandomTask() {
    console.log('Generating random task');
    
    try {
        // Handle empty arrays gracefully
        if (persons.length === 0) persons = [...originalPersons];
        if (numeri.length === 0) numeri = [...originalNumeri];
        if (tempora.length === 0) tempora = [...originalTempora];
        if (genera.length === 0) genera = [...originalGenera];
        if (modi.length === 0) modi = [...originalModi];
        
        // If Aktiv is deselected, handle it by either adding it back or avoiding intransitive verbs
        const onlyPassive = genera.length === 1 && genera[0] === 'Passiv';
        
        // Select random options from enabled arrays
        const randomPerson = getRandomItem(persons);
        const randomNumerus = getRandomItem(numeri);
        const randomTempus = getRandomItem(tempora);
        let randomGenus = getRandomItem(genera);
        const randomModus = getRandomItem(modi);
        
        // Ensure we have at least one verb to choose from
        if (verbs.length === 0) {
            console.warn("No verbs available. Using default verbs.");
            verbs = [...defaultVerbs];
        }
        
        // Select a random verb, ensuring it's one of the loaded verbs and compatible with genus
        let verbName;
        let attempts = 0;
        const maxAttempts = 50; // Prevent infinite loops
        let verbData; // Declare verbData here instead of in the loop
        
        do {
            verbName = getRandomItem(verbs);
            verbData = verbsData.find(v => v.Infinitiv === verbName);
            
            // If we only have Passiv selected, we need to ensure the verb is transitive
            if (onlyPassive) {
                // If the verb is intransitive (transitiv == 0), try another verb
                if (verbData && verbData.transitiv === 0) {
                    console.log(`Skipping intransitive verb ${verbName} for passive form`);
                    attempts++;
                    continue;
                }
            }
            
            // If we selected Passiv for an intransitive verb, switch to Aktiv
            if (randomGenus === 'Passiv') {
                if (verbData && verbData.transitiv === 0) {
                    console.log(`Verb ${verbName} is intransitive, switching to Aktiv`);
                    randomGenus = 'Aktiv';
                }
            }
            
            // Exit the loop if we found a compatible verb or tried too many times
            break;
            
        } while (attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
            console.warn("Could not find a suitable verb after many attempts, using any verb.");
            verbName = getRandomItem(verbs);
        }
        
        // Generate the conjugated verb form
        console.log(`Generating conjugation for: ${verbName}, ${randomPerson}, ${randomNumerus}, ${randomTempus}, ${randomGenus}, ${randomModus}`);
        const conjugatedVerb = generateVerbConjugation(verbName, randomPerson, randomNumerus, randomTempus, randomGenus, randomModus);
        
        // Display the task
        document.getElementById("verb").textContent = verbName;
        document.getElementById("person").textContent = randomPerson;
        document.getElementById("numerus").textContent = randomNumerus;
        document.getElementById("tempus").textContent = randomTempus;
        document.getElementById("genus").textContent = randomGenus;
        document.getElementById("modus").textContent = randomModus;
        
        const solutionElement = document.getElementById("solution");
        if (solutionElement) {
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
        
        // Return success status
        return true;
    } catch (error) {
        console.error("Error in generateRandomTask:", error);
        console.error("Stack trace:", error.stack); // Add stack trace for better debugging
        alert("An error occurred while generating a task. Please try again.");
    }
}

/**
 * Utility function to get a random item from an array
 * Handles empty arrays and undefined values gracefully
 */
function getRandomItem(array) {
    if (!array || array.length === 0) {
        console.error("Attempted to get random item from empty or undefined array");
        return "unknown"; // Return a default value to prevent further errors
    }
    return array[Math.floor(Math.random() * array.length)];
}

// Fix the function to get past participle - add fallback to buildPastParticiple
function getVerbPastParticiple(verb) {
    try {
        // Handle undefined verb
        if (!verb) {
            console.error("Undefined verb passed to getVerbPastParticiple");
            return "unbekannt"; // Return a default value
        }
        
        const verbData = verbsData.find(v => v.Infinitiv === verb);
        
        if (!verbData) {
            console.warn(`No verb data found for ${verb}, using fallback`);
            // Try to build a fallback past participle
            return buildPastParticiple(verb);
        }
        
        // Get past participle (PP) from verb data
        const pastParticiple = verbData.PP;
        
        if (!pastParticiple) {
            console.warn(`No past participle (PP) found for ${verb}, trying to build one`);
            // Try to build a fallback past participle
            return buildPastParticiple(verb);
        }
        
        return pastParticiple;
    } catch (error) {
        console.error('Error in getVerbPastParticiple:', error);
        return buildPastParticiple(verb); // Always provide a fallback
    }
}

/**
 * Builds a past participle for a verb when one isn't available in the data
 */
function buildPastParticiple(verb) {
    try {
        // Handle undefined verb
        if (!verb) {
            return "unbekannt";
        }
        
        // Simple past participle formation for regular verbs
        if (verb.startsWith('ge')) {
            return verb; // Already looks like a participle
        }
        
        // Handle separable prefix verbs
        const separablePrefixes = ['ab', 'an', 'auf', 'aus', 'bei', 'ein', 'mit', 'vor', 'zu', 'zurück'];
        for (const prefix of separablePrefixes) {
            if (verb.startsWith(prefix)) {
                const base = verb.substring(prefix.length);
                return `${prefix}ge${base.endsWith('en') ? base.slice(0, -2) : base}t`;
            }
        }
        
        // Handle inseparable prefix verbs
        const inseparablePrefixes = ['be', 'er', 'ver', 'zer', 'ent', 'emp', 'miss'];
        for (const prefix of inseparablePrefixes) {
            if (verb.startsWith(prefix)) {
                const base = verb.substring(prefix.length);
                return `${prefix}${base.endsWith('en') ? base.slice(0, -2) : base}t`;
            }
        }
        
        // Default case for regular verbs
        if (verb.endsWith('en')) {
            return `ge${verb.slice(0, -2)}t`;
        } else if (verb.endsWith('n')) {
            return `ge${verb.slice(0, -1)}t`;
        }
        
        return `ge${verb}t`;
    } catch (error) {
        console.error('Error in buildPastParticiple:', error);
        return "unbekannt"; // Absolute fallback
    }
}

/**
 * Generates the Plusquamperfekt tense in Indicative mood, Passive voice
 * Formula: "sein" conjugated in past tense + past participle + "worden"
 */
function generatePassivPlusquamperfektIndicative(verb, person, numerus) {
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        return `[${verb} - ${person} ${numerus} Plusquamperfekt Passiv - no PP available]`;
    }
    
    let warConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                warConjugated = "ich war";
                break;
            case "2. Person":
                warConjugated = "du warst";
                break;
            case "3. Person":
                warConjugated = "er/sie/es war";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                warConjugated = "wir waren";
                break;
            case "2. Person":
                warConjugated = "ihr wart";
                break;
            case "3. Person":
                warConjugated = "sie waren";
                break;
        }
    }
    
    return `${warConjugated} ${pastParticiple} worden`;
}

/**
 * Generates the Konjunktiv I Perfekt/Präteritum/Plusquamperfekt Active voice
 * Formula: "haben/sein" conjugated in Konjunktiv I + past participle 
 */
function generateKonjunktiv1PerfektAktiv(verb, person, numerus) {
    // Get the verb data
    const verbData = verbsData.find(v => v.Infinitiv === verb);
    
    if (!verbData) {
        return `[${verb} - ${person} ${numerus} Konjunktiv I Perfekt]`;
    }
    
    // Get past participle (PP) from verb data
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        console.error(`No past participle (PP) found for ${verb}`);
        return `[${verb} - ${person} ${numerus} Konjunktiv I Perfekt - no PP available]`;
    }
    
    // Get auxiliary verb (HV) from verb data, default to "haben"
    let auxiliaryVerb = "haben"; // Default

    if (verbData.HV) {
        // Check if HV is an infinitive form or just h/s abbreviation
        if (verbData.HV === "haben" || verbData.HV === "sein") {
            auxiliaryVerb = verbData.HV.toLowerCase();
        } else if (verbData.HV === "h") {
            auxiliaryVerb = "haben";
        } else if (verbData.HV === "s") {
            auxiliaryVerb = "sein";
        }
    }
    
    // Generate the conjugated form of the auxiliary verb in Konjunktiv I
    let auxiliaryConjugated = "";
    
    if (auxiliaryVerb === "haben") {
        if (numerus === "Singular") {
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "ich habe";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "du habest";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "er/sie/es habe";
                    break;
            }
        } else { // Plural
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "wir haben";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "ihr habet";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "sie haben";
                    break;
            }
        }
    } else if (auxiliaryVerb === "sein") {
        if (numerus === "Singular") {
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "ich sei";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "du seist";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "er/sie/es sei";
                    break;
            }
        } else { // Plural
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "wir seien";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "ihr seiet";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "sie seien";
                    break;
            }
        }
    } else {
        // Fallback in case of unknown auxiliary
        return `[${verb} - ${person} ${numerus} Konjunktiv I Perfekt - unknown auxiliary "${auxiliaryVerb}"]`;
    }
    
    return `${auxiliaryConjugated} ${pastParticiple}`;
}

/**
 * Generates the Konjunktiv I Futur I Active voice
 * Formula: "werden" conjugated in Konjunktiv I + infinitive
 */
function generateKonjunktiv1FuturIAktiv(verb, person, numerus) {
    // Use the infinitive form directly
    const infinitive = verb;
    
    if (!infinitive) {
        console.error(`No infinitive found for ${verb}`);
        return `[${verb} - ${person} ${numerus} Konjunktiv I Futur I - no infinitive available]`;
    }
    
    // Generate the conjugated form of "werden" in Konjunktiv I
    let werdeConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                werdeConjugated = "ich werde";
                break;
            case "2. Person":
                werdeConjugated = "du werdest";
                break;
            case "3. Person":
                werdeConjugated = "er/sie/es werde";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                werdeConjugated = "wir werden";
                break;
            case "2. Person":
                werdeConjugated = "ihr werdet"; // This is correct
                break;
            case "3. Person":
                werdeConjugated = "sie werden";
                break;
        }
    }
    
    return `${werdeConjugated} ${infinitive}`;
}

/**
 * Generates the Konjunktiv I Futur II Active voice
 * Formula: "werden" conjugated in Konjunktiv I + past participle + have/be
 */
function generateKonjunktiv1FuturIIAktiv(verb, person, numerus) {
    // Get the verb data
    const verbData = verbsData.find(v => v.Infinitiv === verb);
    
    if (!verbData) {
        return `[${verb} - ${person} ${numerus} Konjunktiv I Futur II]`;
    }
    
    // Get past participle
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        console.error(`No past participle found for ${verb}`);
        return `[${verb} - ${person} ${numerus} Konjunktiv I Futur II - no PP available]`;
    }
    
    // Determine auxiliary verb (haben/sein) based on verb data
    let auxiliaryVerb = "haben"; // Default
    if (verbData.HV) {
        // Check if HV is an infinitive form or just h/s abbreviation
        if (verbData.HV === "sein" || verbData.HV === "s") {
            auxiliaryVerb = "sein";
        }
    }
    
    // Generate the conjugated form based on person and number
    let werdeConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                werdeConjugated = "ich werde";
                break;
            case "2. Person":
                werdeConjugated = "du werdest";
                break;
            case "3. Person":
                werdeConjugated = "er/sie/es werde";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                werdeConjugated = "wir werden";
                break;
            case "2. Person":
                werdeConjugated = "ihr werdet";
                break;
            case "3. Person":
                werdeConjugated = "sie werden";
                break;
        }
    }
    
    return `${werdeConjugated} ${pastParticiple} ${auxiliaryVerb}`;
}

/**
 * Generates the Konjunktiv II Präsens Active voice 
 * Formula: würde + infinitive
 */
function generateKonjunktiv2PraesensAktiv(verb, person, numerus) {
    // Use the infinitive form directly
    const infinitive = verb;
    
    if (!infinitive) {
        console.error(`No infinitive found for ${verb}`);
        return `[${verb} - ${person} ${numerus} Konjunktiv II Präsens - no infinitive available]`;
    }
    
    // Generate the würde form based on person and number
    let wurdeConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                wurdeConjugated = "ich würde";
                break;
            case "2. Person":
                wurdeConjugated = "du würdest";
                break;
            case "3. Person":
                wurdeConjugated = "er/sie/es würde";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                wurdeConjugated = "wir würden";
                break;
            case "2. Person":
                wurdeConjugated = "ihr würdet";
                break;
            case "3. Person":
                wurdeConjugated = "sie würden";
                break;
        }
    }
    
    return `${wurdeConjugated} ${infinitive}`;
}

/**
 * Generates the Konjunktiv II Perfekt/Präteritum/Plusquamperfekt Active voice
 * Formula: hätte/wäre + past participle
 */
function generateKonjunktiv2PerfektAktiv(verb, person, numerus) {
    // Get the verb data
    const verbData = verbsData.find(v => v.Infinitiv === verb);
    
    if (!verbData) {
        return `[${verb} - ${person} ${numerus} Konjunktiv II Perfekt]`;
    }
    
    // Get past participle (PP) from verb data
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        console.error(`No past participle (PP) found for ${verb}`);
        return `[${verb} - ${person} ${numerus} Konjunktiv II Perfekt - no PP available]`;
    }
    
    // Get auxiliary verb (HV) from verb data, default to "haben"
    let auxiliaryVerb = "haben"; // Default

    if (verbData.HV) {
        // Check if HV is an infinitive form or just h/s abbreviation
        if (verbData.HV === "haben" || verbData.HV === "sein") {
            auxiliaryVerb = verbData.HV.toLowerCase();
        } else if (verbData.HV === "h") {
            auxiliaryVerb = "haben";
        } else if (verbData.HV === "s") {
            auxiliaryVerb = "sein";
        }
    }
    
    // Generate the conjugated form of the auxiliary verb in Konjunktiv II
    let auxiliaryConjugated = "";
    
    if (auxiliaryVerb === "haben") {
        if (numerus === "Singular") {
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "ich hätte";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "du hättest";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "er/sie/es hätte";
                    break;
            }
        } else { // Plural
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "wir hätten";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "ihr hättet";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "sie hätten";
                    break;
            }
        }
    } else if (auxiliaryVerb === "sein") {
        if (numerus === "Singular") {
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "ich wäre";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "du wärest";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "er/sie/es wäre";
                    break;
            }
        } else { // Plural
            switch (person) {
                case "1. Person":
                    auxiliaryConjugated = "wir wären";
                    break;
                case "2. Person":
                    auxiliaryConjugated = "ihr wäret";
                    break;
                case "3. Person":
                    auxiliaryConjugated = "sie wären";
                    break;
            }
        }
    }
    
    return `${auxiliaryConjugated} ${pastParticiple}`;
}

/**
 * Generates the Konjunktiv II Futur I Active voice
 * Formula: würde + infinitive
 */
function generateKonjunktiv2FuturIAktiv(verb, person, numerus) {
    return generateKonjunktiv2PraesensAktiv(verb, person, numerus); // Same form as Präsens
}

/**
 * Generates the Konjunktiv II Futur II Active voice
 * Formula: würde + past participle + haben/sein
 */
function generateKonjunktiv2FuturIIAktiv(verb, person, numerus) {
    // Get the verb data
    const verbData = verbsData.find(v => v.Infinitiv === verb);
    
    if (!verbData) {
        return `[${verb} - ${person} ${numerus} Konjunktiv II Futur II]`;
    }
    
    // Get past participle
    const pastParticiple = getVerbPastParticiple(verb);
    
    if (!pastParticiple) {
        console.error(`No past participle found for ${verb}`);
        return `[${verb} - ${person} ${numerus} Konjunktiv II Futur II - no PP available]`;
    }
    
    // Determine auxiliary verb (haben/sein) based on verb data
    let auxiliaryVerb = "haben"; // Default
    if (verbData.HV) {
        // Check if HV is an infinitive form or just h/s abbreviation
        if (verbData.HV === "sein" || verbData.HV === "s") {
            auxiliaryVerb = "sein";
        }
    }
    
    // Generate the würde form based on person and number
    let wurdeConjugated = "";
    
    if (numerus === "Singular") {
        switch (person) {
            case "1. Person":
                wurdeConjugated = "ich würde";
                break;
            case "2. Person":
                wurdeConjugated = "du würdest";
                break;
            case "3. Person":
                wurdeConjugated = "er/sie/es würde";
                break;
        }
    } else { // Plural
        switch (person) {
            case "1. Person":
                wurdeConjugated = "wir würden";
                break;
            case "2. Person":
                wurdeConjugated = "ihr würdet";
                break;
            case "3. Person":
                wurdeConjugated = "sie würden";
                break;
        }
    }
    
    return `${wurdeConjugated} ${pastParticiple} ${auxiliaryVerb}`;
}

/**
 * Debug function to print all verb forms of a given infinitive to the console
 * Can be called from the browser console with: debugVerb('verbInfinitive')
 * 
 * @param {string} infinitive - The infinitive form of the verb to debug
 */
function debugVerb(infinitive) {
    console.group(`Debug information for verb: ${infinitive}`);
    
    // 1. Find the verb data
    const verbData = verbsData.find(v => v.Infinitiv === infinitive);
    
    if (!verbData) {
        console.error(`No verb data found for '${infinitive}'`);
        console.groupEnd();
        return;
    }
    
    // 2. Display basic verb information
    console.log('Basic Information:');
    console.log(`Infinitive: ${verbData.Infinitiv}`);
    console.log(`Past Participle: ${verbData.PP || 'Not available'}`);
    console.log(`Auxiliary Verb: ${verbData.HV || 'haben (default)'}`);
    console.log(`Transitive: ${verbData.transitiv !== 0 ? 'Yes' : 'No (intransitive)'}`);
    console.log('-------------------');
    
    // 3. Display all conjugation forms
    console.log('All Conjugation Forms:');
    
    // Create test objects for all combinations
    const allPersons = originalPersons;
    const allNumeri = originalNumeri; 
    const allTempora = originalTempora;
    const allGenera = originalGenera;
    const allModi = originalModi;
    
    // For each combination, generate and display the conjugated form
    for (const modus of allModi) {
        console.group(`Modus: ${modus}`);
        
        for (const genus of allGenera) {
            // Skip passive forms for intransitive verbs
            if (genus === 'Passiv' && verbData.transitiv === 0) {
                console.log(`${genus}: Skipped - verb is intransitive`);
                continue;
            }
            
            console.group(`Genus: ${genus}`);
            
            for (const tempus of allTempora) {
                console.group(`Tempus: ${tempus}`);
                
                for (const numerus of allNumeri) {
                    console.group(`Numerus: ${numerus}`);
                    
                    for (const person of allPersons) {
                        const conjugated = generateVerbConjugation(infinitive, person, numerus, tempus, genus, modus);
                        console.log(`${person}: ${conjugated}`);
                    }
                    
                    console.groupEnd(); // Numerus
                }
                
                console.groupEnd(); // Tempus
            }
            
            console.groupEnd(); // Genus
        }
        
        console.groupEnd(); // Modus
    }
    
    // 4. Display raw JSON data
    console.log('-------------------');
    console.log('Raw Data from JSON:');
    console.log(verbData);
    
    console.groupEnd(); // Main group
    
    return "Debug information printed to console";
}

/**
 * Simplified version of the debug function that only shows the most common forms
 * Can be called from the browser console with: quickDebugVerb('verbInfinitive')
 * 
 * @param {string} infinitive - The infinitive form of the verb to debug
 */
function quickDebugVerb(infinitive) {
    console.group(`Quick debug for verb: ${infinitive}`);
    
    // 1. Find the verb data
    const verbData = verbsData.find(v => v.Infinitiv === infinitive);
    
    if (!verbData) {
        console.error(`No verb data found for '${infinitive}'`);
        console.groupEnd();
        return;
    }
    
    // 2. Basic info
    console.log(`Infinitive: ${verbData.Infinitiv}`);
    console.log(`Past Participle: ${verbData.PP || buildPastParticiple(infinitive)}`);
    console.log(`Auxiliary: ${verbData.HV || 'haben'}`);
    console.log(`Transitive: ${verbData.transitiv !== 0}`);
    
    // 3. Common forms - 3rd person singular and plural
    const person3s = "3. Person";
    const personNumeri = ["Singular", "Plural"];
    const commonForms = [
        { tempus: "Präsens", genus: "Aktiv", modus: "Indikativ" },
        { tempus: "Präteritum", genus: "Aktiv", modus: "Indikativ" },
        { tempus: "Perfekt", genus: "Aktiv", modus: "Indikativ" },
        { tempus: "Futur I", genus: "Aktiv", modus: "Indikativ" }
    ];
    
    // Add passive forms only for transitive verbs
    if (verbData.transitiv !== 0) {
        commonForms.push(
            { tempus: "Präsens", genus: "Passiv", modus: "Indikativ" },
            { tempus: "Perfekt", genus: "Passiv", modus: "Indikativ" }
        );
    }
    
    // Display the common forms
    console.log('-------------------');
    console.log('Common Forms:');
    
    for (const form of commonForms) {
        console.group(`${form.tempus} ${form.genus} ${form.modus}:`);
        for (const numerus of personNumeri) {
            const conjugated = generateVerbConjugation(
                infinitive, 
                person3s, 
                numerus, 
                form.tempus, 
                form.genus, 
                form.modus
            );
            console.log(`${person3s} ${numerus}: ${conjugated}`);
        }
        console.groupEnd();
    }
    
    console.groupEnd();
    
    return "Quick debug information printed to console";
}