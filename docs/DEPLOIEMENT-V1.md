# Campus LTS V1 — GitHub Pages + Google Apps Script + Grist

## Fichiers actifs

```
site/
  index.html      interface responsive
  styles.css     mise en page responsive
  atelier-theme.css  couleurs et conventions originales d'Atelier Stock Manager
  app.js         quiz, suivi, session encadrée et aperçu fictif
  config.js      URL publique de l'API, aucun secret
apps-script/
  CampusV1.gs    serveur à installer à la place de Code.gs
scripts/
  serve-campus.mjs   aperçu local sans installation de dépendances
  test-campus.mjs    tests du serveur avec Grist simulé
```

Les anciens fichiers `app/`, `lib/` et `apps-script/Code.gs` sont conservés pour référence. Ils ne sont pas utilisés par cette version statique. Ne pas déployer l'ancien serveur 1.0.0 en accès public.

## Installation locale

Installer Node.js 22 ou plus. Depuis le dossier du projet :

```
node scripts/test-campus.mjs
node scripts/serve-campus.mjs
```

Ouvrir http://localhost:5174. « Découvrir l'interface » utilise uniquement des données fictives et n'envoie aucune écriture.

## Google Apps Script

Remplacer tout le contenu de Code.gs par `apps-script/CampusV1.gs`. Ne pas conserver les deux scripts : ils définissent les mêmes fonctions.

Propriétés du script : `GRIST_BASE_URL` (https://grist.numerique.gouv.fr/api), `GRIST_DOC_ID`, `GRIST_API_KEY`, `WRITE_PIN`. Utiliser un code enseignant long et aléatoire. Aucun secret dans GitHub, les fichiers statiques ou les URL.

Exécuter `verifierCampus` depuis l'éditeur. Cette fonction contrôle la connexion, le refus sans code et corrige uniquement la faute connue `return NoneE` dans la formule RESULTATS.TENTATIVE_RETENUE, si elle existe encore.

Exécuter `testerChaineCampus` pour créer une inscription fictive et un quiz de recette clairement nommés RECETTE. Il vérifie deux tentatives (50 %, 100 %), le résultat retenu, la progression et la validation. Les enregistrements de recette sont conservés pour consultation. La fonction est idempotente.

Déployer une nouvelle version de l'application Web, exécutée par le propriétaire. Le déploiement privé initial ne permet pas un appel direct par le frontend GitHub Pages. Pour cet usage, l'accès au point d'entrée doit être autorisé aux visiteurs, sous réserve des règles du compte Google Workspace. Les opérations de données restent toutes protégées par le code enseignant dans le corps POST. Ne pas ouvrir l'ancien déploiement 1.0.0.

Reporter l'URL stable terminant par `/exec` dans `site/config.js`. Ne jamais utiliser l'URL temporaire `script.googleusercontent.com`.

## Publication GitHub Pages

Le dépôt actuel est privé. GitHub demande un abonnement compatible ou un dépôt public avant d'activer Pages. Un passage public rend aussi l'historique Git accessible : contrôler l'absence de secrets et de données personnelles avant cette décision.

Après activation de Pages avec GitHub Actions, le workflow `.github/workflows/campus-pages.yml` teste le code et publie uniquement `site/`. Les autres dossiers et données Grist ne sont pas servis comme fichiers du site.

## Utilisation

Se connecter avec le code enseignant ; il reste uniquement en mémoire, jusqu'à déconnexion ou rechargement. Créer un quiz, définir questions, options, points, seuil et règle de résultat, puis enregistrer un brouillon ou publier. Les choix multiples avec une seule bonne réponse sont pris en charge. Un brouillon est conservé inactif ; la V1 ne propose pas encore sa reprise et sa publication ultérieure.

Le menu Passer un quiz est une session encadrée : l'enseignant choisit l'inscription et supervise la passation. Ce n'est pas un portail autonome d'élèves avec comptes individuels. Ne pas distribuer le code enseignant aux élèves.

Le suivi permet filtrage par groupe, recherche, actualisation et export CSV. La moyenne porte sur les résultats affichés, pas sur tous les élèves du campus.

Les cinq parcours CPI, CPRP, BIP, ETSO et WorldSkills sont prévus dans le contexte d'interface. Le catalogue réel reste celui de Grist ; les parcours et leurs liaisons doivent être renseignés pour apparaître dans les listes pédagogiques.

## Garanties et limites

- Authentification sur toutes les lectures et écritures de données. GET retourne uniquement le nom et la version du service.
- Score, plafond des tentatives et validation calculés côté serveur ; aucune note fournie par le navigateur n'est acceptée.
- Écritures groupées via `/apply`, verrou Apps Script et identifiants de requête persistants pour éviter les doublons après interruption.
- Le verrou protège les écritures de cette API. Une modification directe simultanée de Grist peut provoquer un conflit d'identifiant ; l'opération doit échouer puis être relancée.
- Les formules de Grist restent la source des résultats affichés. Les colonnes calculées ne sont pas écrites par l'API.
- Limitation globale des codes erronés ; ce mécanisme simple n'est pas une authentification individuelle ni une protection complète contre le déni de service. Prévoir des comptes individuels avant un portail élève autonome.
- La lecture complète des tables convient au pilote ; pagination/filtrage côté serveur et cache seront nécessaires avec des volumes importants.

## Recette navigateur après déploiement

1. GET ne renvoie aucune donnée pédagogique ou apprenant.
2. Connexion erronée refusée ; connexion correcte charge le catalogue.
3. Créer un quiz de deux questions ; contrôler les lignes liées dans Grist.
4. Soumettre deux tentatives pour une inscription fictive, avec des réponses différentes.
5. Vérifier résultat retenu, progression et compétence ; la troisième tentative doit être refusée.
6. Vérifier recherche, filtre groupe, export, déconnexion et affichage mobile.
7. Rejouer la même requête : aucune ligne dupliquée.

Références : https://support.getgrist.com/api/ et https://developers.google.com/apps-script/guides/content.

