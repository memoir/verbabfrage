// Default verb array in case the JSON file fails to load
const defaultVerbs = ['anbieten', 'anfangen', 'ankommen'];

// Arrays that will hold our data
let verbs = [...defaultVerbs]; // Will contain just the infinitive forms
let verbsData = []; // Will contain the full conjugation data

// Load verbs from JSON file
document.addEventListener('DOMContentLoaded', () => {
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
});

// Store original arrays for restoring order
const originalPersons = ['1. Person', '2. Person', '3. Person'];
const originalNumeri = ['Singular', 'Plural'];
const originalTempora = ['Präsens', 'Präteritum', 'Perfekt', 'Plusquamperfekt', 'Futur I', 'Futur II'];
const originalGenera = ['Aktiv', 'Passiv'];
const originalModi = ['Indikativ', 'Konjunktiv I', 'Konjunktiv II']; // Removed 'Imperativ'

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

/**
 * Generates a conjugated form of the given verb based on the selected parameters.
 * Uses the verbsData array to find the correct conjugation if available.
 * 
 * @param {string} verb - The infinitive form of the verb
 * @param {string} person - The grammatical person (1., 2., 3. Person)
 * @param {string} numerus - The grammatical number (Singular, Plural)
 * @param {string} tempus - The tense (Präsens, Präteritum, etc.)
 * @param {string} genus - The voice (Aktiv, Passiv)
 * @param {string} modus - The mood (Indikativ, Konjunktiv I, etc.)
 * @returns {string} The conjugated verb form
 */
function generateVerbConjugation(verb, person, numerus, tempus, genus, modus) {
    // Try to find the verb in our loaded data
    const verbData = verbsData.find(v => v.Infinitiv === verb);
    
    if (verbData) {
        // Convert the parameters to the key format used in the JSON
        // Example: IND_PRAES_AKT_S_1 for Indikativ Präsens Aktiv Singular 1. Person
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
    
    // Fall back to the basic generation logic if no data is found
    // Extract the stem of the verb (remove -en, -n endings)
    let stem = verb;
    if (verb.endsWith('en')) {
        stem = verb.slice(0, -2);
    } else if (verb.endsWith('n')) {
        stem = verb.slice(0, -1);
    }
    
    // Basic conjugation for Präsens Indikativ Aktiv
    let conjugated = stem;
    
    if (tempus === 'Präsens' && genus === 'Aktiv' && modus === 'Indikativ') {
        if (numerus === 'Singular') {
            switch (person) {
                case '1. Person':
                    conjugated += 'e';
                    break;
                case '2. Person':
                    conjugated += 'st';
                    break;
                case '3. Person':
                    conjugated += 't';
                    break;
            }
        } else { // Plural
            switch (person) {
                case '1. Person':
                    conjugated += 'en';
                    break;
                case '2. Person':
                    conjugated += 't';
                    break;
                case '3. Person':
                    conjugated += 'en';
                    break;
            }
        }
    } else {
        // For other tenses and moods, return a placeholder format
        conjugated = `[${verb} - ${person} ${numerus} ${tempus} ${genus} ${modus}]`;
    }
    
    return conjugated;
}

// When clicking on the solution element, toggle its visibility
document.addEventListener('DOMContentLoaded', () => {
    const solutionElement = document.getElementById('solution');
    if (solutionElement) {
        solutionElement.classList.add('hidden-solution');
        solutionElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the document click
            solutionElement.classList.toggle('hidden-solution');
        });
    }
});

document.addEventListener('click', (e) => {
    console.log('clicked');
    // Verb
    const verb = document.getElementById('verb');
    verb.innerText = verbs[Math.floor(Math.random() * verbs.length)];
    // Person
    const person = document.getElementById('person');
    person.innerText = persons[Math.floor(Math.random() * persons.length)];
    // Numerus
    const numerus = document.getElementById('numerus');
    numerus.innerText = numeri[Math.floor(Math.random() * numeri.length)];
    // Tempus
    const tempus = document.getElementById('tempus');
    tempus.innerText = tempora[Math.floor(Math.random() * tempora.length)];
    // Genus
    const genus = document.getElementById('genus');
    genus.innerText = genera[Math.floor(Math.random() * genera.length)];
    // Modus
    const modus = document.getElementById('modus');
    modus.innerText = modi[Math.floor(Math.random() * modi.length)];
    
    // Generate and update solution
    const verbText = document.getElementById('verb').innerText;
    const personText = document.getElementById('person').innerText;
    const numerusText = document.getElementById('numerus').innerText;
    const tempusText = document.getElementById('tempus').innerText;
    const genusText = document.getElementById('genus').innerText;
    const modusText = document.getElementById('modus').innerText;
    
    const solutionElement = document.getElementById('solution');
    if (solutionElement) {
        const conjugatedVerb = generateVerbConjugation(verbText, personText, numerusText, tempusText, genusText, modusText);
        solutionElement.innerText = conjugatedVerb;
        solutionElement.classList.add('hidden-solution');
    }
});

// Show/hide grid rows based on heading checkboxes
function updateSectionVisibility() {
    const visibleSections = [];
    
    // Always keep verb and solution rows
    visibleSections.push('row-verb');
    visibleSections.push('row-solution');
    
    Object.entries(sectionMap).forEach(([checkboxId, section]) => {
        const checkbox = document.getElementById(checkboxId);
        const rowContainer = document.getElementById('row-' + section);
        if (checkbox && rowContainer) {
            rowContainer.style.display = checkbox.checked ? 'contents' : 'none';
            if (checkbox.checked) {
                visibleSections.push('row-' + section);
            }
        }
    });
    
    // Recalculate the row heights based on visible sections
    const gridContainer = document.querySelector('.grid-container');
    if (gridContainer) {
        // Count visible rows (including verb and solution which are always visible)
        const visibleRowCount = visibleSections.length;
        
        // Update grid-template-rows to have equal heights for all visible rows
        gridContainer.style.gridTemplateRows = `repeat(${visibleRowCount}, minmax(0, 1fr))`;
    }
}

// Utility to update an array based on checked checkboxes
function updateArrayFromCheckboxes(selector, originalArray) {
    const checkedLabels = Array.from(document.querySelectorAll(selector))
        .filter(cb => cb.checked)
        .map(cb => cb.parentElement.textContent.trim());
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

// Attach event listeners to all item checkboxes
document.querySelectorAll('.person-item, .numerus-item, .tempus-item, .genus-item, .modus-item')
    .forEach(cb => cb.addEventListener('change', updateOptionArrays));

// Attach event listeners to heading checkboxes
Object.keys(sectionMap).forEach(id => {
    const cb = document.getElementById(id);
    if (cb) {
        cb.addEventListener('change', updateSectionVisibility);
    }
});

// Initial update in case checkboxes are not all checked
updateSectionVisibility();

// Initial update to arrays
updateOptionArrays();

// Modal open/close logic
const gear = document.getElementById('settings-gear');
const modal = document.getElementById('settings-modal');
const closeBtn = document.getElementById('settings-modal-close');
gear.addEventListener('click', (e) => {
    e.stopPropagation();
    modal.style.display = 'block';
});
closeBtn.addEventListener('click', (e) => {
    modal.style.display = 'none';
});
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});