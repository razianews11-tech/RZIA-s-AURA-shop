import { getStore } from "@netlify/blobs";
export default async (req)=>{
 const url=new URL(req.url);const key=decodeURIComponent(url.pathname.split("/").pop()||"");
 if(!key)return new Response("Not found",{status:404});
 try{const store=getStore("rzias-aura-images");const blob=await store.getWithMetadata(key,{type:"arrayBuffer"});if(!blob?.data)return new Response("Not found",{status:404});return new Response(blob.data,{headers:{"Content-Type":blob.metadata?.contentType||"application/octet-stream","Cache-Control":"public, max-age=31536000, immutable"}})}catch(e){console.error("IMAGE ERROR",e);return new Response("Image unavailable",{status:500});}
};