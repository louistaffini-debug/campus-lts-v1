# Installation et recette — Campus LTS 2.0

## Architecture

GitHub Pages affiche le site statique de `site/`. Il contacte l'application Web Apps Script. Le script lit/écrit Grist avec une clé conservée dans ses propriétés. Le navigateur ne connaît jamais cette clé. Les tables de liaison et les tables `LTS_*` sont internes.

## Mise à jour d'une installation existante

1. Sauvegarder le document Grist et le projet Apps Script. Conserver les propriétés `GRIST_BASE_URL`, `GRIST_DOC_ID`, `GRIST_API_KEY` et `WRITE_PIN` ; ne pas les copier dans le dépôt.
2. Dans le projet Apps Script, remplacer le code de l'API par `CampusV1.gs` suivi de `CampusLms.gs`, ou créer ces deux fichiers dans le même projet. L'ancien `Code.gs` historique ne doit pas être installé en parallèle.
3. En tant que propriétaire, exécuter `installerLms()`. Vérifier dans le journal « 3 tables, 5 parcours et une séance d'accueil ». La fonction peut être relancée après une interruption.
4. Mettre à jour **le déploiement Web existant**, en créant une nouvelle version. Conserver la même URL `/exec`, l'exécution en tant que propriétaire et les paramètres d'accès déjà choisis. Vérifier le JSON de santé : `ok: true`, `version: 2.0.0`. La disponibilité réelle de Grist est vérifiée par l'installation et les lectures authentifiées.
5. Publier le dossier `site/` par le workflow GitHub Pages. Attendre la réussite du workflow avant de vérifier l'URL publique.

## Utilisation

Dans « Connexion », saisir le code enseignant existant. Dans « Organiser le campus », sélectionner un parcours puis créer/associer des modules, séquences et séances ; y placer activités, ressources et quiz. Créer un groupe, puis un compte apprenant. L'identifiant et le code d'activation n'apparaissent qu'à cette création : les transmettre individuellement. Un nouveau code peut être produit par « Réinitialiser ». L'apprenant définit un mot de passe d'au moins 12 caractères puis ouvre son propre espace.

Les travaux sont remis via **un lien HTTPS**. Vérifier que le service externe autorise la consultation par l'enseignant sans rendre le fichier public. Aucun fichier n'est chargé dans Campus LTS. La correction et le commentaire sont visibles par l'apprenant ; le suivi est mis à jour. Les quiz continuent à calculer leurs résultats et validations de compétences.

## Recette minimale

1. Lancer `node scripts/test-campus.mjs` : tous les tests doivent afficher `OK`.
2. Vérifier les cinq parcours et la séance d'accueil mutualisée dans Grist et dans l'interface.
3. Créer un groupe fictif, un compte pseudonyme et l'activer depuis un autre navigateur. Vérifier qu'un apprenant ne voit que ses inscriptions et ne peut pas utiliser l'identifiant d'inscription d'un autre.
4. Ajouter une séance et une ressource PDF ou vidéo HTTPS ; vérifier la lecture intégrée et l'ouverture externe.
5. Créer un travail à rendre, le remettre par lien, le corriger et vérifier le commentaire et la progression côté apprenant.
6. Créer un quiz court, faire deux tentatives, vérifier le résultat retenu, la progression et la validation de compétence.
7. Tester sur téléphone et ordinateur, ainsi que les cas d'erreur (mauvais mot de passe, séance hors parcours, prérequis non atteint, lien non HTTPS).

## Sécurité et mise en production pédagogique

Le code enseignant est partagé : il convient à un pilote mais pas à une gestion fine des droits par enseignant. Les sessions apprenants expirent après six heures ; les codes d'activation après quatorze jours. Les mots de passe sont salés et dérivés côté serveur avec un secret non publié. Ne pas saisir de noms d'élèves dans cette version sans validation institutionnelle. Prévoir une revue DPD/RGPD, politique de conservation, procédure de suppression/export et choix d'un stockage de travaux approuvé avant usage réel en établissement. Les liens de remise externes nécessitent une politique de partage adaptée. Aucun module de visioconférence, carnet de notes institutionnel ou dépôt binaire natif n'est fourni.

