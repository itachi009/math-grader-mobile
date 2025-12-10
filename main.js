/**
 * Math Grader - Main Application
 * Logica principale dell'interfaccia utente
 */

import { generateSolutions, analyzeStudentWork, testApiKey } from './gemini-service.js';
import { saveApiKey, getApiKey, saveCompito, getAllCompiti, deleteCompito, filterCompiti } from './storage-service.js';
import { generateSolutionsHTML, generateStudentResultHTML, exportToPDF, renderMath } from './report-generator.js';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { captureTracciaPhoto, captureCompitiPhoto } from './capacitor-camera.js';

// =====================================================
// STATE
// =====================================================
let currentApiKey = '';
let currentSoluzioni = null;
let currentTraccia = '';
let currentMateria = 'matematica';
let currentTitolo = '';
let uploadedCompiti = []; // Array di { file, imageData, studentName }
let currentRisultati = [];

// =====================================================
// DOM ELEMENTS
// =====================================================
const elements = {
    // API Key
    apiKeyInput: document.getElementById('apiKey'),
    toggleApiKeyBtn: document.getElementById('toggleApiKey'),
    saveApiKeyBtn: document.getElementById('saveApiKey'),
    apiStatus: document.getElementById('apiStatus'),

    // Tabs
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Step 1: Traccia
    materiaSelect: document.getElementById('materiaSelect'),
    titoloInput: document.getElementById('titoloCompito'),
    tracciaText: document.getElementById('tracciaText'),
    tracciaCameraInput: document.getElementById('tracciaCameraInput'),
    tracciaImage: document.getElementById('tracciaImage'),
    tracciaImagePreview: document.getElementById('tracciaImagePreview'),
    generateSolutionsBtn: document.getElementById('generateSolutions'),

    // Step 2: Soluzioni
    stepSoluzioni: document.getElementById('step-soluzioni'),
    soluzioniContainer: document.getElementById('soluzioniContainer'),
    editSolutionsBtn: document.getElementById('editSolutions'),
    proceedBtn: document.getElementById('proceedToGrading'),
    solutionReviewNotes: document.getElementById('solutionReviewNotes'),
    reviewSolutionsBtn: document.getElementById('reviewSolutions'),
    solutionReviewResult: document.getElementById('solutionReviewResult'),

    // Step 3: Compiti
    stepCompiti: document.getElementById('step-compiti'),
    studenteNome: document.getElementById('studenteNome'),
    studenteCognome: document.getElementById('studenteCognome'),
    compitiCameraInput: document.getElementById('compitiCameraInput'),
    compitiImage: document.getElementById('compitiImage'),
    compitiPreviewGrid: document.getElementById('compitiPreviewGrid'),
    startGradingBtn: document.getElementById('startGrading'),

    // Step 4: Risultati
    stepRisultati: document.getElementById('step-risultati'),
    risultatiContainer: document.getElementById('risultatiContainer'),
    nextStudentBtn: document.getElementById('nextStudent'),
    exportPdfBtn: document.getElementById('exportPdf'),
    saveToHistoryBtn: document.getElementById('saveToHistory'),

    // Revisione correzione
    studenteSelect: document.getElementById('studenteSelect'),
    reviewNotes: document.getElementById('reviewNotes'),
    reviewCalcsBtn: document.getElementById('reviewCalcs'),
    reanalyzeFromImageBtn: document.getElementById('reanalyzeFromImage'),
    reviewResult: document.getElementById('reviewResult'),

    // Storico
    storicoList: document.getElementById('storicoList'),
    filtroMateria: document.getElementById('filtroMateria'),
    filtroData: document.getElementById('filtroData'),

    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),

    // Toast
    toastContainer: document.getElementById('toastContainer'),

    // Camera Modal
    cameraModal: document.getElementById('cameraModal'),
    cameraVideo: document.getElementById('cameraVideo'),
    cameraCanvas: document.getElementById('cameraCanvas'),
    closeCameraBtn: document.getElementById('closeCameraBtn'),
    captureBtn: document.getElementById('captureBtn')
};

// =====================================================
// INITIALIZATION
// =====================================================
function init() {
    // Carica API Key salvata
    const savedApiKey = getApiKey();
    if (savedApiKey) {
        currentApiKey = savedApiKey;
        elements.apiKeyInput.value = savedApiKey;
        elements.apiStatus.textContent = '✓ API Key salvata';
        elements.apiStatus.className = 'api-status success';
    }

    // Event Listeners
    setupEventListeners();

    // Carica storico
    renderStorico();
}

function setupEventListeners() {
    // API Key
    elements.toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
    elements.saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
    elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSaveApiKey();
    });

    // Tabs
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Step 1
    elements.materiaSelect.addEventListener('change', () => {
        currentMateria = elements.materiaSelect.value;
    });
    elements.titoloInput.addEventListener('input', () => {
        currentTitolo = elements.titoloInput.value;
    });
    elements.tracciaText.addEventListener('input', () => {
        currentTraccia = elements.tracciaText.value;
    });

    // Upload traccia - sia da camera che da galleria usano compressione
    elements.tracciaCameraInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleTracciaUpload(e.target.files[0]);
    });
    elements.tracciaImage.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleTracciaUpload(e.target.files[0]);
    });

    elements.generateSolutionsBtn.addEventListener('click', handleGenerateSolutions);

    // Step 2
    elements.editSolutionsBtn.addEventListener('click', () => {
        elements.stepSoluzioni.classList.add('hidden');
        currentSoluzioni = null;
    });
    elements.proceedBtn.addEventListener('click', () => {
        elements.stepCompiti.classList.remove('hidden');
        elements.stepCompiti.scrollIntoView({ behavior: 'smooth' });
    });
    if (elements.reviewSolutionsBtn) {
        elements.reviewSolutionsBtn.addEventListener('click', handleReviewSolutions);
    } else {
        console.error('reviewSolutionsBtn non trovato!');
    }

    // Step 3 - sia da camera che da galleria usano compressione
    elements.compitiCameraInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleCompitiUpload(e.target.files[0]);
    });
    elements.compitiImage.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleCompitiUpload(e.target.files[0]);
    });
    elements.studenteNome.addEventListener('input', updateGradingButton);
    elements.studenteCognome.addEventListener('input', updateGradingButton);
    elements.startGradingBtn.addEventListener('click', handleStartGrading);

    // Step 4
    elements.nextStudentBtn.addEventListener('click', handleNextStudent);
    elements.exportPdfBtn.addEventListener('click', handleExportPdf);
    elements.saveToHistoryBtn.addEventListener('click', handleSaveToHistory);
    elements.reviewCalcsBtn.addEventListener('click', handleReviewCalcs);
    if (elements.reanalyzeFromImageBtn) {
        elements.reanalyzeFromImageBtn.addEventListener('click', handleReanalyzeFromImage);
    }

    // Storico
    elements.filtroMateria.addEventListener('change', filterStorico);
    elements.filtroData.addEventListener('change', filterStorico);
}

// =====================================================
// TAB NAVIGATION
// =====================================================
function switchTab(tabId) {
    elements.tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });

    if (tabId === 'storico') {
        renderStorico();
    }

    // Reset completo quando si torna a "Nuova Correzione"
    if (tabId === 'nuova-correzione') {
        resetNuovaCorrezione();
    }
}

// Funzione per resettare tutto e iniziare una nuova correzione
function resetNuovaCorrezione() {
    // Reset stato
    currentSoluzioni = null;
    currentTraccia = '';
    currentTitolo = '';
    currentRisultati = [];
    currentStudentImages = [];

    // Reset campi input
    if (elements.tracciaText) elements.tracciaText.value = '';
    if (elements.titoloInput) elements.titoloInput.value = '';
    if (elements.tracciaImagePreview) {
        elements.tracciaImagePreview.innerHTML = '';
        elements.tracciaImagePreview.classList.add('hidden');
        elements.tracciaImagePreview.dataset.base64 = '';
    }
    if (elements.studenteNome) elements.studenteNome.value = '';
    if (elements.studenteCognome) elements.studenteCognome.value = '';
    if (elements.solutionReviewNotes) elements.solutionReviewNotes.value = '';
    if (elements.solutionReviewResult) elements.solutionReviewResult.classList.add('hidden');
    if (elements.reviewNotes) elements.reviewNotes.value = '';
    if (elements.reviewResult) elements.reviewResult.classList.add('hidden');

    // Reset contenitori
    if (elements.soluzioniContainer) elements.soluzioniContainer.innerHTML = '';
    if (elements.compitiPreviewGrid) elements.compitiPreviewGrid.innerHTML = '';
    if (elements.risultatiContainer) elements.risultatiContainer.innerHTML = '';

    // Nascondi step successivi
    if (elements.stepSoluzioni) elements.stepSoluzioni.classList.add('hidden');
    if (elements.stepCompiti) elements.stepCompiti.classList.add('hidden');
    if (elements.stepRisultati) elements.stepRisultati.classList.add('hidden');

    // Reset pulsanti
    updateGradingButton();

    // Scroll all'inizio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =====================================================
// API KEY HANDLING
// =====================================================
function toggleApiKeyVisibility() {
    const input = elements.apiKeyInput;
    input.type = input.type === 'password' ? 'text' : 'password';
    elements.toggleApiKeyBtn.textContent = input.type === 'password' ? '👁️' : '🙈';
}

async function handleSaveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();

    if (!apiKey) {
        showToast('Inserisci una API Key valida', 'error');
        return;
    }

    showLoading('Verifica API Key...');

    const result = await testApiKey(apiKey);

    hideLoading();

    if (result.valid) {
        currentApiKey = apiKey;
        saveApiKey(apiKey);
        elements.apiStatus.textContent = '✓ API Key valida e salvata';
        elements.apiStatus.className = 'api-status success';
        showToast('API Key salvata con successo!', 'success');
    } else {
        elements.apiStatus.textContent = '✗ API Key non valida';
        elements.apiStatus.className = 'api-status error';
        showToast(`Errore API: ${result.error || 'Verifica la tua API Key'}`, 'error');
        console.error('Dettagli errore API:', result.error);
    }
}

// =====================================================
// FILE UPLOAD HANDLING
// =====================================================
function setupUploadZone(zone, input, handler, multiple = false) {
    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            handler(multiple ? files : files[0]);
        }
    });

    input.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handler(multiple ? files : files[0]);
        }
    });
}

// =====================================================
// CAMERA FUNCTIONS (Capacitor Native)
// =====================================================
let currentCameraMode = 'traccia'; // 'traccia' o 'compiti'

// Funzione per aprire la fotocamera nativa usando Capacitor
window.openCamera = async function (mode) {
    currentCameraMode = mode || 'traccia';
    try {
        // Usa Capacitor Camera per aprire la fotocamera nativa
        const image = await Camera.getPhoto({
            quality: 80,
            width: 1024,
            height: 1024,
            resultType: CameraResultType.Base64,
            source: CameraSource.Camera,  // Forza fotocamera, non galleria
            saveToGallery: false
        });

        const base64 = image.base64String;
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        // Crea un file fittizio per riutilizzare le funzioni esistenti
        const blob = await fetch(dataUrl).then(r => r.blob());
        const fileName = currentCameraMode === 'traccia' ? "traccia_camera.jpg" : "compito_camera.jpg";
        const file = new File([blob], fileName, { type: "image/jpeg" });

        if (currentCameraMode === 'traccia') {
            await handleTracciaUpload(file);
        } else {
            await handleCompitiUpload(file);
        }

    } catch (error) {
        // L'utente ha annullato o c'è stato un errore
        if (error.message && !error.message.includes('cancelled')) {
            console.error('Errore fotocamera:', error);
            showToast('Errore fotocamera: ' + error.message, 'error');
        }
        // Se l'utente ha annullato, non mostrare errore
    }
};

// Funzione closeCamera mantenuta per compatibilità ma non più necessaria
window.closeCamera = function () {
    // Con Capacitor Camera nativa non serve più chiudere manualmente
    const modal = document.getElementById('cameraModal');
    if (modal) modal.classList.add('hidden');
};


// Opzioni di compressione AGGRESSIVE per browser-image-compression
// Helper per leggere file
const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

async function handleTracciaUpload(file) {
    showLoading('Caricamento traccia...');

    try {
        // Preview immediata
        const previewUrl = URL.createObjectURL(file);
        elements.tracciaImagePreview.innerHTML = `<img src="${previewUrl}" alt="Traccia">`;
        elements.tracciaImagePreview.classList.remove('hidden');

        // Conversione Base64 semplice
        const dataUrl = await readFileAsDataURL(file);
        const base64 = dataUrl.split(',')[1];

        elements.tracciaImagePreview.dataset.base64 = base64;
        showToast('Traccia caricata!', 'success');

    } catch (error) {
        console.error('Errore upload traccia:', error);
        showToast('Errore nel caricamento: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

let currentStudentImages = [];

async function handleCompitiUpload(file) {
    showLoading('Caricamento foto...');

    try {
        // Preview immediata
        const previewUrl = URL.createObjectURL(file);

        // Conversione Base64 semplice
        const dataUrl = await readFileAsDataURL(file);
        const base64 = dataUrl.split(',')[1];

        currentStudentImages.push({
            imageData: previewUrl,
            base64
        });

        renderCompitiPreview();
        updateGradingButton();
        showToast('Foto caricata!', 'success');
    } catch (error) {
        console.error('Errore upload:', error);
        showToast('Errore nel caricamento: ' + error.message, 'error');
    } finally {
        hideLoading();
        elements.compitiImage.value = '';
    }
}



function renderCompitiPreview() {
    elements.compitiPreviewGrid.innerHTML = currentStudentImages.map((img, index) => `
    <div class="compito-card" data-index="${index}">
      <img src="${img.imageData}" alt="Pagina ${index + 1}">
      <button class="compito-remove" onclick="window.removeCompito(${index})">×</button>
      <div class="compito-card-info">
        <span>Pagina ${index + 1}</span>
      </div>
    </div>
  `).join('');
}

// Esposizione globale per gli handler inline
window.removeCompito = (index) => {
    currentStudentImages.splice(index, 1);
    renderCompitiPreview();
    updateGradingButton();
};

function updateGradingButton() {
    const hasName = elements.studenteNome.value.trim() !== '' || elements.studenteCognome.value.trim() !== '';
    const hasImages = currentStudentImages.length > 0;
    elements.startGradingBtn.disabled = !(hasName && hasImages);
}

/**
 * Comprime un'immagine ridimensionandola e riducendo la qualità
 * @param {File} file - File immagine originale
 * @param {number} maxWidth - Larghezza massima (default 1600px)
 * @param {number} maxHeight - Altezza massima (default 1200px)
 * @param {number} quality - Qualità JPEG 0-1 (default 0.8)
 * @returns {Promise<string>} - Data URL dell'immagine compressa
 */
function compressImage(file, maxWidth = 1600, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                // Calcola dimensioni mantenendo aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                // Crea canvas per ridimensionare
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Converti in JPEG compresso
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

// =====================================================
// SOLUTION GENERATION
// =====================================================
async function handleGenerateSolutions() {
    if (!currentApiKey) {
        showToast('Inserisci prima la API Key Gemini', 'error');
        return;
    }

    const traccia = elements.tracciaText.value.trim();
    const tracciaImageBase64 = elements.tracciaImagePreview.dataset.base64 || null;

    if (!traccia && !tracciaImageBase64) {
        showToast('Inserisci la traccia del compito o carica un\'immagine', 'error');
        return;
    }

    currentTraccia = traccia;
    currentMateria = elements.materiaSelect.value;
    currentTitolo = elements.titoloInput.value || `Compito di ${currentMateria}`;

    showLoading('Generazione soluzioni con Gemini...');

    try {
        currentSoluzioni = await generateSolutions(
            currentApiKey,
            traccia,
            currentMateria,
            tracciaImageBase64
        );

        // Mostra le soluzioni
        elements.soluzioniContainer.innerHTML = generateSolutionsHTML(currentSoluzioni);
        elements.stepSoluzioni.classList.remove('hidden');
        elements.stepSoluzioni.scrollIntoView({ behavior: 'smooth' });

        showToast('Soluzioni generate con successo!', 'success');
    } catch (error) {
        console.error('Errore generazione soluzioni:', error);
        showToast(`Errore: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Funzione per chiedere a Gemini di rivedere le soluzioni
async function handleReviewSolutions() {
    console.log('handleReviewSolutions chiamata', { currentApiKey: !!currentApiKey, currentSoluzioni: !!currentSoluzioni });

    if (!currentApiKey) {
        showToast('Inserisci prima la API Key Gemini', 'error');
        return;
    }

    if (!currentSoluzioni) {
        showToast('Non ci sono soluzioni da rivedere', 'error');
        return;
    }

    const notes = elements.solutionReviewNotes.value.trim();
    const soluzioniOriginali = JSON.stringify(currentSoluzioni);

    showLoading('Revisione soluzioni in corso...');

    try {
        const prompt = `Sei un professore esperto di ${currentMateria}.
Hai generato queste soluzioni per un compito e ora devi verificare che siano corrette.

TRACCIA:
${currentTraccia}

SOLUZIONI ATTUALI:
${JSON.stringify(currentSoluzioni, null, 2)}

${notes ? `NOTE SPECIFICHE DELL'UTENTE: ${notes}` : 'Rivedi tutti i calcoli e le soluzioni.'}

ISTRUZIONI:
1. Analizza attentamente ogni esercizio e la sua soluzione
2. Verifica che tutti i calcoli siano corretti
3. Se trovi errori, CORREGGI le soluzioni
4. Restituisci le soluzioni (corrette o confermate) in formato JSON

IMPORTANTE: Rispondi SOLO con un JSON valido nel seguente formato:
{
  "modifiche_effettuate": true/false,
  "riepilogo": "Descrizione delle modifiche effettuate o conferma che tutto è corretto",
  "dettaglio_modifiche": ["Modifica 1", "Modifica 2", ...] oppure [] se nessuna modifica,
  "soluzioni_corrette": { ... le soluzioni nel formato originale, corrette se necessario ... }
}

Rispondi SOLO con il JSON, senza altri commenti.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
                })
            }
        );

        const data = await response.json();
        console.log('Risposta API reviewSolutions:', JSON.stringify(data, null, 2));

        if (data.error) {
            throw new Error(data.error.message || 'Errore API');
        }

        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Estrai il JSON dalla risposta (rimuovi eventuali backtick markdown)
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7);
        }
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith('```')) {
            jsonText = jsonText.slice(0, -3);
        }
        jsonText = jsonText.trim();

        const risultato = JSON.parse(jsonText);

        // Aggiorna le soluzioni se sono state modificate
        if (risultato.modifiche_effettuate && risultato.soluzioni_corrette) {
            currentSoluzioni = risultato.soluzioni_corrette;
            // Aggiorna anche la visualizzazione delle soluzioni
            elements.soluzioniContainer.innerHTML = generateSolutionsHTML(currentSoluzioni);
        }

        // Costruisci il messaggio di riepilogo
        let htmlRisultato = '';
        if (risultato.modifiche_effettuate) {
            htmlRisultato = `
                <h4>⚠️ Soluzioni Modificate</h4>
                <p><strong>Riepilogo:</strong> ${risultato.riepilogo}</p>
                <div class="modifiche-lista">
                    <strong>Modifiche effettuate:</strong>
                    <ul>
                        ${risultato.dettaglio_modifiche.map(m => `<li>${m}</li>`).join('')}
                    </ul>
                </div>
                <p class="success-text">✅ Le soluzioni sono state aggiornate automaticamente!</p>
            `;
            showToast('Soluzioni corrette e aggiornate!', 'warning');
        } else {
            htmlRisultato = `
                <h4>✅ Soluzioni Verificate</h4>
                <p><strong>Riepilogo:</strong> ${risultato.riepilogo}</p>
                <p class="success-text">Tutte le soluzioni sono corrette, nessuna modifica necessaria.</p>
            `;
            showToast('Soluzioni verificate correttamente!', 'success');
        }

        elements.solutionReviewResult.innerHTML = htmlRisultato;
        elements.solutionReviewResult.classList.remove('hidden');

    } catch (error) {
        console.error('Errore revisione soluzioni:', error);

        elements.solutionReviewResult.innerHTML = `
            <h4>❌ Errore nella revisione</h4>
            <p>${error.message}</p>
            <p class="hint">Prova a cliccare di nuovo il pulsante.</p>
        `;
        elements.solutionReviewResult.classList.remove('hidden');
        showToast(`Errore: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// =====================================================
// GRADING
// =====================================================
async function handleStartGrading() {
    if (!currentApiKey) {
        showToast('Inserisci prima la API Key Gemini', 'error');
        return;
    }

    if (!currentSoluzioni) {
        showToast('Genera prima le soluzioni', 'error');
        return;
    }

    // Ottieni nome e cognome
    const nome = elements.studenteNome.value.trim();
    const cognome = elements.studenteCognome.value.trim();
    const nomeCompleto = `${cognome} ${nome}`.trim();

    if (!nomeCompleto) {
        showToast('Inserisci nome o cognome dello studente', 'error');
        return;
    }

    if (currentStudentImages.length === 0) {
        showToast('Carica almeno una foto del compito', 'error');
        return;
    }

    showLoading(`Correzione compito di ${nomeCompleto} (${currentStudentImages.length} pagine)...`);

    try {
        // Raccogli tutte le immagini
        const allImages = currentStudentImages.map(img => img.base64);

        const risultato = await analyzeStudentWork(
            currentApiKey,
            allImages,
            currentSoluzioni,
            currentMateria,
            nomeCompleto
        );

        // Salva anche le immagini originali per eventuale rivalutazione
        risultato.immaginiOriginali = allImages;

        // Aggiungi ai risultati
        currentRisultati.push(risultato);

        // Mostra i risultati
        renderRisultati();
        elements.stepRisultati.classList.remove('hidden');
        elements.stepRisultati.scrollIntoView({ behavior: 'smooth' });

        showToast(`Correzione completata per ${nomeCompleto}!`, 'success');
    } catch (error) {
        console.error('Errore correzione:', error);
        showToast(`Errore: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Funzione per correggere un altro studente
function handleNextStudent() {
    // Resetta i campi studente
    elements.studenteNome.value = '';
    elements.studenteCognome.value = '';
    currentStudentImages = [];

    // Resetta l'interfaccia
    renderCompitiPreview();
    updateGradingButton();

    // Resetta anche la sezione revisione
    elements.reviewNotes.value = '';
    elements.reviewResult.classList.add('hidden');

    // Torna allo step 3
    elements.stepCompiti.scrollIntoView({ behavior: 'smooth' });

    showToast('Pronto per correggere un altro studente', 'info');
}

// Funzione per chiedere a Gemini di rivedere la correzione
async function handleReviewCalcs() {
    if (!currentApiKey) {
        showToast('Inserisci prima la API Key Gemini', 'error');
        return;
    }

    if (currentRisultati.length === 0) {
        showToast('Non ci sono correzioni da rivedere', 'error');
        return;
    }

    // Ottieni lo studente selezionato
    const selectedIndex = elements.studenteSelect ? parseInt(elements.studenteSelect.value) : -1;

    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= currentRisultati.length) {
        showToast('Seleziona uno studente da verificare', 'error');
        return;
    }

    const risultatoStudente = currentRisultati[selectedIndex];
    const nomeStudente = risultatoStudente.studente;
    const notes = elements.reviewNotes.value.trim();

    showLoading(`Verifica correzione di ${nomeStudente}...`);

    try {
        const prompt = `Sei un professore esperto di ${currentMateria}.
Hai corretto il compito dello studente "${nomeStudente}" e ora devi rivedere la tua correzione.

SOLUZIONI DI RIFERIMENTO:
${JSON.stringify(currentSoluzioni, null, 2)}

CORREZIONE EFFETTUATA PER ${nomeStudente.toUpperCase()}:
${JSON.stringify(risultatoStudente, null, 2)}

${notes ? `NOTE SPECIFICHE: ${notes}` : 'Rivedi tutti i punteggi e le valutazioni.'}

ISTRUZIONI:
1. Analizza attentamente la correzione effettuata
2. Verifica che i punteggi assegnati siano corretti
3. Se trovi errori, CORREGGI la valutazione
4. Restituisci la correzione (corretta o confermata) in formato JSON

IMPORTANTE: Rispondi SOLO con un JSON valido nel seguente formato:
{
  "studente": "${nomeStudente}",
  "modifiche_effettuate": true/false,
  "riepilogo": "Descrizione delle modifiche o conferma che tutto è corretto",
  "dettaglio_modifiche": ["Modifica 1", "Modifica 2", ...] oppure [] se nessuna modifica,
  "correzione_aggiornata": { ... la correzione nel formato originale, corretta se necessario ... }
}

Rispondi SOLO con il JSON, senza altri commenti.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
                })
            }
        );

        const data = await response.json();
        console.log('Risposta API reviewCalcs:', JSON.stringify(data, null, 2));

        if (data.error) {
            throw new Error(data.error.message || 'Errore API');
        }

        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Estrai il JSON dalla risposta
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
        if (jsonText.startsWith('```')) jsonText = jsonText.slice(3);
        if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);
        jsonText = jsonText.trim();

        const risultato = JSON.parse(jsonText);

        // Aggiorna la correzione se sono state effettuate modifiche
        if (risultato.modifiche_effettuate && risultato.correzione_aggiornata) {
            currentRisultati[selectedIndex] = risultato.correzione_aggiornata;
            // Aggiorna la visualizzazione
            renderRisultati();
        }

        // Costruisci il messaggio di riepilogo
        let htmlRisultato = `<h4>📝 Verifica Correzione: ${nomeStudente}</h4>`;

        if (risultato.modifiche_effettuate) {
            htmlRisultato += `
                <div class="review-modified">
                    <p><strong>⚠️ Correzione Modificata</strong></p>
                    <p>${risultato.riepilogo}</p>
                    <div class="modifiche-lista">
                        <strong>Modifiche effettuate:</strong>
                        <ul>
                            ${risultato.dettaglio_modifiche.map(m => `<li>${m}</li>`).join('')}
                        </ul>
                    </div>
                    <p class="success-text">✅ La correzione è stata aggiornata automaticamente!</p>
                </div>
            `;
            showToast(`Correzione di ${nomeStudente} aggiornata!`, 'warning');
        } else {
            htmlRisultato += `
                <div class="review-confirmed">
                    <p><strong>✅ Correzione Confermata</strong></p>
                    <p>${risultato.riepilogo}</p>
                    <p class="success-text">Nessuna modifica necessaria.</p>
                </div>
            `;
            showToast(`Correzione di ${nomeStudente} verificata!`, 'success');
        }

        elements.reviewResult.innerHTML = htmlRisultato;
        elements.reviewResult.classList.remove('hidden');

    } catch (error) {
        console.error('Errore verifica correzione:', error);

        elements.reviewResult.innerHTML = `
            <h4>❌ Errore nella verifica</h4>
            <p>${error.message}</p>
            <p class="hint">Prova a cliccare di nuovo il pulsante.</p>
        `;
        elements.reviewResult.classList.remove('hidden');
        showToast(`Errore: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Funzione per rivalutare uno studente riscansionando le immagini originali
async function handleReanalyzeFromImage() {
    if (!currentApiKey) {
        showToast('Inserisci prima la API Key Gemini', 'error');
        return;
    }

    if (currentRisultati.length === 0) {
        showToast('Non ci sono correzioni da rivalutare', 'error');
        return;
    }

    // Ottieni lo studente selezionato
    const selectedIndex = elements.studenteSelect ? parseInt(elements.studenteSelect.value) : -1;

    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= currentRisultati.length) {
        showToast('Seleziona uno studente da rivalutare', 'error');
        return;
    }

    const risultatoStudente = currentRisultati[selectedIndex];
    const nomeStudente = risultatoStudente.studente;

    // Verifica che ci siano le immagini originali
    if (!risultatoStudente.immaginiOriginali || risultatoStudente.immaginiOriginali.length === 0) {
        showToast('Immagini originali non disponibili per questo studente', 'error');
        return;
    }

    const notes = elements.reviewNotes.value.trim();

    showLoading(`Rivalutazione da immagine di ${nomeStudente}...`);

    try {
        // Rianalizza le immagini originali
        const nuovoRisultato = await analyzeStudentWork(
            currentApiKey,
            risultatoStudente.immaginiOriginali,
            currentSoluzioni,
            currentMateria,
            nomeStudente
        );

        // Mantieni le immagini originali nel nuovo risultato
        nuovoRisultato.immaginiOriginali = risultatoStudente.immaginiOriginali;

        // Confronta i risultati per mostrare le differenze
        const vecchioVoto = risultatoStudente.votoFinale;
        const nuovoVoto = nuovoRisultato.votoFinale;
        const differenzaVoto = nuovoVoto - vecchioVoto;

        // Aggiorna il risultato
        currentRisultati[selectedIndex] = nuovoRisultato;
        renderRisultati();

        // Mostra il riepilogo delle modifiche
        let htmlRisultato = `<h4>📷 Rivalutazione da Immagine: ${nomeStudente}</h4>`;

        if (Math.abs(differenzaVoto) > 0.1) {
            htmlRisultato += `
                <div class="review-modified">
                    <p><strong>⚠️ Voto Modificato</strong></p>
                    <p>Voto precedente: <strong>${vecchioVoto.toFixed(1)}</strong></p>
                    <p>Nuovo voto: <strong>${nuovoVoto.toFixed(1)}</strong> (${differenzaVoto > 0 ? '+' : ''}${differenzaVoto.toFixed(1)})</p>
                    <p class="success-text">✅ La correzione è stata aggiornata con la nuova analisi!</p>
                </div>
            `;
            showToast(`Voto di ${nomeStudente} aggiornato: ${nuovoVoto.toFixed(1)}`, 'warning');
        } else {
            htmlRisultato += `
                <div class="review-confirmed">
                    <p><strong>✅ Correzione Confermata</strong></p>
                    <p>Voto: <strong>${nuovoVoto.toFixed(1)}</strong></p>
                    <p class="success-text">La nuova analisi ha confermato la valutazione precedente.</p>
                </div>
            `;
            showToast(`Correzione di ${nomeStudente} confermata!`, 'success');
        }

        elements.reviewResult.innerHTML = htmlRisultato;
        elements.reviewResult.classList.remove('hidden');

    } catch (error) {
        console.error('Errore rivalutazione da immagine:', error);

        elements.reviewResult.innerHTML = `
            <h4>❌ Errore nella rivalutazione</h4>
            <p>${error.message}</p>
            <p class="hint">Prova a cliccare di nuovo il pulsante.</p>
        `;
        elements.reviewResult.classList.remove('hidden');
        showToast(`Errore: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function renderRisultati() {
    // Genera HTML con ultimo risultato espanso, altri compressi
    const totalResults = currentRisultati.length;
    elements.risultatiContainer.innerHTML = currentRisultati
        .map((r, index) => {
            const isLast = index === totalResults - 1;
            return generateStudentResultHTMLWithCollapse(r, isLast);
        })
        .join('');

    // Popola il dropdown per la selezione studente
    updateStudentSelect();
}

// Genera HTML studente con supporto collapse
function generateStudentResultHTMLWithCollapse(risultato, isExpanded = false) {
    const voto = risultato.votoFinale;
    const votoMax = risultato.votoMax || 10;
    const percentuale = (voto / votoMax) * 100;

    let gradeClass = 'high';
    if (percentuale < 60) gradeClass = 'low';
    else if (percentuale < 75) gradeClass = 'medium';

    const collapsedClass = isExpanded ? '' : 'collapsed';
    const bodyStyle = isExpanded ? '' : 'style="display: none;"';

    // Genera contenuto interno usando la funzione esistente ma estraendo solo il body
    const fullHTML = generateStudentResultHTML(risultato);
    const bodyMatch = fullHTML.match(/<div class="result-card-body">([\s\S]*?)<\/div>\s*<\/div>\s*$/);
    const bodyContent = bodyMatch ? bodyMatch[1] : '';

    return `
    <div class="result-card ${collapsedClass}" data-student="${risultato.studente}">
      <div class="result-card-header" onclick="window.toggleResultCard(this)">
        <span class="result-student-name">${risultato.studente}</span>
        <div class="result-grade">
          <span class="grade-value ${gradeClass}">${voto.toFixed(1)}</span>
          <span class="grade-max">/ ${votoMax}</span>
          <span class="collapse-icon">${isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>
      <div class="result-card-body" ${bodyStyle}>
        ${bodyContent}
      </div>
    </div>
  `;
}

// Funzione per toggle espansione/compressione
window.toggleResultCard = function (headerElement) {
    const card = headerElement.closest('.result-card');
    const body = card.querySelector('.result-card-body');
    const icon = card.querySelector('.collapse-icon');

    if (card.classList.contains('collapsed')) {
        card.classList.remove('collapsed');
        body.style.display = 'block';
        icon.textContent = '▼';
    } else {
        card.classList.add('collapsed');
        body.style.display = 'none';
        icon.textContent = '▶';
    }
};

// Aggiorna dropdown selezione studente
function updateStudentSelect() {
    if (!elements.studenteSelect) return;

    const currentValue = elements.studenteSelect.value;
    elements.studenteSelect.innerHTML = '<option value="">-- Seleziona uno studente --</option>';

    currentRisultati.forEach((r, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = r.studente;
        elements.studenteSelect.appendChild(option);
    });

    // Seleziona l'ultimo studente aggiunto
    if (currentRisultati.length > 0) {
        elements.studenteSelect.value = currentRisultati.length - 1;
    }
}

// =====================================================
// EXPORT & SAVE
// =====================================================
async function handleExportPdf() {
    showLoading('Generazione PDF...');

    try {
        const filename = `${currentTitolo.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        await exportToPDF(elements.risultatiContainer, filename);
        showToast('PDF esportato con successo!', 'success');
    } catch (error) {
        console.error('Errore export PDF:', error);
        showToast(`Errore export: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function handleSaveToHistory() {
    const compito = {
        titolo: currentTitolo,
        materia: currentMateria,
        traccia: currentTraccia,
        soluzioni: currentSoluzioni,
        risultati: currentRisultati,
        numeroStudenti: currentRisultati.length,
        mediaVoti: currentRisultati.reduce((sum, r) => sum + r.votoFinale, 0) / currentRisultati.length
    };

    saveCompito(compito);
    showToast('Compito salvato nello storico!', 'success');

    // Aggiorna lo storico se visibile
    renderStorico();
}

// =====================================================
// STORICO
// =====================================================
function renderStorico() {
    const materia = elements.filtroMateria.value;
    const data = elements.filtroData.value;

    const compiti = filterCompiti(materia, data);

    if (compiti.length === 0) {
        elements.storicoList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>Nessun compito trovato</p>
      </div>
    `;
        return;
    }

    elements.storicoList.innerHTML = compiti.map(c => `
    <div class="storico-item" data-id="${c.id}">
      <div class="storico-item-info">
        <h3>${c.titolo}</h3>
        <div class="storico-item-meta">
          <span>📚 ${c.materia.charAt(0).toUpperCase() + c.materia.slice(1)}</span>
          <span>📅 ${new Date(c.dataCreazione).toLocaleDateString('it-IT')}</span>
          <span>👥 ${c.numeroStudenti} studenti</span>
          <span>📊 Media: ${c.mediaVoti.toFixed(1)}</span>
        </div>
      </div>
      <div class="storico-item-actions">
        <button class="btn-secondary btn-small" onclick="window.viewStorico('${c.id}')">
          👁️ Visualizza
        </button>
        <button class="btn-icon" onclick="window.deleteStorico('${c.id}')" title="Elimina">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

function filterStorico() {
    renderStorico();
}

window.viewStorico = (id) => {
    const compito = getAllCompiti().find(c => c.id === id);
    if (!compito) return;

    // Carica i dati del compito
    currentTitolo = compito.titolo;
    currentMateria = compito.materia;
    currentTraccia = compito.traccia;
    currentSoluzioni = compito.soluzioni;
    currentRisultati = compito.risultati;

    // Aggiorna UI
    elements.titoloInput.value = currentTitolo;
    elements.materiaSelect.value = currentMateria;
    elements.tracciaText.value = currentTraccia;

    // Mostra soluzioni e risultati
    elements.soluzioniContainer.innerHTML = generateSolutionsHTML(currentSoluzioni);
    elements.stepSoluzioni.classList.remove('hidden');

    renderRisultati();
    elements.stepRisultati.classList.remove('hidden');

    // Switch to nuova-correzione tab
    switchTab('nuova-correzione');

    showToast('Compito caricato dallo storico', 'success');
};

window.deleteStorico = (id) => {
    if (confirm('Sei sicuro di voler eliminare questo compito dallo storico?')) {
        deleteCompito(id);
        renderStorico();
        showToast('Compito eliminato', 'success');
    }
};

// =====================================================
// UI HELPERS
// =====================================================
function showLoading(text = 'Caricamento...') {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// =====================================================
// START
// =====================================================
init();
