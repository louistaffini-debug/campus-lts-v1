# Campus LTS V1

## Version actuelle : GitHub Pages + Google Apps Script + Grist

L'application à publier est dans **`site/`** (HTML/CSS/JavaScript sans dépendances). Le serveur correspondant est **`apps-script/CampusV1.gs`**, à installer comme unique contenu de Code.gs dans Google Apps Script.

Lancer `node scripts/serve-campus.mjs` pour l'aperçu et `node scripts/test-campus.mjs` pour les tests. Lire **[le guide complet](docs/DEPLOIEMENT-V1.md)** pour l'installation, les propriétés secrètes, la publication et la recette.

Le dossier `app/` ci-dessous et les anciennes instructions OpenAI Sites sont l'historique de la première maquette, pas la cible de publication actuelle.

Application pédagogique reliée à Grist avec création de quiz et suivi apprenant.

## Installation

1. Installer Node.js 22+, puis lancer `npm ci`.
2. Copier `.env.example` vers `.env.local` et renseigner Grist. Sans ces valeurs, l'application reste en démonstration.
3. Lancer `npm run dev` et ouvrir l'adresse affichée.

## Sécurité et déploiement

La clé Grist reste côté serveur : ne jamais la préfixer par `NEXT_PUBLIC_` ni la commiter. Les routes d'écriture exigent un utilisateur ChatGPT authentifié sur OpenAI Sites. Configurer les trois variables Grist dans l'environnement du Site avant publication.

Voir `docs/GRIST.md` et `docs/TESTS.md`.
