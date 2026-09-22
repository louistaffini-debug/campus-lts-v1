const base=process.env.GRIST_API_URL??"https://docs.getgrist.com/api";
export const gristConfigured=()=>Boolean(process.env.GRIST_DOC_ID&&process.env.GRIST_API_KEY);
export async function grist(path:string,init:RequestInit={}){const id=process.env.GRIST_DOC_ID,key=process.env.GRIST_API_KEY;if(!id||!key)throw new Error("GRIST_NOT_CONFIGURED");const r=await fetch(`${base}/docs/${encodeURIComponent(id)}${path}`,{...init,headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json",...init.headers},cache:"no-store"});if(!r.ok)throw new Error(`GRIST_${r.status}`);return r.json()}
