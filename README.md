# Isoterra

Carnet d'élevage et registre professionnel pour l'élevage d'arthropodes et mollusques (iules, cloportes, cétoines, réduves, blattes, crabes, escargots...).

Application web installable sur téléphone (PWA), pensée pour tourner en local sur ton PC, puis plus tard sur un Raspberry Pi accessible à distance via Tailscale.

---

## 1. Prérequis

Il te faut **Node.js version 22.5.0 ou plus récente** (l'appli utilise le module SQLite intégré à Node, donc pas besoin d'installer une base de données séparée).

- Télécharge et installe Node.js ici : https://nodejs.org (prends la version "LTS" ou plus récente, en 22.x minimum).
- Pour vérifier que c'est bien installé, ouvre un terminal et tape :
  ```
  node -v
  ```
  Tu dois voir une version `v22.5.0` ou supérieure.

**Ouvrir un terminal dans le dossier du projet :**
- Windows : ouvre le dossier `Isoterra-app` dans l'explorateur de fichiers, puis clique droit → "Ouvrir dans le terminal" (ou PowerShell).
- Mac : ouvre l'app "Terminal", puis tape `cd ` (avec l'espace) et glisse le dossier `Isoterra-app` dedans, puis Entrée.

## 2. Installation (à faire une seule fois)

Dans le terminal, à la racine du dossier `Isoterra-app` :

```
npm install
```

Ça télécharge les quelques bibliothèques nécessaires (Express, EJS, Multer). Ça prend quelques secondes.

Puis initialise la base de données avec les 19 fiches d'espèces et des exemples de bacs :

```
node db/seed.js
```

## 3. Démarrer l'appli

```
npm start
```

Tu dois voir s'afficher :
```
Isoterra tourne sur http://0.0.0.0:3000
```

Ouvre ensuite un navigateur sur ton PC et va sur **http://localhost:3000**.

Pour arrêter le serveur : `Ctrl + C` dans le terminal.

> Astuce développement : `npm run dev` relance automatiquement le serveur à chaque modification de fichier — pratique si tu retouches le code, inutile pour un usage normal.

## 4. Utiliser l'appli depuis ton téléphone (même réseau Wi-Fi)

Le serveur écoute sur toutes les interfaces réseau, donc ton téléphone peut s'y connecter s'il est **sur le même Wi-Fi** que ton PC :

1. Trouve l'adresse IP locale de ton PC :
   - Windows : `ipconfig` dans une invite de commandes → ligne "Adresse IPv4" (ex. `192.168.1.42`).
   - Mac/Linux : `ifconfig` ou `ip addr` dans un terminal.
2. Sur ton téléphone, ouvre un navigateur et va sur `http://<ton-ip>:3000` (ex. `http://192.168.1.42:3000`).
3. Dans le menu du navigateur mobile, choisis **"Ajouter à l'écran d'accueil"** (Chrome/Safari) pour l'installer comme une vraie application.

## 5. Où sont stockées tes données

- Base de données : `data/isoterra.db` (créée par `node db/seed.js`). Elle n'est pas envoyée sur GitHub (fichier local uniquement) — **pense à la sauvegarder toi-même de temps en temps** (copier le fichier ailleurs) si tu veux éviter de tout perdre.
- Photos ajoutées dans le journal : `public/uploads/`.
- Relancer `node db/seed.js` **efface et recrée** la base avec les données d'exemple — ne le refais pas une fois que tu as commencé à rentrer tes vraies données, sauf si tu veux repartir de zéro.

## 6. Fonctionnement général

Un résumé complet des fonctionnalités (Bacs, Fiches, Espèces, compatibilité entre espèces, Journal, Pontes, Vente, Mode Tournée) a été donné dans la conversation avec Claude — n'hésite pas à redemander cette explication si besoin.

## 7. Et le Raspberry Pi ?

Le passage sur Raspberry Pi + accès à distance via Tailscale n'est pas encore fait : ce sera la prochaine étape une fois le matériel reçu.
