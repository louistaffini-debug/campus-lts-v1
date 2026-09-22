// Remplace entièrement Code.gs. Ne pas installer les deux fichiers ensemble.
// Contrôle propriétaire uniquement, jamais exposé par doPost.
function verifierCampus(){
  var columns=req_('/tables/RESULTATS/columns').columns;
  var column=columns.find(function(c){return c.id==='TENTATIVE_RETENUE';});
  if(column&&/return NoneE\s*$/.test(column.fields.formula))req_('/tables/RESULTATS/columns','patch',{columns:[{id:'TENTATIVE_RETENUE',fields:{formula:column.fields.formula.replace(/return NoneE\s*$/,'return None')}}]});
  var c=catalog_();console.log('Connexion Grist OK : '+c.PARCOURS.length+' parcours, '+c.ACTIVITES.length+' activités.');
  console.log('Lecture sans code refusée : '+JSON.parse(doPost({postData:{contents:JSON.stringify({action:'tracking'})}}).getContent()).error);
}
function testerChaineCampus(){
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    var marker='CAMPUS_RECETTE_V110',ins=rows_('INSCRIPTIONS').find(function(r){return r.ID_INSCRIPTION===marker;});
    if(!ins){var b=batch_(),u=b.add('UTILISATEURS',{ID_UTILISATEUR:marker,NOM:'RECETTE CAMPUS',PRENOM:'Fictif',EMAIL:'',ROLE:'Apprenant',ACTIF:true}),g=b.add('GROUPES',{ID_GROUPE:marker,NOM:'RECETTE — groupe fictif',ANNEE_SCOLAIRE:'2026-2027',ACTIF:true});b.add('INSCRIPTIONS',{ID_INSCRIPTION:marker,UTILISATEUR:u,GROUPE:g,STATUT:'Actif',ACTIF:true});b.save();ins=rows_('INSCRIPTIONS').find(function(r){return r.ID_INSCRIPTION===marker;});}
    var a=rows_('ACTIVITES').filter(active_)[0],c=rows_('COMPETENCES').filter(active_)[0];if(!a||!c)throw Error('CATALOGUE_VIDE');
    var quiz=createQuiz_({requestId:'campus-recette-v110-quiz',quiz:{title:'RECETTE — quiz fictif Campus V1',activityId:a.id,competenceId:c.id,threshold:80,attempts:2,resultRule:'Meilleure tentative',published:true},questions:[{title:'Test : sélectionner A',points:1,answers:['A','B'],correct:0},{title:'Test : sélectionner C',points:1,answers:['C','D'],correct:0}]});
    var questions=quiz_(quiz.quizId).questions;
    var p={requestId:'campus-recette-v110-attempt1',quizId:quiz.quizId,inscriptionId:ins.id,answers:questions.map(function(q,i){return {questionId:q.id,optionId:q.options[i===0?1:0].id};})};
    var r1=submitAttempt_(p);p.requestId='campus-recette-v110-attempt2';p.answers=questions.map(function(q){return {questionId:q.id,optionId:q.options[0].id};});var r2=submitAttempt_(p);
    if(r1.score!==50||r2.score!==100)throw Error('RECETTE_SCORE_INCORRECT');
    var result=rows_('RESULTATS').find(function(r){return r.INSCRIPTION===ins.id&&r.EVALUATION===quiz.evaluationId;});
    if(!result||result.POURCENTAGE!==100||result.STATUT!=='Validé')throw Error('RECETTE_RESULTAT_INCORRECT');
    var progress=rows_('PROGRESSION').find(function(r){return r.INSCRIPTION===ins.id&&r.ACTIVITE===a.id;});
    var validated=rows_('VALIDATIONS_COMPETENCES').some(function(v){return v.UTILISATEUR===ins.UTILISATEUR&&v.COMPETENCE===c.id&&v.ACTIF;});
    if(!progress||progress.POURCENTAGE!==100||!validated)throw Error('RECETTE_PROGRESSION_INCORRECTE');
    console.log('RECETTE OK — apprenant fictif, deux tentatives 50 % / 100 %, résultat retenu 100 %, progression et compétence validées.');
  }finally{lock.releaseLock();}
}
var CAMPUS_VERSION='1.2.0';
function verifierParcours(){var data=learning_();console.log('Parcours OK : '+data.RESSOURCES.length+' ressources, '+catalog_().SEANCES_ACTIVITES.length+' liaisons de séance.');}
function doGet(){return json_({ok:true,service:'Campus LTS API',version:CAMPUS_VERSION});}
function doPost(e){try{
  var p=JSON.parse(e.postData.contents);auth_(p.pin);
  if(p.action==='catalog')return json_({ok:true,data:catalog_()});
  if(p.action==='learning')return json_({ok:true,data:learning_()});
  if(p.action==='tracking')return json_({ok:true,data:tracking_()});
  if(p.action==='quiz')return json_({ok:true,data:quiz_(Number(p.quizId))});
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    if(p.action==='createQuiz')return json_({ok:true,data:createQuiz_(p)});
    if(p.action==='createActivity')return json_({ok:true,data:createActivity_(p)});
    if(p.action==='submitAttempt')return json_({ok:true,data:submitAttempt_(p)});
    throw Error('ACTION_INCONNUE');
  }finally{lock.releaseLock();}
}catch(e){var s=String(e.message||e);return json_({ok:false,error:/^[A-Z0-9_]+$/.test(s)?s:'ERREUR_INTERNE'});}}
function json_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}
function auth_(pin){var key=PropertiesService.getScriptProperties().getProperty('WRITE_PIN'),cache=CacheService.getScriptCache(),n=Number(cache.get('failures')||0);
  if(n>=20)throw Error('PATIENTEZ_10_MINUTES');
  if(!key||typeof pin!=='string'||pin!==key){cache.put('failures',String(n+1),600);throw Error('ACCES_REFUSE');}}
function req_(path,method,data){var p=PropertiesService.getScriptProperties(),base=p.getProperty('GRIST_BASE_URL'),doc=p.getProperty('GRIST_DOC_ID'),key=p.getProperty('GRIST_API_KEY');
  if(!base||!doc||!key)throw Error('CONFIGURATION_MANQUANTE');
  var o={method:method||'get',headers:{Authorization:'Bearer '+key},muteHttpExceptions:true};
  if(data!==undefined){o.contentType='application/json';o.payload=JSON.stringify(data);}
  var r=UrlFetchApp.fetch(base.replace(/\/$/,'')+'/docs/'+encodeURIComponent(doc)+path,o);
  if(r.getResponseCode()<200||r.getResponseCode()>=300)throw Error('GRIST_HTTP_'+r.getResponseCode());
  return JSON.parse(r.getContentText()||'{}');}
function rows_(t){return req_('/tables/'+t+'/records').records.map(function(r){return Object.assign({id:r.id},r.fields);});}
function active_(r){return r.ACTIF!==false;}
function uid_(p){return p+'_'+Utilities.getUuid();}
function batch_(){var a=[],next={};return {a:a,add:function(t,f){if(!next[t])next[t]=rows_(t).reduce(function(n,r){return Math.max(n,r.id);},0)+1;var id=next[t]++;a.push(['AddRecord',t,id,f]);return id;},update:function(t,id,f){a.push(['UpdateRecord',t,id,f]);},save:function(){return req_('/apply','post',a);}};}
function one_(a,id){var r=a.find(function(x){return x.id===id;});if(!r)throw Error('REFERENCE_INVALIDE');return r;}
function int_(n,min,max){if(!Number.isInteger(n)||n<min||n>max)throw Error('VALEUR_INVALIDE');}
function txt_(s,max){if(typeof s!=='string'||!s.trim()||s.length>max)throw Error('TEXTE_INVALIDE');return s.trim();}
function token_(s){if(typeof s!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(s))throw Error('IDENTIFIANT_REQUIS');return 'CAMPUS_'+s;}
function catalog_(){var out={};['PARCOURS','MODULES','SEQUENCES','SEANCES','ACTIVITES','COMPETENCES','GROUPES','PARCOURS_MODULES','MODULES_SEQUENCES','SEQUENCES_SEANCES','SEANCES_ACTIVITES'].forEach(function(t){out[t]=rows_(t).filter(active_);});out.QUIZ=rows_('QUIZ');out.EVALUATIONS=rows_('EVALUATIONS');return out;}
function learning_(){var out={};['RESSOURCES','ACTIVITES_RESSOURCES','ACTIVITES_EVALUATIONS','ACTIVITES_COMPETENCES'].forEach(function(t){out[t]=rows_(t).filter(active_);});return out;}
function createActivity_(p){
  var key=token_(p.requestId),old=rows_('ACTIVITES').find(function(a){return a.ID_ACTIVITE===key;});if(old)return {activityId:old.id,replayed:true};
  var a=p.activity||{},session=one_(rows_('SEANCES'),Number(a.sessionId));if(!active_(session))throw Error('REFERENCE_INACTIVE');
  var title=txt_(a.title,200),content=txt_(a.content,30000);int_(a.minutes,1,600);
  if(['Cours','Exercice','Travail à rendre','TP'].indexOf(a.type)<0)throw Error('TYPE_ACTIVITE_INVALIDE');
  var resources=a.resources||[];if(!Array.isArray(resources)||resources.length>10)throw Error('RESSOURCES_INVALIDES');
  resources.forEach(function(r){txt_(r.title,200);if(typeof r.url!=='string'||r.url.length>2000||!/^https:\/\/[^\s/@]+[^\s]*$/i.test(r.url)||/[<>"']/.test(r.url))throw Error('URL_INVALIDE');});
  var links=rows_('SEANCES_ACTIVITES').filter(function(l){return l.SEANCE===session.id;});
  var b=batch_(),id=b.add('ACTIVITES',{ID_ACTIVITE:key,TITRE:title,DESCRIPTION:content,TYPE:a.type,DUREE_PREVUE:a.minutes,MODALITE:'Individuel',ACTIF:true});
  b.add('SEANCES_ACTIVITES',{ID_LIAISON:uid_('SA'),SEANCE:session.id,ACTIVITE:id,ORDRE:links.reduce(function(n,l){return Math.max(n,Number(l.ORDRE)||0);},0)+1,OBLIGATOIRE:true,ACTIF:true});
  resources.forEach(function(r,i){var resource=b.add('RESSOURCES',{ID_RESSOURCE:uid_('R'),TITRE:r.title.trim(),TYPE:'Lien',URL:r.url.trim(),ACTIF:true});b.add('ACTIVITES_RESSOURCES',{ID_LIAISON:uid_('AR'),ACTIVITE:id,RESSOURCE:resource,ORDRE:i+1,OBLIGATOIRE:false,ACTIF:true});});
  b.save();return {activityId:id,sessionId:session.id};
}
function tracking_(){return {users:rows_('UTILISATEURS').filter(active_).map(function(u){return {id:u.id,name:u.NOM_COMPLET||u.NOM+' '+u.PRENOM};}),inscriptions:rows_('INSCRIPTIONS').filter(active_),groups:rows_('GROUPES').filter(active_),results:rows_('RESULTATS').filter(active_),attempts:rows_('TENTATIVES').filter(active_),progress:rows_('PROGRESSION'),validations:rows_('VALIDATIONS_COMPETENCES').filter(active_),evaluations:rows_('EVALUATIONS'),quizzes:rows_('QUIZ')};}
function quiz_(id){var q=one_(rows_('QUIZ'),id),ev=one_(rows_('EVALUATIONS'),q.EVALUATION),qs=rows_('QUESTIONS'),os=rows_('OPTIONS_QUESTION');
  return {id:id,evaluation:ev,questions:rows_('QUIZ_QUESTIONS').filter(function(l){return l.QUIZ===id&&active_(l);}).sort(function(a,b){return a.ORDRE-b.ORDRE;}).map(function(l){var x=one_(qs,l.QUESTION);return {id:x.id,title:x.ENONCE,points:l.POINTS,options:os.filter(function(o){return o.QUESTION===x.id&&active_(o);}).sort(function(a,b){return a.ORDRE-b.ORDRE;}).map(function(o){return {id:o.id,title:o.TEXTE_OPTION};})};})};}
function createQuiz_(p){var key=token_(p.requestId),old=rows_('EVALUATIONS').find(function(r){return r.ID_EVALUATION===key;});
  if(old){var oldQ=rows_('QUIZ').find(function(r){return r.EVALUATION===old.id;});return {evaluationId:old.id,quizId:oldQ&&oldQ.id,replayed:true};}
  var q=p.quiz||{},qs=p.questions,title=txt_(q.title,200),activity=one_(rows_('ACTIVITES'),Number(q.activityId)),competence=one_(rows_('COMPETENCES'),Number(q.competenceId));
  if(!active_(activity)||!active_(competence))throw Error('REFERENCE_INACTIVE');
  int_(q.threshold,0,100);int_(q.attempts,1,20);
  if(['Meilleure tentative','Dernière tentative','Première tentative'].indexOf(q.resultRule)<0)throw Error('REGLE_INVALIDE');
  if(!Array.isArray(qs)||!qs.length||qs.length>50)throw Error('QUESTIONS_INVALIDES');var total=0;
  qs.forEach(function(x){txt_(x.title,4000);int_(x.points,1,100);total+=x.points;if(!Array.isArray(x.answers)||x.answers.length<2||x.answers.length>8)throw Error('OPTIONS_INVALIDES');x.answers.forEach(function(a){txt_(a,1000);});int_(x.correct,0,x.answers.length-1);});
  var b=batch_(),ev=b.add('EVALUATIONS',{ID_EVALUATION:key,TITRE:title,CONSIGNES:String(q.instructions||'').slice(0,4000),TYPE_EVALUATION:'Quiz',MODE_CORRECTION:'Automatique',BAREME_MAX:total,SEUIL_REUSSITE:q.threshold,NB_TENTATIVES_MAX:q.attempts,REGLE_RESULTAT:q.resultRule,ACTIF:q.published===true});
  var quiz=b.add('QUIZ',{ID_QUIZ:key,EVALUATION:ev,NB_QUESTIONS_TIREES:qs.length,MELANGER_QUESTIONS:false,MELANGER_OPTIONS:false,FEEDBACK_IMMEDIAT:false,AFFICHER_CORRECTION_FIN:true,ACTIF:q.published===true});
  b.add('ACTIVITES_EVALUATIONS',{ID_LIAISON:uid_('AE'),ACTIVITE:activity.id,EVALUATION:ev,ORDRE:1,OBLIGATOIRE:true,ACTIF:true});
  b.add('EVALUATIONS_COMPETENCES',{ID_LIAISON:uid_('EC'),EVALUATION:ev,COMPETENCE:competence.id,SEUIL_VALIDATION:q.threshold,COEFFICIENT:1,VALIDATION_AUTOMATIQUE:true,ACTIF:true});
  qs.forEach(function(x,i){var question=b.add('QUESTIONS',{ID_QUESTION:uid_('Q'),CODE:'Q'+(i+1),ENONCE:x.title.trim(),TYPE_QUESTION:'QCU',ACTIF:true});b.add('QUIZ_QUESTIONS',{ID_LIAISON:uid_('QQ'),QUIZ:quiz,QUESTION:question,ORDRE:i+1,POINTS:x.points,OBLIGATOIRE:true,ACTIF:true});x.answers.forEach(function(a,j){b.add('OPTIONS_QUESTION',{ID_OPTION:uid_('O'),QUESTION:question,TEXTE_OPTION:a.trim(),ORDRE:j+1,EST_CORRECTE:j===x.correct,ACTIF:true});});});
  var r=b.save();return {evaluationId:r.retValues[0],quizId:r.retValues[1],published:q.published===true};}
function submitAttempt_(p){var key=token_(p.requestId),all=rows_('TENTATIVES'),old=all.find(function(t){return t.ID_TENTATIVE===key;});if(old)return {attemptId:old.id,score:old.POURCENTAGE,replayed:true};
  var ins=one_(rows_('INSCRIPTIONS'),Number(p.inscriptionId)),q=one_(rows_('QUIZ'),Number(p.quizId)),ev=one_(rows_('EVALUATIONS'),q.EVALUATION);
  if(!active_(ins)||!active_(q)||!active_(ev))throw Error('QUIZ_OU_INSCRIPTION_INACTIF');
  var prior=all.filter(function(t){return t.QUIZ===q.id&&t.INSCRIPTION===ins.id&&active_(t);});if(prior.length>=ev.NB_TENTATIVES_MAX)throw Error('TENTATIVES_EPUISEES');
  var links=rows_('QUIZ_QUESTIONS').filter(function(l){return l.QUIZ===q.id&&active_(l);}),opts=rows_('OPTIONS_QUESTION').filter(active_),answers=p.answers;
  if(!Array.isArray(answers)||answers.length!==links.length||!links.length)throw Error('REPONSES_INCOMPLETES');var seen={},score=0,max=0,marks=[];
  answers.forEach(function(a){if(seen[a.questionId])throw Error('REPONSE_DUPLIQUEE');seen[a.questionId]=true;var l=links.find(function(x){return x.QUESTION===a.questionId;});if(!l)throw Error('QUESTION_INVALIDE');
    var o=opts.find(function(x){return x.id===a.optionId&&x.QUESTION===a.questionId;});if(!o)throw Error('OPTION_INVALIDE');
    if(opts.filter(function(x){return x.QUESTION===a.questionId&&x.EST_CORRECTE;}).length!==1)throw Error('TYPE_QUESTION_NON_PRIS_EN_CHARGE');
    var points=o.EST_CORRECTE?l.POINTS:0;score+=points;max+=l.POINTS;marks.push({question:a.questionId,option:o.id,correct:o.EST_CORRECTE,points:points});});
  var percent=Math.round(score/max*10000)/100,retained=percent,previous=prior.filter(function(t){return t.STATUT==='Corrigée';});
  if(ev.REGLE_RESULTAT==='Meilleure tentative')previous.forEach(function(t){retained=Math.max(retained,Number(t.POURCENTAGE)||0);});
  else if(ev.REGLE_RESULTAT==='Première tentative'){if(previous.length)retained=previous.sort(function(a,b){return a.NUMERO_TENTATIVE-b.NUMERO_TENTATIVE;})[0].POURCENTAGE;}
  else if(ev.REGLE_RESULTAT!=='Dernière tentative')throw Error('REGLE_INVALIDE');
  var now=Date.now()/1000,b=batch_(),attempt=b.add('TENTATIVES',{ID_TENTATIVE:key,INSCRIPTION:ins.id,QUIZ:q.id,NUMERO_TENTATIVE:prior.length+1,DATE_DEBUT:now,DATE_FIN:now,STATUT:'Corrigée',ACTIF:true});
  marks.forEach(function(m){b.add('REPONSES',{ID_REPONSE:uid_('R'),TENTATIVE:attempt,QUESTION:m.question,OPTIONS_SELECTIONNEES:['L',m.option],EST_CORRECTE:m.correct,POINTS_OBTENUS:m.points,DATE_REPONSE:now});});
  var result=rows_('RESULTATS').find(function(r){return r.INSCRIPTION===ins.id&&r.EVALUATION===ev.id;});
  if(result)b.update('RESULTATS',result.id,{DATE_RESULTAT:now,ACTIF:true});else b.add('RESULTATS',{ID_RESULTAT:uid_('RES'),INSCRIPTION:ins.id,EVALUATION:ev.id,DATE_RESULTAT:now,ACTIF:true});
  var acts=rows_('ACTIVITES_EVALUATIONS').filter(function(l){return l.EVALUATION===ev.id&&active_(l);}),progress=rows_('PROGRESSION');
  acts.forEach(function(l){var r=progress.find(function(x){return x.INSCRIPTION===ins.id&&x.ACTIVITE===l.ACTIVITE;}),f={STATUT:retained>=ev.SEUIL_REUSSITE?'Terminée':'En cours',POURCENTAGE:retained,DERNIERE_MAJ:now,DATE_FIN:retained>=ev.SEUIL_REUSSITE?now:null};if(r)b.update('PROGRESSION',r.id,f);else b.add('PROGRESSION',Object.assign(f,{ID_PROGRESSION:uid_('P'),INSCRIPTION:ins.id,ACTIVITE:l.ACTIVITE,DATE_DEBUT:now}));});
  var validations=rows_('VALIDATIONS_COMPETENCES');rows_('EVALUATIONS_COMPETENCES').filter(function(l){return l.EVALUATION===ev.id&&active_(l)&&l.VALIDATION_AUTOMATIQUE;}).forEach(function(l){var marker='Campus LTS / évaluation '+ev.id+' / inscription '+ins.id,r=validations.find(function(v){return v.UTILISATEUR===ins.UTILISATEUR&&v.COMPETENCE===l.COMPETENCE&&v.COMMENTAIRE===marker;}),valid=retained>=Number(l.SEUIL_VALIDATION),f={ACTIF:valid,DATE_VALIDATION:Math.floor(now/86400)*86400,NIVEAU:l.NIVEAU_VALIDE||'Validé'};if(r)b.update('VALIDATIONS_COMPETENCES',r.id,f);else if(valid)b.add('VALIDATIONS_COMPETENCES',Object.assign(f,{ID_VALIDATION:uid_('V'),UTILISATEUR:ins.UTILISATEUR,COMPETENCE:l.COMPETENCE,SOURCE:'Évaluation',ACTIVITE:acts.length?acts[0].ACTIVITE:0,COMMENTAIRE:marker}));});
  var saved=b.save();return {attemptId:saved.retValues[0],score:percent,retained:retained,passed:retained>=ev.SEUIL_REUSSITE};}
