/**
 * Report Generator - Generazione e export report PDF
 */

/**
 * Renderizza le formule LaTeX nel testo usando KaTeX
 * @param {string} text - Testo con formule LaTeX
 * @returns {string} - HTML con formule renderizzate
 */
export function renderMath(text) {
  if (!text) return '';

  // Sostituisci formule a blocco $$...$$
  let result = text.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: true, throwOnError: false });
    } catch (e) {
      return match;
    }
  });

  // Sostituisci formule inline $...$
  result = result.replace(/\$(.*?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });

  return result;
}

/**
 * Genera l'HTML delle soluzioni per visualizzazione
 * @param {object} soluzioni - Oggetto soluzioni da Gemini
 * @returns {string} - HTML formattato
 */
export function generateSolutionsHTML(soluzioni) {
  if (!soluzioni || !soluzioni.esercizi) {
    return '<p class="error">Nessuna soluzione disponibile</p>';
  }

  let html = '';

  soluzioni.esercizi.forEach(ex => {
    html += `
      <div class="solution-item">
        <h4>Esercizio ${ex.numero}: ${ex.titolo || ''}</h4>
        <div class="solution-content">
          <p><strong>Soluzione:</strong></p>
          <div class="solution-text">${renderMath(ex.soluzione)}</div>
          <p><strong>Risultato:</strong> ${renderMath(ex.risultato)}</p>
          ${ex.puntiChiave && ex.puntiChiave.length > 0 ? `
            <p><strong>Punti chiave:</strong></p>
            <ul>
              ${ex.puntiChiave.map(p => `<li>${p}</li>`).join('')}
            </ul>
          ` : ''}
          <p class="score-info">Punteggio massimo: <strong>${ex.punteggioMax}</strong> punti</p>
        </div>
      </div>
    `;
  });

  if (soluzioni.note) {
    html += `<div class="solution-notes"><strong>Note:</strong> ${soluzioni.note}</div>`;
  }

  return html;
}

/**
 * Genera l'HTML dei risultati di un singolo studente
 * @param {object} risultato - Risultato analisi studente
 * @returns {string} - HTML formattato
 */
export function generateStudentResultHTML(risultato) {
  const voto = risultato.votoFinale;
  const votoMax = risultato.votoMax || 10;
  const percentuale = (voto / votoMax) * 100;

  let gradeClass = 'high';
  if (percentuale < 60) gradeClass = 'low';
  else if (percentuale < 75) gradeClass = 'medium';

  let exercisesHTML = '';

  if (risultato.esercizi && risultato.esercizi.length > 0) {
    // Ordina esercizi per numero (crescente)
    const esercizioOrdinati = [...risultato.esercizi].sort((a, b) => {
      const numA = parseInt(a.numero) || 0;
      const numB = parseInt(b.numero) || 0;
      return numA - numB;
    });

    esercizioOrdinati.forEach(ex => {
      const statusClass = ex.stato === 'corretto' ? 'correct' :
        ex.stato === 'parziale' ? 'partial' : 'wrong';

      exercisesHTML += `
        <div class="exercise-result">
          <div class="exercise-header">
            <span class="exercise-title">Esercizio ${ex.numero}</span>
            <span class="exercise-points ${statusClass}">${ex.punteggio}/${ex.punteggioMax}</span>
          </div>
          
          ${ex.rispostaStudente ? `
            <div class="student-answer">
              <strong>Risposta studente:</strong>
              <p>${renderMath(ex.rispostaStudente)}</p>
            </div>
          ` : ''}
          
          <div class="exercise-analysis">
            ${renderMath(ex.analisi)}
          </div>
          
          ${ex.puntiCorretti && ex.puntiCorretti.length > 0 ? `
            <div class="exercise-correct">
              <h5>✓ Punti corretti:</h5>
              <ul>${ex.puntiCorretti.map(p => `<li>${p}</li>`).join('')}</ul>
            </div>
          ` : ''}
          
          ${ex.errori && ex.errori.length > 0 ? `
            <div class="exercise-errors">
              <h5>✗ Errori identificati:</h5>
              <ul>${ex.errori.map(e => `<li>${e}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>
      `;
    });
  }

  let suggestionsHTML = '';
  if (risultato.suggerimenti && risultato.suggerimenti.length > 0) {
    suggestionsHTML = `
      <div class="exercise-suggestion">
        <h5>💡 Suggerimenti per migliorare:</h5>
        <ul>${risultato.suggerimenti.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
    `;
  }

  return `
    <div class="result-card" data-student="${risultato.studente}">
      <div class="result-card-header">
        <span class="result-student-name">${risultato.studente}</span>
        <div class="result-grade">
          <span class="grade-value ${gradeClass}">${voto.toFixed(1)}</span>
          <span class="grade-max">/ ${votoMax}</span>
        </div>
      </div>
      <div class="result-card-body">
        ${exercisesHTML}
        
        ${risultato.giudizioGenerale ? `
          <div class="general-assessment">
            <h4>Giudizio complessivo</h4>
            <p>${risultato.giudizioGenerale}</p>
          </div>
        ` : ''}
        
        ${suggestionsHTML}
      </div>
    </div>
  `;
}

/**
 * Genera il report completo per tutti gli studenti
 * @param {object} datiCompito - Dati completi del compito
 * @returns {string} - HTML completo
 */
export function generateFullReportHTML(datiCompito) {
  const { titolo, materia, data, risultati } = datiCompito;

  // Calcola statistiche
  const voti = risultati.map(r => r.votoFinale);
  const media = voti.reduce((a, b) => a + b, 0) / voti.length;
  const max = Math.max(...voti);
  const min = Math.min(...voti);
  const sufficienti = voti.filter(v => v >= 6).length;

  let html = `
    <div class="report-header">
      <h1>${titolo}</h1>
      <div class="report-meta">
        <span>📚 ${materia.charAt(0).toUpperCase() + materia.slice(1)}</span>
        <span>📅 ${new Date(data).toLocaleDateString('it-IT')}</span>
        <span>👥 ${risultati.length} studenti</span>
      </div>
    </div>
    
    <div class="report-stats">
      <div class="stat-card">
        <span class="stat-value">${media.toFixed(1)}</span>
        <span class="stat-label">Media</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${max.toFixed(1)}</span>
        <span class="stat-label">Voto Max</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${min.toFixed(1)}</span>
        <span class="stat-label">Voto Min</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${sufficienti}/${risultati.length}</span>
        <span class="stat-label">Sufficienti</span>
      </div>
    </div>
    
    <div class="results-list">
      ${risultati.map(r => generateStudentResultHTML(r)).join('')}
    </div>
  `;

  return html;
}

/**
 * Esporta il report in PDF usando finestra di stampa
 * @param {HTMLElement} element - Elemento da stampare
 * @param {string} filename - Nome del file (usato come titolo)
 */
export async function exportToPDF(element, filename) {
  // Apri una nuova finestra per la stampa
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Impossibile aprire la finestra di stampa. Disabilita il blocco popup e riprova.');
    return;
  }

  // Scrivi il contenuto HTML con stili ottimizzati per stampa
  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${filename}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <style>
        * { 
            font-family: Arial, sans-serif !important; 
            box-sizing: border-box;
        }
        body { 
            margin: 20px; 
            padding: 0; 
            background: white !important; 
            color: #333 !important;
            font-size: 11pt;
            line-height: 1.4;
        }
        h1 {
            text-align: center;
            color: #6366f1 !important;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 18pt;
        }
        .result-card {
            border: 1px solid #333 !important;
            margin-bottom: 15px;
            background: white !important;
            page-break-inside: avoid;
        }
        .result-card-header {
            background: #e0e0e0 !important;
            padding: 10px 15px !important;
            border-bottom: 1px solid #333 !important;
        }
        .result-student-name {
            font-size: 14pt !important;
            font-weight: bold !important;
            color: #333 !important;
        }
        .result-grade {
            float: right;
        }
        .grade-value {
            font-size: 18pt !important;
            font-weight: bold !important;
            color: #6366f1 !important;
        }
        .grade-value.low { color: #dc3545 !important; }
        .grade-value.medium { color: #b8860b !important; }
        .grade-value.high { color: #228b22 !important; }
        .grade-max { color: #666 !important; }
        .result-card-body {
            padding: 15px !important;
            background: white !important;
        }
        .exercise-result {
            padding: 8px 0 !important;
            border-bottom: 1px solid #ccc !important;
            background: white !important;
        }
        .exercise-result:last-child {
            border-bottom: none !important;
        }
        .exercise-header {
            margin-bottom: 8px !important;
        }
        .exercise-title {
            font-weight: bold !important;
            color: #333 !important;
        }
        .exercise-points {
            float: right;
            background: #ddd !important;
            padding: 2px 8px !important;
            border-radius: 8px;
            font-size: 10pt !important;
            color: #333 !important;
        }
        .exercise-points.correct { background: #c8e6c9 !important; color: #2e7d32 !important; }
        .exercise-points.partial { background: #fff9c4 !important; color: #f9a825 !important; }
        .exercise-points.wrong { background: #ffcdd2 !important; color: #c62828 !important; }
        .exercise-analysis {
            color: #444 !important;
            margin: 8px 0 !important;
            background: white !important;
        }
        .exercise-errors {
            background: #ffebee !important;
            border-left: 3px solid #c62828 !important;
            padding: 8px !important;
            margin: 8px 0 !important;
        }
        .exercise-errors h5 {
            color: #c62828 !important;
            margin: 0 0 5px 0 !important;
            font-size: 10pt !important;
        }
        .exercise-correct {
            background: #e8f5e9 !important;
            border-left: 3px solid #2e7d32 !important;
            padding: 8px !important;
            margin: 8px 0 !important;
        }
        .exercise-correct h5 {
            color: #2e7d32 !important;
            margin: 0 0 5px 0 !important;
            font-size: 10pt !important;
        }
        .exercise-suggestion {
            background: #e3f2fd !important;
            border-left: 3px solid #1976d2 !important;
            padding: 8px !important;
            margin: 8px 0 !important;
        }
        .exercise-suggestion h5 {
            color: #1976d2 !important;
            margin: 0 0 5px 0 !important;
            font-size: 10pt !important;
        }
        .general-assessment {
            background: #f5f5f5 !important;
            padding: 10px !important;
            margin-top: 10px !important;
        }
        .general-assessment h4 {
            margin: 0 0 8px 0 !important;
            color: #333 !important;
        }
        .student-answer {
            background: #fafafa !important;
            padding: 8px !important;
            margin: 8px 0 !important;
            border: 1px solid #ddd !important;
        }
        ul {
            margin: 5px 0 !important;
            padding-left: 20px !important;
            color: #444 !important;
        }
        li {
            margin: 3px 0 !important;
        }
        @media print {
            body { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    <h1>📐 Report Correzione Compiti</h1>
    ${element.innerHTML}
</body>
</html>
    `);

  printWindow.document.close();

  // Aspetta il caricamento e poi stampa
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 1000);
}
