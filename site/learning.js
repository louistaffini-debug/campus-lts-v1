'use strict';
// All content is rendered as plain text. Resources allow HTTPS links only.
function orderedChildren(links, parentKey, parentId, childKey, records) {
  return links.filter(l => l.ACTIF !== false && Number(l[parentKey]) === Number(parentId))
    .sort((a,b) => (Number(a.ORDRE)||0)-(Number(b.ORDRE)||0))
    .map(l => records.find(r => r.id === l[childKey] && r.ACTIF !== false)).filter(Boolean);
}
function courseText(value) { return `<p style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(value || '')}</p>`; }
function resourcePlayer(r) {
  let u; try { u=new URL(r.URL); if(u.protocol!=='https:' || u.username || u.password) return ''; } catch { return ''; }
  const raw=r.URL, declared=String(r.TYPE||'Automatique').toLowerCase(), path=u.pathname.toLowerCase();
  let kind=declared;
  if(kind==='automatique'||kind==='lien') {
    if(/\.pdf$/.test(path))kind='pdf';
    else if(/\.(mp4|webm|ogg)$/.test(path))kind='vidéo';
    else if(/\.(png|jpe?g|gif|webp|svg)$/.test(path))kind='image';
    else if(/(^|\.)youtube\.com$/.test(u.hostname)||u.hostname==='youtu.be'||/(^|\.)vimeo\.com$/.test(u.hostname))kind='vidéo';
  }
  let src=raw;
  const drive=/\/file\/d\/([a-zA-Z0-9_-]+)/.exec(u.pathname);if(drive)src=`https://drive.google.com/file/d/${drive[1]}/preview`;
  const yt=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v');if(yt&&/^[a-zA-Z0-9_-]{6,20}$/.test(yt))src=`https://www.youtube-nocookie.com/embed/${yt}`;
  const vm=/(?:video\/)?(\d+)/.exec(u.pathname);if(/(^|\.)vimeo\.com$/.test(u.hostname)&&vm)src=`https://player.vimeo.com/video/${vm[1]}`;
  let player='';
  if(kind==='pdf'||drive)player=`<iframe title="${esc(r.TITRE||'Document')}" src="${esc(src)}" loading="lazy"></iframe>`;
  else if(kind==='vidéo'&&/\.(mp4|webm|ogg)$/.test(path))player=`<video controls preload="metadata" src="${esc(src)}"></video>`;
  else if(kind==='vidéo'&&src!==raw)player=`<iframe title="${esc(r.TITRE||'Vidéo')}" src="${esc(src)}" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  else if(kind==='image')player=`<img src="${esc(src)}" alt="${esc(r.TITRE||'Ressource')}" loading="lazy">`;
  return `<div class="resource"><div class="row"><strong>${esc(r.TITRE||'Ressource')}</strong><a href="${esc(raw)}" target="_blank" rel="noopener noreferrer">Ouvrir dans un nouvel onglet ↗</a></div>${player||'<p class="muted">Cette ressource s’ouvre dans un nouvel onglet.</p>'}</div>`;
}
function pathways() {
  $('#content').innerHTML=title('APPRENDRE / PARCOURS','Mes parcours','Retrouvez les cours, les exercices et les évaluations de chaque séance.')+
    '<p class="footnote">Espace enseignant · Les comptes apprenants et le dépôt privé des travaux ne sont pas encore ouverts.</p>'+
    (catalog.PARCOURS.length ? catalog.PARCOURS.map(p => `<section class="panel"><h2>${esc(p.TITRE)}</h2>${courseText(p.DESCRIPTION)}${
      orderedChildren(catalog.PARCOURS_MODULES,'PARCOURS',p.id,'MODULE',catalog.MODULES).map(m =>
        `<details open><summary><strong>${esc(m.TITRE)}</strong></summary>${courseText(m.DESCRIPTION)}${
          orderedChildren(catalog.MODULES_SEQUENCES,'ID_MODULE',m.id,'ID_SEQUENCE',catalog.SEQUENCES).map(s =>
            `<div class="question"><h3>${esc(s.TITRE)}</h3>${courseText(s.OBJECTIFS || s.DESCRIPTION)}${
              orderedChildren(catalog.SEQUENCES_SEANCES,'SEQUENCE',s.id,'SEANCE',catalog.SEANCES).map(se =>
                `<p><button class="secondary" data-session="${se.id}">Ouvrir la séance · ${esc(se.TITRE)}</button></p>`).join('') || '<p>Aucune séance pour cette séquence.</p>'}</div>`).join('') || '<p>Aucune séquence pour ce module.</p>'}</details>`).join('') || '<p>Aucun module associé à ce parcours.</p>'}</section>`).join('') : '<p>Aucun parcours disponible.</p>');
  document.querySelectorAll('[data-session]').forEach(b => b.onclick=()=>openSession(Number(b.dataset.session)));
}
function openSession(id) {
  task(async()=>{
    const sourceCatalog=catalog;
    const learning=preview ? demoLearning() : await api('learning');
    if(catalog!==sourceCatalog || view!=='pathways') return;
    sessionPage(id,learning);
  });
}
function sessionPage(id,learning) {
  const se=catalog.SEANCES.find(s=>s.id===id); if(!se)return;
  const activities=orderedChildren(catalog.SEANCES_ACTIVITES,'SEANCE',id,'ACTIVITE',catalog.ACTIVITES);
  $('#content').innerHTML=title('PARCOURS / SÉANCE',se.TITRE,se.DESCRIPTION || 'Cours et activités de la séance')+
    '<div class="row"><button id="back-pathways" class="secondary">← Mes parcours</button><button id="new-activity" class="primary">Ajouter une activité</button></div><p class="footnote">La consultation des cours n’est pas encore comptabilisée dans la progression.</p>'+
    activities.map(a=>`<section class="panel"><span class="badge">${esc(a.TYPE || 'Activité')}</span><h2>${esc(a.TITRE)}</h2>${courseText(a.DESCRIPTION)}${
      orderedChildren(learning.ACTIVITES_RESSOURCES,'ACTIVITE',a.id,'RESSOURCE',learning.RESSOURCES).map(resourcePlayer).join('')}
      ${a.TYPE==='Travail à rendre'?'<div class="callout">Consignes uniquement : le dépôt privé des fichiers sera disponible après la mise en place des comptes apprenants.</div>':''}
      ${(learning.ACTIVITES_EVALUATIONS||[]).some(l=>l.ACTIVITE===a.id && catalog.QUIZ.some(q=>q.EVALUATION===l.EVALUATION))?'<button class="secondary" data-session-quiz>Accéder aux quiz</button>':''}</section>`).join('')+
    (!activities.length?'<section class="panel empty">Cette séance ne contient pas encore d’activité.</section>':'')+'<div id="activity-editor"></div>';
  $('#back-pathways').onclick=pathways;
  $('#new-activity').onclick=()=>activityEditor(id,learning);
  document.querySelectorAll('[data-session-quiz]').forEach(b=>b.onclick=()=>{view='run';render();});
}
function activityEditor(sessionId,learning) {
  const request=crypto.randomUUID();
  $('#activity-editor').innerHTML=`<section class="panel"><h2>Nouvelle activité</h2><form id="create-activity">
    <label>Type<select name="type"><option>Cours</option><option>Exercice</option><option>Travail à rendre</option><option>TP</option></select></label>
    <label>Titre<input name="title" maxlength="200" required></label>
    <label>Cours ou consignes<textarea name="content" rows="10" maxlength="30000" required></textarea></label>
    <label>Durée prévue (minutes)<input name="minutes" type="number" min="1" max="600" value="30" required></label>
    <label>Titre de la ressource (facultatif)<input name="resourceTitle" maxlength="200"></label>
    <label>Format de la ressource<select name="resourceType"><option>Automatique</option><option>PDF</option><option>Vidéo</option><option>Image</option><option>Lien</option></select></label>
    <label>Lien vers une ressource (HTTPS)<input name="resourceUrl" type="url" placeholder="https://…"></label>
    <p class="footnote">Les ressources doivent être accessibles aux destinataires. Aucun fichier ni clé API n’est envoyé dans GitHub.</p>
    <button class="primary">Enregistrer l’activité</button> <button type="button" id="cancel-activity" class="secondary">Annuler</button>
    </form></section>`;
  $('#activity-editor').scrollIntoView({behavior:'smooth'});
  $('#cancel-activity').onclick=()=>$('#activity-editor').replaceChildren();
  $('#create-activity').onsubmit=e=>{
    e.preventDefault(); const data=Object.fromEntries(new FormData(e.target));
    task(async()=>{
      if(preview){result('Aperçu : aucune activité enregistrée. Connectez-vous pour créer vos contenus.');return;}
      await api('createActivity',{requestId:request,activity:{sessionId,title:data.title,type:data.type,content:data.content,minutes:Number(data.minutes),resources:data.resourceUrl?[{title:data.resourceTitle||'Ressource',type:data.resourceType,url:data.resourceUrl}]:[]}});
      catalog=await api('catalog'); const updated=await api('learning');sessionPage(sessionId,updated);result('Activité et ressources enregistrées dans la séance.');
    });
  };
}
function demoLearning(){return {RESSOURCES:[{id:1,TITRE:'Exemple de support PDF',TYPE:'PDF',URL:'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',ACTIF:true}],ACTIVITES_RESSOURCES:[{ACTIVITE:1,RESSOURCE:1,ORDRE:1,ACTIF:true}],ACTIVITES_EVALUATIONS:[]};}
// Add the new entry without changing existing quiz navigation or saved data.
const pathwaysButton=document.createElement('button');
pathwaysButton.dataset.view='pathways';pathwaysButton.textContent='◫   Mes parcours';
document.querySelector('nav').insertBefore(pathwaysButton,document.querySelector('[data-view="quiz"]'));
pathwaysButton.onclick=()=>{view='pathways';notice();render();};
