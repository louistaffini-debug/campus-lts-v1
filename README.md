# Campus LTS — LMS maison

Site pédagogique publié sur GitHub Pages (`site/`), API Google Apps Script (`apps-script/CampusV1.gs` et `apps-script/CampusLms.gs`) et données Grist. La clé Grist et le code enseignant restent exclusivement dans les propriétés du script Google ; ils ne sont jamais inclus dans le site public.

## Fonctions disponibles

- Cinq parcours extensibles : CPI, CPRP, BIP, ETSO et WorldSkills. Une même ressource, séance ou activité peut servir dans plusieurs parcours.
- Espace enseignant : organisation parcours → modules → séquences → séances, activités, ressources PDF/vidéo/liens, quiz, groupes et comptes apprenants pseudonymes, prérequis, correction des travaux, compétences et suivi.
- Espace apprenant individuel : activation du compte, parcours et séances, lecture des ressources, quiz, progression personnelle et remise d'un travail par lien HTTPS.
- Les tables de liaison Grist restent derrière l'interface. Les requêtes de l'espace apprenant sont filtrées côté serveur par inscription.

## Démarrage et vérification

`node scripts/serve-campus.mjs` sert l'aperçu local. `node scripts/test-campus.mjs` vérifie les flux métier et les contrôles d'accès. Le guide [Installation du LMS](docs/INSTALLATION-LMS.md) détaille l'installation réelle et la recette.

Le dossier `app/` est l'historique d'une première maquette et n'est pas la cible de publication. La cible est `site/`.

## Périmètre de cette version

La remise de travaux utilise un lien HTTPS vers un fichier hébergé ailleurs ; le site ne stocke pas de fichier binaire. Le code enseignant est encore partagé, et les comptes apprenants sont pseudonymes. Avant d'accueillir de vrais élèves, faire valider l'hébergement des travaux, les accès, les durées de conservation et l'information des personnes par l'établissement et son DPD. Ce LMS n'est pas une copie intégrale de Moodle/Éléa.
