# 🚀 Guida GitHub Actions - Build APK Automatica

Questa guida ti spiega come compilare l'app Math Grader in APK Android usando **GitHub Actions** (gratis, automatico, nessuna email aziendale richiesta).

---

## ✅ Vantaggi GitHub Actions

- ✅ **Email personale OK** (Gmail, Outlook, qualsiasi)
- ✅ **Completamente gratuito** (2000 minuti/mese)
- ✅ **Build automatica** ad ogni push
- ✅ **APK scaricabile** direttamente da GitHub
- ✅ **Nessuna configurazione esterna**

---

## 📋 Prerequisiti

1. ✅ Account GitHub - **HAI GIÀ** ✓
2. ✅ Progetto Capacitor - **PRONTO** ✓
3. ✅ Workflow configurato - **FATTO** ✓

---

## 🚀 Step 1: Crea Repository su GitHub

### Se NON hai ancora un repository:

1. Vai su https://github.com/
2. Clicca **"New repository"** (icona +)
3. Nome: `math-grader-mobile`
4. Visibilità: **Public** (gratis) o **Private** (gratis con Actions)
5. **NON** aggiungere README, .gitignore, license
6. Clicca **"Create repository"**

---

## 📤 Step 2: Push Codice su GitHub

Apri PowerShell nella cartella del progetto:

```powershell
cd c:\Users\Matteo\.gemini\antigravity\scratch\gemini-translator\math-grader-mobile

# Inizializza Git (se non già fatto)
git init

# Aggiungi tutti i file
git add .

# Commit iniziale
git commit -m "Capacitor setup with GitHub Actions build"

# Collega al repository GitHub
git remote add origin https://github.com/TUO_USERNAME/math-grader-mobile.git

# Push su GitHub
git branch -M main
git push -u origin main
```

**Sostituisci `TUO_USERNAME`** con il tuo username GitHub!

---

## ⚙️ Step 3: Build Automatica Partirà!

Appena fai il push, GitHub Actions:

1. ⚡ Rileva il workflow `.github/workflows/android-build.yml`
2. 🔨 Avvia build automatica (5-10 minuti)
3. 📦 Genera APK `app-release-unsigned.apk`

---

## 📥 Step 4: Scarica APK

1. Vai su GitHub: `https://github.com/TUO_USERNAME/math-grader-mobile`
2. Clicca tab **"Actions"**
3. Vedrai build in corso (icona gialla 🟡) o completata (✅ verde)
4. Clicca sulla build
5. Scorri in basso: sezione **"Artifacts"**
6. Clicca **"math-grader-apk"** per scaricare ZIP
7. Estrai il file `app-release-unsigned.apk`

---

## 📱 Step 5: Installa su Android

1. Trasferisci APK sul telefono
2. Apri APK
3. Android chiede "Installa app sconosciuta" → **Consenti**
4. Installa
5. ✅ **Fatto!**

---

## 🔄 Build Successive (Aggiornamenti)

Ogni volta che modifichi il codice:

```powershell
# Modifica i file...
npm run build

# Commit e push
git add .
git commit -m "Descrizione modifica"
git push
```

**GitHub Actions farà build automatica!** 🎉

---

## 🐛 Troubleshooting

### Build fallisce nella tab Actions

1. Clicca sulla build fallita
2. Clicca sullo step rosso ❌
3. Leggi l'errore
4. Errori comuni:
   - **Gradle error**: Problema dipendenze Android (normale prima volta, ripeti build)
   - **Node error**: `npm ci` fallito (cancella `package-lock.json` locale, ricommit)

### APK non funziona sul telefono

**Questo APK è "unsigned" (non firmato)**. Va bene per test personali, ma:
- Potrebbe dare warning "App non verificata"
- Non pubblicabile su Play Store

**Per APK firmato:**
- Devo aggiungere signing config (5 min)
- Necessita keystore (te lo genero)

---

## 📊 Limiti GitHub Actions (Gratis)

- ✅ **2000 minuti/mese** build (circa 200 build Android)
- ✅ **500 MB** storage artifact
- ✅ **Illimitati** repository pubblici
- ✅ **2000 minuti** anche per repo privati

**Più che sufficiente!**

---

## 🔐 Nota: APK Unsigned vs Signed

### APK Unsigned (attuale):
- ✅ Funziona sul tuo telefono
- ✅ Per test personali
- ⚠️ Warning "App non verificata"
- ❌ Non pubblicabile su Play Store

### APK Signed:
- ✅ Nessun warning
- ✅ Pubblicabile Play Store
- ⚠️ Serve keystore (lo genero per te se serve)

**Per ora usa unsigned. Se funziona bene, ti faccio quello signed!**

---

## ✨ Prossimi Passi Consigliati

1. **Push su GitHub** (segui sopra)
2. **Aspetta build** (5-10 min)
3. **Scarica APK** da Artifacts
4. **Testa su telefono**
5. Se funziona → **Firma APK** (opzionale)

---

## 💡 Tips

- **Branch protection**: Non necessaria per progetti personali
- **Notifications**: GitHub ti manda email se build fallisce
- **Badge**: Puoi aggiungere badge build nel README

---

**Hai problemi con il push?** Dimmi l'errore e ti aiuto! 🚀
