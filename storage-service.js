/**
 * Storage Service - Gestione salvataggio storico compiti
 * Usa localStorage per persistere i dati
 */

const STORAGE_KEY = 'math-grader-history';
const API_KEY_STORAGE = 'math-grader-api-key';

/**
 * Salva la API Key
 * @param {string} apiKey 
 */
export function saveApiKey(apiKey) {
    localStorage.setItem(API_KEY_STORAGE, apiKey);
}

/**
 * Recupera la API Key salvata
 * @returns {string|null}
 */
export function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE);
}

/**
 * Recupera tutti i compiti salvati
 * @returns {Array} - Lista compiti
 */
export function getAllCompiti() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * Salva un nuovo compito nello storico
 * @param {object} compito - Dati del compito
 * @returns {string} - ID del compito salvato
 */
export function saveCompito(compito) {
    const compiti = getAllCompiti();
    const id = generateId();

    const nuovoCompito = {
        id,
        dataCreazione: new Date().toISOString(),
        ...compito
    };

    compiti.unshift(nuovoCompito); // Aggiungi in cima
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compiti));

    return id;
}

/**
 * Recupera un compito specifico per ID
 * @param {string} id 
 * @returns {object|null}
 */
export function getCompitoById(id) {
    const compiti = getAllCompiti();
    return compiti.find(c => c.id === id) || null;
}

/**
 * Elimina un compito dallo storico
 * @param {string} id 
 */
export function deleteCompito(id) {
    const compiti = getAllCompiti();
    const filtered = compiti.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Filtra compiti per materia
 * @param {string} materia - 'tutti', 'matematica', 'fisica'
 * @returns {Array}
 */
export function filterByMateria(materia) {
    if (materia === 'tutti') {
        return getAllCompiti();
    }
    return getAllCompiti().filter(c => c.materia === materia);
}

/**
 * Filtra compiti per data
 * @param {string} dataStr - Data in formato YYYY-MM-DD
 * @returns {Array}
 */
export function filterByData(dataStr) {
    if (!dataStr) {
        return getAllCompiti();
    }
    return getAllCompiti().filter(c => {
        const compitoDate = new Date(c.dataCreazione).toISOString().split('T')[0];
        return compitoDate === dataStr;
    });
}

/**
 * Filtra compiti per materia e data
 * @param {string} materia 
 * @param {string} dataStr 
 * @returns {Array}
 */
export function filterCompiti(materia, dataStr) {
    let risultati = getAllCompiti();

    if (materia && materia !== 'tutti') {
        risultati = risultati.filter(c => c.materia === materia);
    }

    if (dataStr) {
        risultati = risultati.filter(c => {
            const compitoDate = new Date(c.dataCreazione).toISOString().split('T')[0];
            return compitoDate === dataStr;
        });
    }

    return risultati;
}

/**
 * Genera un ID univoco
 * @returns {string}
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Esporta tutti i dati (per backup)
 * @returns {string} - JSON string
 */
export function exportData() {
    return JSON.stringify({
        compiti: getAllCompiti(),
        exportDate: new Date().toISOString()
    }, null, 2);
}

/**
 * Importa dati da backup
 * @param {string} jsonString 
 */
export function importData(jsonString) {
    const data = JSON.parse(jsonString);
    if (data.compiti && Array.isArray(data.compiti)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.compiti));
    }
}
