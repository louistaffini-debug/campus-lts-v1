import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
let store={},applied=[],serial=0,properties={LTS_PASSWORD_PEPPER:'test-pepper'};
const initial={ACTIVITES:[{id:1,ACTIF:true}],COMPETENCES:[{id:1,ACTIF:true}],INSCRIPTIONS:[{id:1,UTILISATEUR:1,ACTIF:true}],EVALUATIONS:[],QUIZ:[],QUESTIONS:[],OPTIONS_QUESTION:[],QUIZ_QUESTIONS:[],ACTIVITES_EVALUATIONS:[],EVALUATIONS_COMPETENCES:[],TENTATIVES:[],REPONSES:[],RESULTATS:[],PROGRESSION:[],VALIDATIONS_COMPETENCES:[]};
let db=structuredClone(initial);
const ctx=vm.createContext({console,Date,Utilities:{DigestAlgorithm:{SHA_256:'SHA_256'},computeDigest:(_alg,s)=>[...createHash('sha256').update(s).digest()],getUuid:()=>`12345678-1234-4123-8123-${String(++serial).padStart(12,'0')}`},PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='WRITE_PIN'?'test-secret':k==='GRIST_BASE_URL'?'https://grist.invalid/api':properties[k]||'test',setProperty:(k,v)=>properties[k]=v})},CacheService:{getScriptCache:()=>({get:k=>store[k],put:(k,v)=>store[k]=v,remove:k=>delete store[k]})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})}});
vm.runInContext(readFileSync(new URL('../apps-script/CampusV1.gs',import.meta.url),'utf8'),ctx);
vm.runInContext(readFileSync(new URL('../apps-script/CampusLms.gs',import.meta.url),'utf8'),ctx);
ctx.req_=(path,method,data)=>{
  if(path==='/tables'){
    if(method==='post'){for(const t of data.tables){assert(!db[t.id]);db[t.id]=[];}return {tables:data.tables.map(t=>({id:t.id}))};}
    return {tables:Object.keys(db).map(id=>({id}))};
  }
  if(path==='/apply'){
    applied.push(structuredClone(data));const copy=structuredClone(db);
    for(const [type,table,id,fields] of data){assert(copy[table],table);if(type==='AddRecord'){assert(!copy[table].some(r=>r.id===id),'duplicate ID');copy[table].push({id,...structuredClone(fields)});}else Object.assign(copy[table].find(r=>r.id===id),structuredClone(fields));}
    db=copy;return {retValues:data.map(a=>a[2])};
  }
  const table=path.split('/')[2];if(method==='post'&&path.endsWith('/records')){const records=data.records.map(({fields})=>{const id=Math.max(0,...db[table].map(x=>x.id))+1;db[table].push({id,...fields});return {id};});return {records};}
  return {records:(db[table]||[]).map(({id,...fields})=>({id,fields}))};
};
const post=p=>ctx.doPost({postData:{contents:JSON.stringify(p)}});
assert.equal(post({action:'tracking'}).error,'ACCES_REFUSE');assert.equal(applied.length,0);
assert.equal(ctx.doGet().data,undefined);
let payload={pin:'test-secret',action:'createQuiz',requestId:'test-request-000001',quiz:{title:'Test',activityId:1,competenceId:1,threshold:80,attempts:2,resultRule:'Meilleure tentative',published:true},questions:[{title:'Q1',points:1,answers:['A','B'],correct:0},{title:'Q2',points:1,answers:['C','D'],correct:1}]};
let r=post(payload);assert.equal(r.ok,true,JSON.stringify(r));assert.equal(db.OPTIONS_QUESTION.length,4);assert.equal(db.QUIZ_QUESTIONS.length,2);assert.equal(applied.length,1);
assert.equal(post(payload).data.replayed,true);assert.equal(applied.length,1);
const quiz=ctx.quiz_(1);assert(!JSON.stringify(quiz).includes('EST_CORRECTE'));
const attempt={pin:'test-secret',action:'submitAttempt',requestId:'test-attempt-000001',quizId:1,inscriptionId:1,score:100,answers:[{questionId:1,optionId:2},{questionId:2,optionId:4}]};
r=post(attempt);assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.data.score,50);assert.equal(db.VALIDATIONS_COMPETENCES.length,0);assert.equal(db.PROGRESSION[0].POURCENTAGE,50);
db.TENTATIVES[0].POURCENTAGE=50;
r=post({...attempt,requestId:'test-attempt-000002',answers:[{questionId:1,optionId:1},{questionId:2,optionId:4}]});assert.equal(r.data.score,100);assert.equal(r.data.retained,100);assert.equal(db.RESULTATS.length,1);assert.equal(db.PROGRESSION.length,1);assert.equal(db.VALIDATIONS_COMPETENCES.length,1);assert.equal(db.VALIDATIONS_COMPETENCES[0].ACTIF,true);
assert.equal(post({...attempt,requestId:'test-attempt-000003'}).error,'TENTATIVES_EPUISEES');
assert.equal(post(attempt).data.replayed,true);
for(const a of applied.flat())if(a[1]==='RESULTATS')assert(!('POURCENTAGE'in a[3]),'never write formula columns');
db=structuredClone(initial);applied=[];post(payload);
r=post({...attempt,answers:[{questionId:1,optionId:1},{questionId:1,optionId:1}]});assert.equal(r.error,'REPONSE_DUPLIQUEE');assert.equal(db.TENTATIVES.length,0);
r=post({...attempt,answers:[{questionId:1,optionId:4},{questionId:2,optionId:4}]});assert.equal(r.error,'OPTION_INVALIDE');assert.equal(db.TENTATIVES.length,0);
db.SEANCES=[{id:1,ACTIF:true}];db.SEANCES_ACTIVITES=[];db.RESSOURCES=[];db.ACTIVITES_RESSOURCES=[];
const course={pin:'test-secret',action:'createActivity',requestId:'test-course-000001',activity:{sessionId:1,title:'Cours test',content:'Contenu du cours',type:'Cours',minutes:30,resources:[{title:'Document',type:'PDF',url:'https://example.com/course.pdf'}]}};
assert.equal(post({...course,pin:''}).error,'ACCES_REFUSE');
assert.equal(post({...course,activity:{...course.activity,resources:[{title:'X',url:'javascript:alert(1)'}]}}).error,'URL_INVALIDE');
assert.equal(post(course).ok,true);assert.equal(db.SEANCES_ACTIVITES.length,1);assert.equal(db.RESSOURCES.length,1);assert.equal(db.RESSOURCES[0].TYPE,'PDF');
assert.equal(post(course).data.replayed,true);assert.equal(db.SEANCES_ACTIVITES.length,1);
assert.equal(post({pin:'test-secret',action:'learning'}).data.RESSOURCES.length,1);
assert.equal(post({...course,requestId:'test-course-000002',activity:{...course.activity,sessionId:999}}).error,'REFERENCE_INVALIDE');
console.log('OK — course creation, linked resources, authentication, URL validation and idempotency.');
for(let i=0;i<20;i++)post({pin:'wrong',action:'catalog'});assert.equal(post({pin:'wrong',action:'catalog'}).error,'PATIENTEZ_10_MINUTES');
console.log('OK — authentication, grading, references, two attempts, idempotency, progression, competencies and attempt limit.');
store={};db={...structuredClone(initial),PARCOURS:[{id:1,ID_PARCOURS:'CPRP',CODE:'CPRP',TITRE:'CPRP',ACTIF:true}],MODULES:[{id:1,TITRE:'Métrologie',ACTIF:true}],SEQUENCES:[{id:1,TITRE:'Mesures',ACTIF:true}],SEANCES:[{id:1,TITRE:'Lecture',ACTIF:true}],PARCOURS_MODULES:[{id:1,PARCOURS:1,MODULE:1,ACTIF:true}],MODULES_SEQUENCES:[{id:1,ID_MODULE:1,ID_SEQUENCE:1,ACTIF:true}],SEQUENCES_SEANCES:[{id:1,SEQUENCE:1,SEANCE:1,ACTIF:true}],SEANCES_ACTIVITES:[],ACTIVITES_RESSOURCES:[],RESSOURCES:[],ACTIVITES_COMPETENCES:[],GROUPES:[{id:1,NOM:'CPRP test',PARCOURS:1,ACTIF:true}],UTILISATEURS:[{id:1,ID_UTILISATEUR:'OTHER',ACTIF:true}],LTS_COMPTES:[],LTS_DEPOTS:[],LTS_PREREQUIS:[]};
ctx.installerLms();assert.equal(db.PARCOURS.length,5);assert.equal(ctx.installerLms(),undefined);assert.equal(db.PARCOURS.length,5);
const node=post({pin:'test-secret',action:'lmsCreateNode',requestId:'new-session-000001',level:'session',parentId:1,title:'Séance créée'});assert.equal(node.ok,true,JSON.stringify(node));assert(db.SEQUENCES_SEANCES.some(x=>x.SEANCE===node.data.childId));
const learner=post({pin:'test-secret',action:'lmsCreateLearner',requestId:'new-learner-00001',groupId:1});assert.equal(learner.ok,true,JSON.stringify(learner));
const {login,activationCode}=learner.data,studentId=db.UTILISATEURS.at(-1).id,studentIns=db.INSCRIPTIONS.find(i=>i.UTILISATEUR===studentId).id;
assert.equal(post({action:'studentActivate',login,activationCode:'WRONG',password:'long-test-passphrase'}).error,'ACTIVATION_INVALIDE');
const activated=post({action:'studentActivate',login,activationCode,password:'long-test-passphrase'});assert.equal(activated.ok,true,JSON.stringify(activated));const sessionToken=activated.data.sessionToken;
assert.equal(post({action:'studentLogin',login,password:'wrong'}).error,'IDENTIFIANTS_INCORRECTS');
assert.equal(post({action:'studentLogin',login,password:'long-test-passphrase'}).ok,true);
const course2=post({pin:'test-secret',action:'createActivity',requestId:'new-course-0000001',activity:{sessionId:1,title:'Cours',content:'Mesurer',type:'Cours',minutes:30,resources:[]}});assert.equal(course2.ok,true);const activityId=course2.data.activityId;
let home=post({action:'studentHome',sessionToken});assert.equal(home.ok,true,JSON.stringify(home));assert(home.data.catalog.ACTIVITES.some(x=>x.id===activityId));assert.equal(home.data.profile.login,login);
assert.equal(post({action:'studentComplete',sessionToken,inscriptionId:1,activityId}).error,'INSCRIPTION_REFUSEE');
assert.equal(post({action:'studentComplete',sessionToken,inscriptionId:studentIns,activityId}).ok,true);
assert.equal(post({action:'studentHome',sessionToken}).data.progress.find(x=>x.ACTIVITE===activityId).POURCENTAGE,100);
const homework=post({pin:'test-secret',action:'createActivity',requestId:'new-homework-00001',activity:{sessionId:1,title:'Devoir',content:'Remettre le plan',type:'Travail à rendre',minutes:45,resources:[]}});assert.equal(homework.ok,true);const workId=homework.data.activityId;
assert.equal(post({action:'studentComplete',sessionToken,inscriptionId:studentIns,activityId:workId}).error,'VALIDATION_PAR_EVALUATION');
assert.equal(post({action:'studentSubmit',sessionToken,inscriptionId:studentIns,activityId:workId,url:'javascript:alert(1)'}).error,'URL_INVALIDE');
assert.equal(post({action:'studentSubmit',sessionToken,inscriptionId:studentIns,activityId:workId,url:'https://drive.google.com/file/d/example/view'}).ok,true);
const grade=post({pin:'test-secret',action:'lmsGrade',submissionId:db.LTS_DEPOTS[0].id,score:85,comment:'Bon travail'});assert.equal(grade.ok,true);home=post({action:'studentHome',sessionToken});assert.equal(home.data.submissions[0].COMMENTAIRE,'Bon travail');assert.equal(home.data.progress.find(p=>p.ACTIVITE===workId).POURCENTAGE,100);
assert.equal(post({action:'studentHome',sessionToken:'00000000-0000-0000-0000-000000000000'}).error,'SESSION_EXPIREE');
console.log('OK — five pathways, authoring, individual activation, scoped learner access, progression, submission and grading.');
