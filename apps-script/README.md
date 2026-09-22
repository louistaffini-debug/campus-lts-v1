# API Campus LTS

Installer `CampusV1.gs` **et** `CampusLms.gs` dans le même projet Google Apps Script, ou concaténer les deux fichiers dans `Code.gs`. Ne pas installer l'ancien `Code.gs` du dépôt en plus : il définit les mêmes fonctions historiques.

Propriétés du script : `GRIST_BASE_URL` (pour Grist Numérique : `https://grist.numerique.gouv.fr/api`), `GRIST_DOC_ID`, `GRIST_API_KEY`, `WRITE_PIN`. Ne jamais mettre ces valeurs dans GitHub Pages. `LTS_PASSWORD_PEPPER` est créée par `installerLms()` et doit être conservée lors des mises à jour.

Exécuter une fois `installerLms()` en tant que propriétaire du script : cela crée trois tables LMS dans Grist et le socle des cinq parcours avec une séance d'accueil partagée. L'exécution est idempotente. Mettre ensuite à jour le déploiement Web existant avec une nouvelle version. Voir [Installation du LMS](../docs/INSTALLATION-LMS.md).
