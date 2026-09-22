# Résultats de recette — 22 septembre 2026

- Tests locaux du serveur : réussis (authentification, correction serveur, références, idempotence, deux tentatives, plafond, progression, compétence).
- Tests GitHub Actions du commit `ac02298d461557eef167914a6e17215540ed07fe` : réussis. La publication est volontairement ignorée tant que le dépôt est privé.
- Google Apps Script : version de déploiement 2, API `1.1.0`, accès conservé à « Moi uniquement ».
- `verifierCampus` : connexion Grist réussie ; lecture sans code refusée. La faute de formule `return NoneE` a été corrigée en `return None`.
- `testerChaineCampus` dans Grist DEV : inscription fictive, quiz de recette, tentatives à 50 % et 100 %, résultat retenu 100 %, progression 100 %, compétence validée. Les données de recette restent identifiables par le préfixe RECETTE et les identifiants CAMPUS_RECETTE.
- Aperçu navigateur : listes pédagogiques liées, édition des questions, publication simulée explicitement sans écriture, affichage du suivi fictif contrôlés ; absence d'erreurs JavaScript dans la console pendant le contrôle.

Restent à vérifier après autorisation de publication : accès public GitHub Pages, appel POST du navigateur vers Apps Script, connexion avec le code enseignant et parcours complet depuis le site déployé. Le test serveur réel ne remplace pas ce dernier test de bout en bout du navigateur.
