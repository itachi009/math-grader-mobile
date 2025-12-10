# Guida Completa: Build APK su Appcircle.io

Questa guida ti spiega come compilare l'app Math Grader in un APK Android usando Appcircle.io (gratis, senza Android Studio locale).

---

## 📋 Prerequisiti

1. ✅ Account Git (GitHub/GitLab) - **HAI GIÀ** ✓
2. ✅ Account Appcircle.io (gratis) - da creare
3. ✅ Progetto Capacitor - **PRONTO** ✓

---

## 🚀 Step 1: Crea Account Appcircle

1. Vai su https://appcircle.io/
2. Clicca **"Start Free"**
3. Registrati con email o GitHub
4. Conferma email

---

## 📤 Step 2: Carica Progetto su Git

### Opzione A: Repository Nuovo su GitHub

```bash
cd c:\Users\Matteo\.gemini\antigravity\scratch\gemini-translator\math-grader-mobile

git init
git add .
git commit -m "Initial Capacitor setup for Math Grader"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/math-grader-mobile.git
git push -u origin main
```

### Opzione B: Repository Esistente

Se hai già un repo, puoi push direttamente:

```bash
cd c:\Users\Matteo\.gemini\antigravity\scratch\gemini-translator\math-grader-mobile

git add .
git commit -m "Capacitor Android build ready"
git push
```

---

## 🔗 Step 3: Connetti Appcircle a Git

1. Accedi ad Appcircle
2. Clicca **"Add New Build Profile"**
3. Seleziona **"Connect to Repository"**
4. Scegli **GitHub** (o GitLab se usi quello)
5. Autorizza Appcircle ad accedere ai tuoi repository
6. Seleziona il repository **math-grader-mobile**
7. Seleziona branch **main**

---

## ⚙️ Step 4: Configura Build Profile

1. **Platform**: Seleziona **Android**
2. **Project Type**: Seleziona **Capacitor**
3. **Build Configuration**:
   - Build Mode: **Release**
   - Versione: **1.0.0**
   - Build Number: **1**

4. Clicca **"Save"**

---

## 🏗️ Step 5: Avvia Prima Build

1. Clicca **"Start Build"**
2. Aspetta 5-10 minuti (prima build più lunga)
3. Vedrai progress bar in tempo reale

---

## 📥 Step 6: Scarica APK

1. Quando build è completata, vedrai **"Success" ✓**
2. Clicca sul nome della build
3. Trovi **"Download APK"**
4. Salva il file `math-grader-1.0.0.apk`

---

## 📱 Step 7: Installa su Android

1. Trasferisci APK sul telefono (USB, email, Drive)
2. Apri APK sul telefono
3. Android chiederà permessi "Sorgenti Sconosciute" → **Consenti**
4. Clicca **"Installa"**
5. ✅ App installata!

---

## 🔧 Build Successive (Aggiornamenti)

Ogni volta che modifichi il codice:

```bash
npm run build
npx cap sync android
git add .
git commit -m "Aggiornamento funzionalità X"
git push
```

Appcircle rileverà il push e farà build automatica!

---

## 💡 Troubleshooting

### Build fallisce con "Gradle error"
- Apri "Build Logs" in Appcircle
- Cerca linea con `ERROR:`
- Spesso è un problema di versione Java/Gradle (contattami)

### APK non si installa
- Verifica che sia scaricato completamente
- Abilita "Sorgenti sconosciute" in **Impostazioni → Sicurezza**

### App crasha all'avvio
- Controlla permessi fotocamera in **Impostazioni → App → Math Grader**

---

## 📊 Limiti Piano Gratuito Appcircle

- ✅ 20 build/mese
- ✅ 1 progetto concorrente
- ✅ APK fino 500 MB
- ✅ Storage illimitato build

**Più che sufficiente per questo progetto!**

---

## ✨ Note Finali

- **Icona App**: Verrà usata quella di default di Capacitor (blu)
- **Nome App**: "Math Grader" (come configurato)
- **Permessi**: Camera (richiesto al primo uso)
- **Risoluzione Foto**: 1024x1024 @ 80% qualità (ottimizzato!)

---

### Hai Problemi?

Contattami inviando:
1. Screenshot errore Appcircle
2. Link al repository GitHub
3. Build log (se disponibile)

Buona build! 🚀
