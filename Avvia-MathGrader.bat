@echo off
echo Avvio Math Grader Mobile...
cd "%~dp0"
echo Compilazione in corso...
call npm run build
echo.
echo Server avviato! Apri il browser all'indirizzo mostrato qui sotto:
echo.
npx serve dist
pause
