const verbs = ['anbieten', 'anfangen', 'ankommen', 'anmachen', 'anmelden', 'anrufen', 'antworten', 'anziehen', 'arbeiten', 'ärgern', 'aufhören', 'aufmachen', 'aufpassen', 'aufwachen', 'ausmachen', 'ausruhen', 'aussehen', 'aussteigen', 'ausziehen', 'baden', 'bedeuten', 'beginnen', 'bekommen', 'berühren', 'besichtigen', 'besuchen', 'bewegen', 'bezahlen', 'bitten', 'bleiben', 'brauchen', 'brechen', 'bringen', 'danken', 'denken', 'drücken', 'dürfen', 'duschen', 'einladen', 'einsteigen', 'empfangen', 'empfehlen', 'enden', 'entscheiden', 'entschuldigen', 'erinnern', 'erklären', 'erlauben', 'erzählen', 'essen', 'fahren', 'fallen', 'fangen', 'fehlen', 'feiern', 'finden', 'fliegen', 'folgen', 'fragen', 'freuen', 'frühstücken', 'fühlen', 'führen', 'geben', 'gefallen', 'gehen', 'gehören', 'glauben', 'grüßen', 'gucken', 'haben', 'halten', 'hängen', 'hassen', 'heben', 'heiraten', 'heißen', 'helfen', 'hoffen', 'holen', 'hören', 'informieren', 'interessieren', 'kaufen', 'kennen', 'kennenlernen', 'kochen', 'kommen', 'können', 'kosten', 'küssen', 'lächeln', 'lachen', 'lassen', 'laufen', 'leben', 'legen', 'leidtun', 'lernen', 'lesen', 'lieben', 'liegen', 'lügen', 'machen', 'malen', 'meinen', 'mieten', 'mögen', 'müssen', 'nehmen', 'öffnen', 'packen', 'passen', 'passieren', 'probieren', 'putzen', 'rauchen', 'reden', 'regnen', 'reisen', 'rennen', 'reparieren', 'riechen', 'rufen', 'sagen', 'schaffen', 'scheinen', 'schenken', 'schicken', 'schieben', 'schießen', 'schlafen', 'schlagen', 'schließen', 'schmecken', 'schneien', 'schneiden', 'schreiben', 'schreien', 'schwimmen', 'sehen', 'sein', 'senden', 'setzen', 'singen', 'sitzen', 'sollen', 'spielen', 'sprechen', 'springen', 'stecken', 'stehen', 'stehlen', 'stellen', 'sterben', 'stören', 'streichen', 'streiten', 'studieren', 'suchen', 'tanzen', 'teilen', 'tragen', 'träumen', 'treffen', 'trinken', 'tun', 'verabschieden', 'verbieten', 'verdienen', 'vergessen', 'vergleichen', 'verkaufen', 'verlieren', 'vermieten', 'vermissen', 'verstecken', 'verstehen', 'versuchen', 'vorbereiten', 'vorstellen', 'wachsen', 'wählen', 'warten', 'waschen', 'wecken', 'wehtun', 'weinen', 'werden', 'werfen', 'wiederholen', 'wissen', 'wohnen', 'wollen', 'wünschen', 'zählen', 'zeichnen', 'zeigen', 'ziehen', 'zumachen'];

// Store original arrays for restoring order
const originalPersons = ['1. Person', '2. Person', '3. Person'];
const originalNumeri = ['Singular', 'Plural'];
const originalTempora = ['Präsens', 'Präteritum', 'Perfekt', 'Plusquamperfekt', 'Futur I', 'Futur II'];
const originalGenera = ['Aktiv', 'Passiv'];
const originalModi = ['Indikativ', 'Konjunktiv I', 'Konjunktiv II', 'Imperativ'];

// Use these arrays in the random selection logic
let persons = [...originalPersons];
let numeri = [...originalNumeri];
let tempora = [...originalTempora];
let genera = [...originalGenera];
let modi = [...originalModi];

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
});

// Map heading checkbox IDs to section names
const sectionMap = {
    'person-all': 'person',
    'numerus-all': 'numerus',
    'tempus-all': 'tempus',
    'genus-all': 'genus',
    'modus-all': 'modus'
};

// Show/hide grid rows based on heading checkboxes
function updateSectionVisibility() {
    Object.entries(sectionMap).forEach(([checkboxId, section]) => {
        const checkbox = document.getElementById(checkboxId);
        const rowContainer = document.getElementById('row-' + section);
        if (checkbox && rowContainer) {
            rowContainer.style.display = checkbox.checked ? 'contents' : 'none';
        }
    });
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
