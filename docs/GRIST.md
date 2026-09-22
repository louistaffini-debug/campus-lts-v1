# Modèle Grist et flux métier

Tables attendues : `PARCOURS`, `MODULES`, `SEQUENCES`, `SEANCES`, `ACTIVITES`, `EVALUATIONS`, `QUIZ`, `QUESTIONS`, `QUIZ_QUESTIONS`, `TENTATIVES`, `REPONSES`, `RESULTATS`, `PROGRESSION`, `COMPETENCES`, `EVALUATIONS_COMPETENCES`, `VALIDATIONS_COMPETENCES`, `UTILISATEURS`, `GROUPES`.

Parcours initiaux : CPI, CPRP, BIP, ETSO et WorldSkills. Les tables de liaison restent internes à l'API.

Publication : évaluation, quiz, questions et liaisons. Soumission : tentative et réponses, calcul du résultat retenu, progression et validation de compétence. Chaque opération multi-tables doit porter un identifiant d'idempotence afin d'éviter les doublons lors d'une reprise.

La clé reste exclusivement dans `GRIST_API_KEY`. Adapter au besoin les noms de colonnes dans `lib/grist.ts`.
