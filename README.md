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

### Windows : lancement en un double-clic

Le fichier **`Demarrer-Isoterra.bat`** à la racine du projet fait tout automatiquement : installation des dépendances au premier lancement, création de la base si besoin, démarrage du serveur, et ouverture du navigateur sur `http://localhost:3000`. Double-clique dessus à chaque fois que tu veux lancer l'appli — Node.js doit juste être installé au préalable (étape ci-dessus). Une fenêtre "Isoterra - serveur" s'ouvre : c'est le serveur qui tourne, ne la ferme pas tant que tu utilises l'appli.

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

## 4. Utiliser l'appli depuis ton téléphone ou ton PC

Au quotidien, l'appli tourne sur le **Raspberry Pi** (voir section 7), allumé en permanence. Le lancement sur le PC (sections 2 et 3) ne sert plus qu'au développement, avec une copie des données.

### Via Tailscale (recommandé : HTTPS, marche même hors de la maison)

Le Pi, le PC et le téléphone sont sur le même tailnet Tailscale.

1. Sur le téléphone, ouvre **l'application Chrome** et colle cette adresse dans la barre d'adresse :
   ```
   https://isoterra.tail97d968.ts.net/
   ```
   > Ne clique pas sur le lien depuis une autre appli (messagerie, Claude...) : il s'ouvrirait dans un navigateur intégré à cette appli (barre avec une croix ✕ en haut à gauche), qui **ne propose ni l'installation ni le plein écran**.
2. Dans le menu de Chrome (les trois points), choisis **"Installer l'application"** (ou "Ajouter à l'écran d'accueil") : icône, plein écran sans barre d'adresse, et un appui long sur l'icône propose "Commencer la tournée" et "Nouvelle entrée de journal".

Ça fonctionne aussi bien sur le Wi-Fi de la maison qu'à l'extérieur, tant que le téléphone a Tailscale actif.

### Via le Wi-Fi de la maison (sans Tailscale)

En dépannage, le Pi répond aussi en HTTP simple sur le réseau local, à l'adresse que lui donne la box (`http://<ip-du-pi>:3000`), mais sans installation complète de l'appli.

## 5. Où sont stockées tes données

- Base de données : `data/isoterra.db` (créée par `node db/seed.js`). Elle n'est pas envoyée sur GitHub (fichier local uniquement) — **pense à la sauvegarder toi-même de temps en temps** (copier le fichier ailleurs) si tu veux éviter de tout perdre.
- Photos ajoutées dans le journal : `public/uploads/`.
- `node db/seed.js` sert seulement à remplir une base **neuve** : relancé sur une base en service, il **ajouterait en double** les espèces et les exemples. Ne le relance jamais une fois tes vraies données rentrées.

## 6. Fonctionnement général

Un résumé complet des fonctionnalités (Bacs, Fiches, Espèces, compatibilité entre espèces, Journal, Pontes, Vente, Mode Tournée) a été donné dans la conversation avec Claude — n'hésite pas à redemander cette explication si besoin.

## 7. Sur le Raspberry Pi (en permanence)

Le Raspberry Pi fait tourner Isoterra en continu, sans dépendre du PC :

- **L'appli** est un service système (`isoterra`) : elle démarre avec le Pi et redémarre toute seule si elle s'arrête.
- **Mises à jour automatiques** : toutes les 5 minutes, le Pi regarde s'il y a un nouveau commit sur la branche `main` de GitHub. Si oui, il le récupère, réinstalle les dépendances si elles ont changé et relance l'appli. Si la nouvelle version ne répond pas, il revient tout seul à la précédente (et ne retente pas cette version-là).
- **Sauvegarde de la base** chaque nuit à 3 h 30 dans `~/isoterra-sauvegardes` (les 30 dernières sont gardées).
- **Contrôle chaque minute** (`deploy/healthcheck.sh`) : si la box est injoignable, le Wi-Fi et le réseau sont relancés ; si l'appli ne répond plus, elle est relancée ; si Tailscale est déconnecté, il est relancé. Si la panne dure 10 minutes, le Pi redémarre (une seule fois par incident, pour ne pas redémarrer en boucle si c'est la box qui est éteinte).
- **Chien de garde matériel** : si le système se fige, le Pi redémarre tout seul en moins de 15 secondes ; après une erreur grave du noyau, en 10 secondes.
- **Wi-Fi sans économie d'énergie** (cause fréquente de décrochages sur les Pi), qui se reconnecte sans fin quand la box redémarre.
- **Mises à jour de sécurité automatiques** du système et de Tailscale.
- **Alimentation** : le Pi 3B a besoin d'une alimentation 5,1 V / 2,5 A (l'officielle de préférence) et d'un câble court. En cas de manque de courant, `bash deploy/install-pi.sh` affiche un avertissement, et `vcgencmd get_throttled` doit répondre `throttled=0x0`.
- **Accès** depuis le téléphone ou le PC via Tailscale (`tailscale serve` sur le Pi).
- **Page Serveur** dans l'appli (icône en haut de l'accueil, `/serveur`) : température, alimentation, Wi-Fi, carte SD, version, sauvegardes et réparations automatiques, avec des boutons pour sauvegarder, télécharger la base, chercher une mise à jour, redémarrer l'appli ou le Pi, et éteindre le Pi avant de le débrancher. Elle ne s'ouvre que par l'adresse Tailscale.

La base (`data/isoterra.db`), les photos (`public/uploads/`) et les icônes d'origine (`data/icon-originals/`) restent sur le Pi : les mises à jour ne touchent qu'au code.

### Installation (une seule fois, Raspberry Pi OS 64 bits)

```
sudo apt install -y git
git clone -b main https://github.com/tuthurgamer/Isoterra-app.git ~/isoterra-app
cd ~/isoterra-app && bash deploy/install-pi.sh
sudo tailscale serve --bg 3000
```

### Commandes utiles (sur le Pi)

- État de l'appli : `systemctl status isoterra`
- Journal de l'appli en direct : `journalctl -u isoterra -f`
- Historique des mises à jour : `journalctl -u isoterra-update`
- Réparations faites par le contrôle automatique : `journalctl -u isoterra-health`
- Après une modification de `deploy/` (services, réglages du Pi) : relancer `bash deploy/install-pi.sh` (sans risque, on peut le relancer autant de fois que nécessaire)
- Forcer une vérification de mise à jour tout de suite : `sudo systemctl start isoterra-update`
- Liste des sauvegardes : `ls ~/isoterra-sauvegardes`
