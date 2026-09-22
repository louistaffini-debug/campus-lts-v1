# Campus LTS 1.2 — Parcours et contenus

Après connexion enseignant, ouvrir **Mes parcours**, puis une séance.
La navigation suit les relations Grist existantes : parcours, modules,
séquences, séances, activités. Les liaisons restent invisibles.

**Ajouter une activité** permet d’enregistrer un cours, un exercice, des
consignes de travail à rendre ou un TP, avec durée et lien HTTPS facultatif.
Le contenu est du texte simple (aucun HTML exécuté). Les activités sont
immédiatement visibles aux enseignants ayant accès au même document.
Cette version ne propose pas encore la modification ou la suppression.

Déployer `apps-script/CampusV1.gs` comme nouvelle version du déploiement
existant avant de publier le dossier `site`. Garder les propriétés secrètes
dans Apps Script, jamais dans GitHub. La fonction `verifierParcours`
contrôle les lectures nécessaires sans créer de données.

## Recette

1. Exécuter `node scripts/test-campus.mjs`.
2. Se connecter, ouvrir Mes parcours et une séance existante.
3. Ajouter un cours identifiable comme test avec une ressource HTTPS.
4. Revenir aux parcours, rouvrir la séance : vérifier contenu et lien.
5. Vérifier que les quiz et le suivi restent accessibles.
6. En aperçu, vérifier qu’aucune activité n’est écrite dans Grist.

## Limites explicites

Il s’agit d’un espace enseignant, pas encore d’un portail élève.
Les comptes individuels, inscriptions sécurisées, dépôt privé des fichiers,
corrections, retours et progression hors quiz restent à réaliser.
« Travail à rendre » contient uniquement les consignes : aucun dépôt simulé.
Le modèle accepte tous les parcours présents dans Grist ; il ne crée pas
automatiquement CPI, CPRP, BIP, ETSO et WorldSkills ni leurs contenus.

## Lecteur de ressources — version 1.3

Les PDF, images, vidéos MP4/WebM, vidéos YouTube ou Vimeo et fichiers Google
Drive compatibles sont affichés directement dans la séance. Chaque ressource
conserve un bouton d’ouverture externe. Le format peut être choisi lors de la
création ou détecté automatiquement à partir de l’adresse HTTPS.

Un hébergeur peut interdire l’intégration dans une autre page. Dans ce cas, le
bouton d’ouverture externe reste disponible. Les droits Google Drive restent
ceux du fichier source : Campus LTS ne rend jamais un document privé public.
