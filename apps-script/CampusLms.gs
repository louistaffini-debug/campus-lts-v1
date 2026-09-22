// Campus LTS 2.0 : fonctions LMS. Installer avec CampusV1.gs, sans le Code.gs historique.
// Les fonctions avec préfixe student n'acceptent jamais le code enseignant.
var LTS_PATHS=[['CPI','BTS Conception de Produits Industriels'],['CPRP','BTS Conception des Processus de Réalisation de Produits'],['BIP','Bachelor Intégration des Procédés'],['ETSO','Enseignement technologique des systèmes optiques'],['WorldSkills','WorldSkills Fabrication Additive']];
function installerLms(){
  var props=PropertiesService.getScriptProperties();
  if(!props.getProperty('LTS_PASSWORD_PEPPER'))props.setProperty('LTS_PASSWORD_PEPPER',Utilities.getUuid()+Utilities.getUuid());
  var spec={
    LTS_COMPTES:[['ID_COMPTE','Text'],['UTILISATEUR','Int'],['LOGIN','Text'],['SALT','Text'],['PASS_HASH','Text'],['ACTIVATION_HASH','Text'],['ACTIVATION_EXP','Numeric'],['ACTIF','Bool']],
    LTS_DEPOTS:[['ID_DEPOT','Text'],['INSCRIPTION','Int'],['ACTIVITE','Int'],['URL','Text'],['DATE_DEPOT','Numeric'],['STATUT','Text'],['COMMENTAIRE','Text'],['SCORE','Numeric']],
    LTS_PREREQUIS:[['ID_PREREQUIS','Text'],['ACTIVITE','Int'],['ACTIVITE_REQUISE','Int'],['SEUIL','Numeric'],['ACTIF','Bool']]
  };
  var existing=req_('/tables').tables.map(function(t){return t.id;});
  Object.keys(spec).forEach(function(name){if(existing.indexOf(name)<0)req_('/tables','post',{tables:[{id:name,columns:spec[name].map(function(c){return {id:c[0],fields:{type:c[1]}};})}]});});
  var paths=rows_('PARCOURS');
  LTS_PATHS.forEach(function(item){if(!paths.some(function(p){return p.CODE===item[0]||p.ID_PARCOURS===item[0];})){
    req_('/tables/PARCOURS/records','post',{records:[{fields:{ID_PARCOURS:item[0],CODE:item[0],TITRE:item[1],DESCRIPTION:'',ACTIF:true}}]});
  }});
  lmsEnsureIntro_();
  console.log('Campus LMS installé : 3 tables, 5 parcours et une séance d’accueil partagée. Aucun compte étudiant créé.');
}
function lmsEnsureIntro_(){
  var module=rows_('MODULES').find(function(x){return x.ID_MODULE==='LTS_INTRO_MODULE';});
  if(!module){var b=batch_(),m=b.add('MODULES',{ID_MODULE:'LTS_INTRO_MODULE',CODE:'LTS-INTRO',TITRE:'Découvrir Campus LTS',DESCRIPTION:'Prise en main de la plateforme',ACTIF:true}),s=b.add('SEQUENCES',{ID_SEQUENCE:'LTS_INTRO_SEQUENCE',CODE:'LTS-INTRO-01',TITRE:'Premiers pas',DESCRIPTION:'Votre espace de formation',OBJECTIFS:'Accéder aux séances, ressources et activités.',ACTIF:true}),se=b.add('SEANCES',{ID_SEANCE:'LTS_INTRO_SESSION',CODE:'LTS-INTRO-01',TITRE:'Bienvenue sur Campus LTS',DESCRIPTION:'Découvrez comment utiliser votre espace personnel.',ACTIF:true}),a=b.add('ACTIVITES',{ID_ACTIVITE:'LTS_INTRO_ACTIVITY',TITRE:'Prendre en main mon espace',DESCRIPTION:'Explorez votre parcours, ouvrez cette séance et marquez cette activité comme terminée. Vos cours et exercices apparaîtront ici au fur et à mesure de leur publication par l’enseignant.',TYPE:'Cours',DUREE_PREVUE:5,MODALITE:'Individuel',ACTIF:true});
    rows_('PARCOURS').filter(function(x){return LTS_PATHS.some(function(p){return p[0]===x.CODE||p[0]===x.ID_PARCOURS;});}).forEach(function(path){b.add('PARCOURS_MODULES',{ID_LIAISON:uid_('L'),PARCOURS:path.id,MODULE:m,ORDRE:1,OBLIGATOIRE:true,ACTIF:true});});
    b.add('MODULES_SEQUENCES',{ID_LIAISON:uid_('L'),ID_MODULE:m,ID_SEQUENCE:s,ORDRE:1,OBLIGATOIRE:true,ACTIF:true});b.add('SEQUENCES_SEANCES',{ID_LIAISON:uid_('L'),SEQUENCE:s,SEANCE:se,ORDRE:1,OBLIGATOIRE:true,ACTIF:true});b.add('SEANCES_ACTIVITES',{ID_LIAISON:uid_('L'),SEANCE:se,ACTIVITE:a,ORDRE:1,OBLIGATOIRE:true,ACTIF:true});b.save();return;}
  rows_('PARCOURS').filter(function(x){return LTS_PATHS.some(function(p){return p[0]===x.CODE||p[0]===x.ID_PARCOURS;});}).forEach(function(path){lmsLink_({parentTable:'PARCOURS',table:'MODULES',link:'PARCOURS_MODULES',parentCol:'PARCOURS',childCol:'MODULE'},path.id,module.id);});
}
function lmsLock_(fn){var lock=LockService.getScriptLock();lock.waitLock(30000);try{return fn();}finally{lock.releaseLock();}}
function lmsHex_(bytes){return bytes.map(function(b){return ('0'+(b&255).toString(16)).slice(-2);}).join('');}
function lmsHash_(value){return lmsHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value));}
function lmsSecret_(){var p=PropertiesService.getScriptProperties().getProperty('LTS_PASSWORD_PEPPER');if(!p)throw Error('LMS_NON_INSTALLE');return p;}
function lmsPassword_(password,salt){var x=lmsSecret_()+'|'+salt+'|'+password;for(var i=0;i<4000;i++)x=lmsHash_(x);return x;}
function lmsLoginName_(s){if(typeof s!=='string'||!/^[A-Z0-9_-]{5,40}$/.test(s.trim().toUpperCase()))throw Error('IDENTIFIANT_INVALIDE');return s.trim().toUpperCase();}
function lmsPasswordCheck_(s){if(typeof s!=='string'||s.length<12||s.length>128)throw Error('MOT_DE_PASSE_INVALIDE');return s;}
function lmsSame_(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;var n=0;for(var i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;}
function lmsSession_(p){
  if(typeof p.sessionToken!=='string'||!/^[a-f0-9-]{36}$/.test(p.sessionToken))throw Error('SESSION_EXPIREE');
  var cache=CacheService.getScriptCache(),raw=cache.get('lts_session_'+lmsHash_(p.sessionToken));if(!raw)throw Error('SESSION_EXPIREE');
  var session=JSON.parse(raw),account=rows_('LTS_COMPTES').find(function(a){return a.UTILISATEUR===session.userId&&a.ACTIF;});
  if(!account)throw Error('SESSION_EXPIREE');return session;
}
function lmsIssueSession_(account){var token=Utilities.getUuid().toLowerCase();CacheService.getScriptCache().put('lts_session_'+lmsHash_(token),JSON.stringify({userId:account.UTILISATEUR,login:account.LOGIN}),21600);return {sessionToken:token,expiresInSeconds:21600};}
function lmsStudent_(p){
  if(p.action==='studentActivate')return lmsLock_(function(){
    var login=lmsLoginName_(p.login),password=lmsPasswordCheck_(p.password),cache=CacheService.getScriptCache(),key='lts_activation_fail_'+lmsHash_(login),fail=Number(cache.get(key)||0);if(fail>=6)throw Error('PATIENTEZ_15_MINUTES');var account=rows_('LTS_COMPTES').find(function(a){return a.LOGIN===login;});
    if(!account||account.ACTIF||!account.ACTIVATION_HASH||Date.now()/1000>account.ACTIVATION_EXP)throw Error('ACTIVATION_INVALIDE');
    var code=txt_(p.activationCode,80).toUpperCase();if(!lmsSame_(account.ACTIVATION_HASH,lmsHash_(lmsSecret_()+'|'+code))){cache.put(key,String(fail+1),900);throw Error('ACTIVATION_INVALIDE');}
    var salt=Utilities.getUuid(),hash=lmsPassword_(password,salt),b=batch_();b.update('LTS_COMPTES',account.id,{SALT:salt,PASS_HASH:hash,ACTIVATION_HASH:'',ACTIVATION_EXP:0,ACTIF:true});b.save();account.ACTIF=true;return lmsIssueSession_(account);
  });
  if(p.action==='studentLogin'){
    var login=lmsLoginName_(p.login),cache=CacheService.getScriptCache(),key='lts_fail_'+lmsHash_(login),fail=Number(cache.get(key)||0);
    if(fail>=6)throw Error('PATIENTEZ_15_MINUTES');
    var account=rows_('LTS_COMPTES').find(function(a){return a.LOGIN===login&&a.ACTIF;});
    if(!account||typeof p.password!=='string'||!lmsSame_(account.PASS_HASH,lmsPassword_(p.password,account.SALT))){cache.put(key,String(fail+1),900);throw Error('IDENTIFIANTS_INCORRECTS');}
    cache.remove(key);return lmsIssueSession_(account);
  }
  var session=lmsSession_(p);
  if(p.action==='studentHome')return lmsHome_(session);
  if(p.action==='studentQuiz'){
    var ins=lmsInscription_(session,Number(p.inscriptionId)),quizId=Number(p.quizId);lmsQuizAccess_(ins,quizId);return quiz_(quizId);
  }
  if(p.action==='studentAttempt')return lmsLock_(function(){
    var ins=lmsInscription_(session,Number(p.inscriptionId));lmsQuizAccess_(ins,Number(p.quizId));
    return submitAttempt_({requestId:p.requestId,inscriptionId:ins.id,quizId:Number(p.quizId),answers:p.answers});
  });
  if(p.action==='studentComplete')return lmsLock_(function(){return lmsComplete_(session,p);});
  if(p.action==='studentSubmit')return lmsLock_(function(){return lmsSubmit_(session,p);});
  throw Error('ACTION_INCONNUE');
}
function lmsInscription_(session,id){var r=rows_('INSCRIPTIONS').find(function(x){return x.id===id&&x.UTILISATEUR===session.userId&&active_(x);});if(!r)throw Error('INSCRIPTION_REFUSEE');return r;}
function lmsActivityIds_(ins){
  var group=one_(rows_('GROUPES'),ins.GROUPE),paths=[group.PARCOURS],pm=rows_('PARCOURS_MODULES'),ms=rows_('MODULES_SEQUENCES'),ss=rows_('SEQUENCES_SEANCES'),sa=rows_('SEANCES_ACTIVITES');
  var modules=pm.filter(function(x){return paths.indexOf(x.PARCOURS)>=0&&active_(x);}).map(function(x){return x.MODULE;});
  var sequences=ms.filter(function(x){return modules.indexOf(x.ID_MODULE)>=0&&active_(x);}).map(function(x){return x.ID_SEQUENCE;});
  var sessions=ss.filter(function(x){return sequences.indexOf(x.SEQUENCE)>=0&&active_(x);}).map(function(x){return x.SEANCE;});
  return sa.filter(function(x){return sessions.indexOf(x.SEANCE)>=0&&active_(x);}).map(function(x){return x.ACTIVITE;});
}
function lmsAccess_(ins,activityId){if(lmsActivityIds_(ins).indexOf(activityId)<0||!active_(one_(rows_('ACTIVITES'),activityId)))throw Error('ACTIVITE_REFUSEE');
  var progress=rows_('PROGRESSION');rows_('LTS_PREREQUIS').filter(function(x){return x.ACTIVITE===activityId&&active_(x);}).forEach(function(x){var p=progress.find(function(r){return r.INSCRIPTION===ins.id&&r.ACTIVITE===x.ACTIVITE_REQUISE;});if(!p||Number(p.POURCENTAGE)<Number(x.SEUIL))throw Error('PREREQUIS_NON_ATTEINT');});}
function lmsQuizAccess_(ins,quizId){var q=one_(rows_('QUIZ'),quizId),ev=one_(rows_('EVALUATIONS'),q.EVALUATION);if(!active_(q)||!active_(ev))throw Error('QUIZ_INACTIF');
  var activity=rows_('ACTIVITES_EVALUATIONS').find(function(x){return x.EVALUATION===ev.id&&active_(x)&&lmsActivityIds_(ins).indexOf(x.ACTIVITE)>=0;});if(!activity)throw Error('QUIZ_REFUSE');lmsAccess_(ins,activity.ACTIVITE);}
function lmsHome_(session){
  var inscriptions=rows_('INSCRIPTIONS').filter(function(x){return x.UTILISATEUR===session.userId&&active_(x);}),groups=rows_('GROUPES').filter(active_),all=catalog_(),learn=learning_();
  var pathIds=inscriptions.map(function(i){var g=groups.find(function(x){return x.id===i.GROUPE;});return g&&g.PARCOURS;}).filter(Boolean);
  var pathLinks=all.PARCOURS_MODULES.filter(function(x){return pathIds.indexOf(x.PARCOURS)>=0;}),moduleIds=pathLinks.map(function(x){return x.MODULE;}),sequenceLinks=all.MODULES_SEQUENCES.filter(function(x){return moduleIds.indexOf(x.ID_MODULE)>=0;}),sequenceIds=sequenceLinks.map(function(x){return x.ID_SEQUENCE;}),sessionLinks=all.SEQUENCES_SEANCES.filter(function(x){return sequenceIds.indexOf(x.SEQUENCE)>=0;}),sessionIds=sessionLinks.map(function(x){return x.SEANCE;}),activityLinks=all.SEANCES_ACTIVITES.filter(function(x){return sessionIds.indexOf(x.SEANCE)>=0;}),activityIds=activityLinks.map(function(x){return x.ACTIVITE;});
  var evaluationLinks=learn.ACTIVITES_EVALUATIONS.filter(function(x){return activityIds.indexOf(x.ACTIVITE)>=0;}),evaluationIds=evaluationLinks.map(function(x){return x.EVALUATION;}),resourceLinks=learn.ACTIVITES_RESSOURCES.filter(function(x){return activityIds.indexOf(x.ACTIVITE)>=0;}),resourceIds=resourceLinks.map(function(x){return x.RESSOURCE;});
  return {profile:{id:session.userId,login:session.login},inscriptions:inscriptions.map(function(i){var g=groups.find(function(x){return x.id===i.GROUPE;});return {id:i.id,group:g&&g.NOM,parcoursId:g&&g.PARCOURS};}),catalog:{PARCOURS:all.PARCOURS.filter(function(x){return pathIds.indexOf(x.id)>=0;}),MODULES:all.MODULES.filter(function(x){return moduleIds.indexOf(x.id)>=0;}),SEQUENCES:all.SEQUENCES.filter(function(x){return sequenceIds.indexOf(x.id)>=0;}),SEANCES:all.SEANCES.filter(function(x){return sessionIds.indexOf(x.id)>=0;}),ACTIVITES:all.ACTIVITES.filter(function(x){return activityIds.indexOf(x.id)>=0;}),PARCOURS_MODULES:pathLinks,MODULES_SEQUENCES:sequenceLinks,SEQUENCES_SEANCES:sessionLinks,SEANCES_ACTIVITES:activityLinks,QUIZ:all.QUIZ.filter(function(x){return evaluationIds.indexOf(x.EVALUATION)>=0&&active_(x);}),EVALUATIONS:all.EVALUATIONS.filter(function(x){return evaluationIds.indexOf(x.id)>=0&&active_(x);})},learning:{RESSOURCES:learn.RESSOURCES.filter(function(x){return resourceIds.indexOf(x.id)>=0;}),ACTIVITES_RESSOURCES:resourceLinks,ACTIVITES_EVALUATIONS:evaluationLinks},progress:rows_('PROGRESSION').filter(function(x){return inscriptions.some(function(i){return i.id===x.INSCRIPTION;});}),results:rows_('RESULTATS').filter(function(x){return inscriptions.some(function(i){return i.id===x.INSCRIPTION;});}),validations:rows_('VALIDATIONS_COMPETENCES').filter(function(x){return x.UTILISATEUR===session.userId&&active_(x);}),competences:all.COMPETENCES,prerequisites:rows_('LTS_PREREQUIS').filter(active_),submissions:rows_('LTS_DEPOTS').filter(function(x){return inscriptions.some(function(i){return i.id===x.INSCRIPTION;});})};
}
function lmsComplete_(session,p){var ins=lmsInscription_(session,Number(p.inscriptionId)),id=Number(p.activityId);lmsAccess_(ins,id);var a=one_(rows_('ACTIVITES'),id);
  if(a.TYPE==='Travail à rendre'||rows_('ACTIVITES_EVALUATIONS').some(function(x){return x.ACTIVITE===id&&active_(x);}))throw Error('VALIDATION_PAR_EVALUATION');
  var old=rows_('PROGRESSION').find(function(x){return x.INSCRIPTION===ins.id&&x.ACTIVITE===id;});if(old&&old.POURCENTAGE>=100)return {completed:true,replayed:true};var now=Date.now()/1000,b=batch_(),f={STATUT:'Terminée',POURCENTAGE:100,DATE_FIN:now,DERNIERE_MAJ:now};if(old)b.update('PROGRESSION',old.id,f);else b.add('PROGRESSION',Object.assign({ID_PROGRESSION:uid_('P'),INSCRIPTION:ins.id,ACTIVITE:id,DATE_DEBUT:now},f));b.save();return {completed:true};}
function lmsSubmit_(session,p){var ins=lmsInscription_(session,Number(p.inscriptionId)),id=Number(p.activityId);lmsAccess_(ins,id);var a=one_(rows_('ACTIVITES'),id);if(a.TYPE!=='Travail à rendre')throw Error('DEPOT_REFUSE');
  var url=txt_(p.url,2000);if(!/^https:\/\/[^\s/@]+[^\s]*$/i.test(url)||/[<>"'@]/.test(url))throw Error('URL_INVALIDE');var old=rows_('LTS_DEPOTS').find(function(x){return x.INSCRIPTION===ins.id&&x.ACTIVITE===id;}),now=Date.now()/1000,b=batch_(),f={URL:url,DATE_DEPOT:now,STATUT:'Soumis',COMMENTAIRE:'',SCORE:0};if(old)b.update('LTS_DEPOTS',old.id,f);else b.add('LTS_DEPOTS',Object.assign({ID_DEPOT:uid_('D'),INSCRIPTION:ins.id,ACTIVITE:id},f));var progress=rows_('PROGRESSION').find(function(x){return x.INSCRIPTION===ins.id&&x.ACTIVITE===id;}),pf={STATUT:'En cours',POURCENTAGE:50,DERNIERE_MAJ:now};if(progress)b.update('PROGRESSION',progress.id,pf);else b.add('PROGRESSION',Object.assign({ID_PROGRESSION:uid_('P'),INSCRIPTION:ins.id,ACTIVITE:id,DATE_DEBUT:now},pf));b.save();return {submitted:true};}
function lmsTeacher_(p){
  if(p.action==='lmsAdminData')return {accounts:rows_('LTS_COMPTES').map(function(a){return {id:a.id,userId:a.UTILISATEUR,login:a.LOGIN,active:a.ACTIF};}),submissions:rows_('LTS_DEPOTS'),prerequisites:rows_('LTS_PREREQUIS').filter(active_)};
  return lmsLock_(function(){
    if(p.action==='lmsCreateNode')return lmsCreateNode_(p);
    if(p.action==='lmsAttachNode')return lmsAttachNode_(p);
    if(p.action==='lmsCreateGroup')return lmsCreateGroup_(p);
    if(p.action==='lmsCreateLearner')return lmsCreateLearner_(p);
    if(p.action==='lmsResetLearner')return lmsResetLearner_(p);
    if(p.action==='lmsCreateResource')return lmsCreateResource_(p);
    if(p.action==='lmsAttachResource')return lmsAttachResource_(p);
    if(p.action==='lmsPrerequisite')return lmsPrerequisite_(p);
    if(p.action==='lmsGrade')return lmsGrade_(p);
    if(p.action==='lmsValidateCompetence')return lmsValidateCompetence_(p);
    throw Error('ACTION_INCONNUE');
  });
}
function lmsNodeSpec_(level){var spec={module:{table:'MODULES',id:'ID_MODULE',parent:'PARCOURS',parentTable:'PARCOURS',link:'PARCOURS_MODULES',parentCol:'PARCOURS',childCol:'MODULE'},sequence:{table:'SEQUENCES',id:'ID_SEQUENCE',parent:'MODULES',parentTable:'MODULES',link:'MODULES_SEQUENCES',parentCol:'ID_MODULE',childCol:'ID_SEQUENCE'},session:{table:'SEANCES',id:'ID_SEANCE',parent:'SEQUENCES',parentTable:'SEQUENCES',link:'SEQUENCES_SEANCES',parentCol:'SEQUENCE',childCol:'SEANCE'}};if(!spec[level])throw Error('NIVEAU_INVALIDE');return spec[level];}
function lmsLink_(spec,parentId,childId){one_(rows_(spec.parentTable),parentId);one_(rows_(spec.table),childId);var links=rows_(spec.link);if(links.some(function(l){return l[spec.parentCol]===parentId&&l[spec.childCol]===childId&&active_(l);}))return {childId:childId,replayed:true};var b=batch_(),order=links.filter(function(l){return l[spec.parentCol]===parentId;}).reduce(function(n,l){return Math.max(n,Number(l.ORDRE)||0);},0)+1,f={ID_LIAISON:uid_('L'),ORDRE:order,OBLIGATOIRE:true,ACTIF:true};f[spec.parentCol]=parentId;f[spec.childCol]=childId;b.add(spec.link,f);b.save();return {childId:childId};}
function lmsCreateNode_(p){var key=token_(p.requestId),spec=lmsNodeSpec_(p.level),parentId=Number(p.parentId),title=txt_(p.title,200),description=String(p.description||'').slice(0,4000);one_(rows_(spec.parentTable),parentId);var old=rows_(spec.table).find(function(x){return x[spec.id]===key;});if(old)return lmsLink_(spec,parentId,old.id);
  var b=batch_(),fields={TITRE:title,DESCRIPTION:description,ACTIF:true};fields[spec.id]=key;if(p.level==='sequence')fields.OBJECTIFS=String(p.objectives||'').slice(0,4000);var id=b.add(spec.table,fields),links=rows_(spec.link),order=links.filter(function(l){return l[spec.parentCol]===parentId;}).reduce(function(n,l){return Math.max(n,Number(l.ORDRE)||0);},0)+1,lf={ID_LIAISON:uid_('L'),ORDRE:order,OBLIGATOIRE:true,ACTIF:true};lf[spec.parentCol]=parentId;lf[spec.childCol]=id;b.add(spec.link,lf);b.save();return {childId:id};}
function lmsAttachNode_(p){var spec=lmsNodeSpec_(p.level);return lmsLink_(spec,Number(p.parentId),Number(p.childId));}
function lmsCreateGroup_(p){var key=token_(p.requestId),old=rows_('GROUPES').find(function(g){return g.ID_GROUPE===key;});if(old)return {groupId:old.id,replayed:true};var parcours=one_(rows_('PARCOURS'),Number(p.parcoursId)),name=txt_(p.name,120),year=String(p.schoolYear||'').slice(0,30);if(!active_(parcours))throw Error('REFERENCE_INACTIVE');var b=batch_(),id=b.add('GROUPES',{ID_GROUPE:key,NOM:name,PARCOURS:parcours.id,ANNEE_SCOLAIRE:year,ACTIF:true});b.save();return {groupId:id};}
function lmsCreateLearner_(p){var key=token_(p.requestId),group=one_(rows_('GROUPES'),Number(p.groupId));if(!active_(group))throw Error('REFERENCE_INACTIVE');var accounts=rows_('LTS_COMPTES');if(accounts.some(function(a){return a.ID_COMPTE===key; }))return {replayed:true,notice:'Compte déjà créé. Utilisez la réinitialisation pour obtenir un nouveau code.'};
  var code=one_(rows_('PARCOURS'),group.PARCOURS).CODE||'LTS',login='',tries=0;do{login=lmsLoginName_(code+'-'+Utilities.getUuid().replace(/-/g,'').slice(-10));tries++;if(tries>8)throw Error('IDENTIFIANT_INDISPONIBLE');}while(accounts.some(function(a){return a.LOGIN===login;}));var activation=(Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'').slice(-20).toUpperCase(),hash=lmsHash_(lmsSecret_()+'|'+activation),b=batch_();
  var user=b.add('UTILISATEURS',{ID_UTILISATEUR:login,NOM:'Apprenant',PRENOM:login,EMAIL:'',ROLE:'Apprenant',ACTIF:true});b.add('INSCRIPTIONS',{ID_INSCRIPTION:uid_('I'),UTILISATEUR:user,GROUPE:group.id,STATUT:'Actif',ACTIF:true});b.add('LTS_COMPTES',{ID_COMPTE:key,UTILISATEUR:user,LOGIN:login,SALT:'',PASS_HASH:'',ACTIVATION_HASH:hash,ACTIVATION_EXP:Date.now()/1000+14*86400,ACTIF:false});b.save();return {login:login,activationCode:activation,expiresInDays:14};}
function lmsResetLearner_(p){var account=one_(rows_('LTS_COMPTES'),Number(p.accountId)),code=Utilities.getUuid().replace(/-/g,'').slice(0,16).toUpperCase(),b=batch_();b.update('LTS_COMPTES',account.id,{ACTIVATION_HASH:lmsHash_(lmsSecret_()+'|'+code),ACTIVATION_EXP:Date.now()/1000+14*86400,ACTIF:false,PASS_HASH:'',SALT:''});b.save();return {login:account.LOGIN,activationCode:code,expiresInDays:14};}
function lmsCreateResource_(p){var key=token_(p.requestId),old=rows_('RESSOURCES').find(function(r){return r.ID_RESSOURCE===key;});if(old)return {resourceId:old.id,replayed:true};var title=txt_(p.title,200),url=txt_(p.url,2000),type=p.type||'Automatique';if(['Automatique','PDF','Vidéo','Image','Lien'].indexOf(type)<0)throw Error('TYPE_RESSOURCE_INVALIDE');if(!/^https:\/\/[^\s/@]+[^\s]*$/i.test(url)||/[<>"']/.test(url))throw Error('URL_INVALIDE');var b=batch_(),id=b.add('RESSOURCES',{ID_RESSOURCE:key,TITRE:title,DESCRIPTION:String(p.description||'').slice(0,4000),TYPE:type,URL:url,ACTIF:true});b.save();return {resourceId:id};}
function lmsAttachResource_(p){var activity=one_(rows_('ACTIVITES'),Number(p.activityId)),resource=one_(rows_('RESSOURCES'),Number(p.resourceId));if(!active_(activity)||!active_(resource))throw Error('REFERENCE_INACTIVE');var links=rows_('ACTIVITES_RESSOURCES');if(links.some(function(x){return x.ACTIVITE===activity.id&&x.RESSOURCE===resource.id&&active_(x);}))return {replayed:true};var order=links.filter(function(x){return x.ACTIVITE===activity.id;}).reduce(function(n,x){return Math.max(n,Number(x.ORDRE)||0);},0)+1,b=batch_();b.add('ACTIVITES_RESSOURCES',{ID_LIAISON:uid_('AR'),ACTIVITE:activity.id,RESSOURCE:resource.id,ORDRE:order,OBLIGATOIRE:false,ACTIF:true});b.save();return {attached:true};}
function lmsPrerequisite_(p){var a=Number(p.activityId),required=Number(p.requiredActivityId);if(a===required)throw Error('PREREQUIS_INVALIDE');one_(rows_('ACTIVITES'),a);one_(rows_('ACTIVITES'),required);var threshold=Number(p.threshold);int_(threshold,1,100);var all=rows_('LTS_PREREQUIS'),edges=all.filter(active_);if(edges.some(function(x){return x.ACTIVITE===a&&x.ACTIVITE_REQUISE===required;}))return {replayed:true};var seen={},pending=[required];while(pending.length){var node=pending.pop();if(node===a)throw Error('PREREQUIS_CIRCULAIRE');if(seen[node])continue;seen[node]=true;edges.filter(function(x){return x.ACTIVITE===node;}).forEach(function(x){pending.push(x.ACTIVITE_REQUISE);});}var b=batch_();b.add('LTS_PREREQUIS',{ID_PREREQUIS:uid_('PRE'),ACTIVITE:a,ACTIVITE_REQUISE:required,SEUIL:threshold,ACTIF:true});b.save();return {created:true};}
function lmsGrade_(p){var depot=one_(rows_('LTS_DEPOTS'),Number(p.submissionId)),score=Number(p.score);int_(score,0,100);var comment=String(p.comment||'').slice(0,4000),b=batch_(),now=Date.now()/1000;b.update('LTS_DEPOTS',depot.id,{SCORE:score,COMMENTAIRE:comment,STATUT:'Corrigé'});var progress=rows_('PROGRESSION').find(function(x){return x.INSCRIPTION===depot.INSCRIPTION&&x.ACTIVITE===depot.ACTIVITE;});if(progress)b.update('PROGRESSION',progress.id,{STATUT:'Terminée',POURCENTAGE:100,DATE_FIN:now,DERNIERE_MAJ:now});b.save();return {graded:true};}
function lmsValidateCompetence_(p){var user=one_(rows_('UTILISATEURS'),Number(p.userId)),competence=one_(rows_('COMPETENCES'),Number(p.competenceId));if(!active_(user)||!active_(competence))throw Error('REFERENCE_INACTIVE');var level=String(p.level||'Acquise');if(['En cours','Acquise','Maîtrisée'].indexOf(level)<0)throw Error('NIVEAU_INVALIDE');var marker='Campus LTS / enseignant / '+user.id+' / '+competence.id,old=rows_('VALIDATIONS_COMPETENCES').find(function(x){return x.COMMENTAIRE===marker;}),b=batch_(),f={NIVEAU:level,DATE_VALIDATION:Math.floor(Date.now()/86400000)*86400,SOURCE:'Enseignant',ACTIF:true};if(old)b.update('VALIDATIONS_COMPETENCES',old.id,f);else b.add('VALIDATIONS_COMPETENCES',Object.assign({ID_VALIDATION:uid_('V'),UTILISATEUR:user.id,COMPETENCE:competence.id,COMMENTAIRE:marker},f));b.save();return {validated:true};}
