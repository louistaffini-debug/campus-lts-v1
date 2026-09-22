import http from 'node:http';
import {readFile} from 'node:fs/promises';
const root=new URL('../site/',import.meta.url);
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8'};
http.createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  const file=path==='/'?'index.html':path.slice(1);
  if(!['index.html','styles.css','atelier-theme.css','resources.css','app.js','learning.js','config.js','api-source'].includes(file)){
    res.writeHead(404);res.end();return;
  }
  try{
    res.setHeader('Content-Type',types[file.split('.').pop()]||'text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    const data=await readFile(file==='api-source'?new URL('../apps-script/CampusV1.gs',import.meta.url):new URL(file,root));
    res.end(file==='api-source'?'<html lang="fr"><meta charset="utf-8"><title>Source API Campus LTS</title><body><pre>'+data.toString().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')+'</pre></body></html>':data);
  }catch{res.writeHead(404);res.end();}
}).listen(5174,'127.0.0.1',()=>console.log('Campus LTS: http://localhost:5174'));
