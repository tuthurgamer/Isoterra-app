@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js n'est pas installe ou n'est pas dans le PATH.
    echo Telecharge-le depuis https://nodejs.org ^(version 22.5.0 ou plus recente^), puis relance ce fichier.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installation des dependances ^(premier lancement, ca peut prendre une minute^)...
    call npm install
    if errorlevel 1 (
        echo Erreur pendant l'installation npm. Verifie ta connexion internet puis relance ce fichier.
        pause
        exit /b 1
    )
)

if not exist "data\isoterra.db" (
    echo Creation de la base de donnees...
    call node db\seed.js
)

echo.
echo Demarrage du serveur Isoterra dans une nouvelle fenetre...
start "Isoterra - serveur (ne pas fermer)" cmd /k npm start

timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo Isoterra tourne sur http://localhost:3000
echo Pour tout arreter, ferme la fenetre du serveur.
echo Tu peux fermer cette fenetre-ci.
echo.
pause
