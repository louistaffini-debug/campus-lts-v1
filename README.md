# Campus LTS V1

Application pédagogique reliée à Grist avec création de quiz et suivi apprenant.

## Installation

1. Installer Node.js 22+, puis lancer `npm ci`.
2. Copier `.env.example` vers `.env.local` et renseigner Grist. Sans ces valeurs, l'application reste en démonstration.
3. Lancer `npm run dev` et ouvrir l'adresse affichée.

## Sécurité et déploiement

La clé Grist reste côté serveur : ne jamais la préfixer par `NEXT_PUBLIC_` ni la commiter. Les routes d'écriture exigent un utilisateur ChatGPT authentifié sur OpenAI Sites. Configurer les trois variables Grist dans l'environnement du Site avant publication.

Voir `docs/GRIST.md` et `docs/TESTS.md`.
