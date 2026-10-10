import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
export default async (req)=>{
 if(req.method!=="POST")return json({message:"Method not allowed."},405);
 const token=process.env.ADMIN_TOKEN;
 if(!token||(req.headers.get("authorization")||"")!==`Bearer ${token}`)return json({message:"Please sign in as an administrator before uploading images."},401);
 try{
  const form=await req.formData();const file=form.get("file");
  if(!file||typeof file==="string")return json({message:"Choose an image first."},400);
  if(!["image/jpeg","image/png","image/webp","image/gif","image/avif"].includes(file.type))return json({message:"Use a JPG, PNG, WEBP, GIF or AVIF image."},415);
  if(file.size>8*1024*1024)return json({message:"Each image must be smaller than 8 MB."},413);
  const key=`${Date.now()}-${crypto.randomUUID()}.${file.type.split("/")[1].replace("jpeg","jpg")}`;
  const store=getStore("rzias-aura-images");await store.set(key,Buffer.from(await file.arrayBuffer()),{metadata:{contentType:file.type,originalName:file.name}});
  return json({success:true,url:`/api/image/${encodeURIComponent(key)}`});
 }catch(e){console.error("UPLOAD ERROR",e);return json({message:e?.message||"Image upload failed."},500);}
};