/**
 * Gemini Service - Servizio per interazione con Gemini API
 * Gestisce generazione soluzioni e analisi compiti
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL_TEXT = 'gemini-2.5-flash'; // Per generare soluzioni
const MODEL_VISION = 'gemini-2.5-flash'; // Per analisi immagini (più veloce)

/**
 * Genera le soluzioni dalla traccia usando Gemini
 * @param {string} apiKey - API Key Gemini
 * @param {string} traccia - Testo della traccia
 * @param {string} materia - Materia (matematica/fisica)
 * @param {string} tracciaImageBase64 - Immagine della traccia in base64 (opzionale)
 * @returns {Promise<object>} - Soluzioni generate
 */
export async function generateSolutions(apiKey, traccia, materia, tracciaImageBase64 = null) {
  const prompt = `Sei un professore di ${materia} delle superiori.

TRACCIA:
${traccia}

Per ogni esercizio fornisci una soluzione CONCISA in formato JSON:
{
  "esercizi": [
    {
      "numero": "1",
      "titolo": "breve titolo",
      "soluzione": "passaggi essenziali della soluzione",
      "risultato": "risultato finale",
      "punteggioMax": 3
    }
  ],
  "punteggioTotale": 10
}

REGOLE:
- Sii CONCISO, evita spiegazioni prolisse
- Usa LaTeX per le formule: $formula$
- Rispondi SOLO con il JSON, senza altro testo`;

  const requestBody = {
    contents: [{
      parts: []
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 16384
    }
  };

  // Se c'è un'immagine della traccia, usa il modello vision
  if (tracciaImageBase64) {
    requestBody.contents[0].parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: tracciaImageBase64
      }
    });
    requestBody.contents[0].parts.push({
      text: prompt
    });
  } else {
    requestBody.contents[0].parts.push({
      text: prompt
    });
  }

  const model = tracciaImageBase64 ? MODEL_VISION : MODEL_TEXT;
  const response = await fetch(
    `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Errore nella chiamata API');
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('Nessuna risposta ricevuta da Gemini');
  }

  return parseGeminiJSON(textContent);
}

/**
 * Tenta di parsare JSON anche se malformato/troncato
 */
function parseGeminiJSON(text) {
  // Prima prova il parsing diretto
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log('JSON parsing fallito, tentativo di riparazione...');
  }

  // Rimuovi eventuali markdown code blocks
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('Tentativo 2 fallito, cerco JSON nel testo...');
  }

  // Cerca il JSON nel testo
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    let jsonStr = jsonMatch[0];

    // Prova a parsare direttamente
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.log('JSON estratto non valido, tentativo di riparazione...');
    }

    // Tenta di riparare JSON troncato
    jsonStr = repairTruncatedJSON(jsonStr);

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Impossibile riparare JSON:', e);
      console.log('Contenuto originale:', text.substring(0, 500));
    }
  }

  throw new Error('Risposta non valida da Gemini. Riprova con una traccia più breve.');
}

/**
 * Tenta di riparare un JSON troncato
 */
function repairTruncatedJSON(jsonStr) {
  let repaired = jsonStr;

  // Conta parentesi e brackets aperti
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"' && !escaped) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braces++;
      else if (char === '}') braces--;
      else if (char === '[') brackets++;
      else if (char === ']') brackets--;
    }
  }

  // Se siamo in una stringa, chiudila
  if (inString) {
    repaired += '"';
  }

  // Rimuovi eventuale virgola finale
  repaired = repaired.replace(/,\s*$/, '');

  // Chiudi brackets e braces mancanti
  while (brackets > 0) {
    repaired += ']';
    brackets--;
  }
  while (braces > 0) {
    repaired += '}';
    braces--;
  }

  return repaired;
}

/**
 * Analizza il compito di uno studente confrontandolo con le soluzioni
 * @param {string} apiKey - API Key Gemini
 * @param {string|string[]} imagesBase64 - Immagine(i) del compito in base64
 * @param {object} soluzioni - Soluzioni generate precedentemente
 * @param {string} materia - Materia
 * @param {string} nomeStudente - Nome dello studente
 * @returns {Promise<object>} - Analisi e voto
 */
export async function analyzeStudentWork(apiKey, imagesBase64, soluzioni, materia, nomeStudente) {
  const soluzioniJson = JSON.stringify(soluzioni, null, 2);

  // Supporta sia singola immagine che array
  const images = Array.isArray(imagesBase64) ? imagesBase64 : [imagesBase64];
  const numPages = images.length;

  const prompt = `Sei un professore esperto di ${materia} delle scuole superiori italiane.
Stai correggendo il compito dello studente: ${nomeStudente}

${numPages > 1 ? `ATTENZIONE: Il compito è composto da ${numPages} pagine/immagini. Analizza TUTTE le pagine per correggere l'intero compito.` : ''}

SOLUZIONI CORRETTE (da usare come riferimento):
${soluzioniJson}

Analizza le immagini del compito dello studente e per ogni esercizio:
1. Identifica cosa ha scritto lo studente
2. Confronta con la soluzione corretta
3. Identifica errori (concettuali, di calcolo, di procedimento)
4. Assegna un punteggio parziale

CRITERI DI VALUTAZIONE:
- Punteggio pieno: soluzione corretta e ben argomentata
- Punteggio parziale: approccio corretto ma con errori minori
- Punteggio minimo: tentativo con errori gravi ma qualche elemento corretto
- Zero: risposta assente o completamente errata

Rispondi in formato JSON con questa struttura:
{
  "studente": "${nomeStudente}",
  "esercizi": [
    {
      "numero": "1",
      "rispostaStudente": "Trascrizione di cosa ha scritto lo studente",
      "analisi": "Analisi dettagliata della risposta",
      "errori": ["errore 1", "errore 2"] oppure [],
      "puntiCorretti": ["cosa ha fatto bene"],
      "punteggio": 2.5,
      "punteggioMax": 3,
      "stato": "corretto" | "parziale" | "errato" | "non_svolto"
    }
  ],
  "votoFinale": 7.5,
  "votoMax": 10,
  "giudizioGenerale": "Giudizio complessivo sulla prova",
  "suggerimenti": ["suggerimento per migliorare 1", "suggerimento 2"]
}`;

  // Costruisci l'array di parts con tutte le immagini
  const parts = [];

  // Aggiungi tutte le immagini
  for (let i = 0; i < images.length; i++) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: images[i]
      }
    });
  }

  // Aggiungi il prompt alla fine
  parts.push({ text: prompt });

  const requestBody = {
    contents: [{
      parts: parts
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 16384
    }
  };

  const response = await fetch(
    `${GEMINI_API_BASE}/${MODEL_VISION}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Errore nella chiamata API');
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('Nessuna risposta ricevuta da Gemini');
  }

  return parseGeminiJSON(textContent);
}

/**
 * Testa la validità di una API Key
 * @param {string} apiKey - API Key da testare
 * @returns {Promise<{valid: boolean, error?: string}>} - risultato test
 */
export async function testApiKey(apiKey) {
  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${MODEL_VISION}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'OK' }]
          }],
          generationConfig: {
            maxOutputTokens: 10
          }
        })
      }
    );

    if (response.ok) {
      return { valid: true };
    } else {
      const errorData = await response.json();
      console.error('API Key test failed:', errorData);
      return {
        valid: false,
        error: errorData.error?.message || `HTTP ${response.status}`
      };
    }
  } catch (e) {
    console.error('API Key test exception:', e);
    return { valid: false, error: e.message };
  }
}
