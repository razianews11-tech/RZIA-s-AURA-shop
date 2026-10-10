import { getStore } from "@netlify/blobs";
const STORE="rzias-aura-live";
const KEY="store-data";
const EMPTY={
  products:[],collections:[
    {id:"women",name:"Women",description:"Modern silhouettes, timeless grace.",image:"https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",active:true},
    {id:"men",name:"Men",description:"Refined essentials for every day.",image:"https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1000&q=85",active:true},
    {id:"modest",name:"Modest Wear",description:"Elegance in every detail.",image:"https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=1000&q=85",active:true}
  ],
  settings:{brand_name:"RZIA’S AURA",tagline:"THE AURA OF ELEGANCE",hero_heading:"Elegance,\\nRedefined.",hero_text:"Thoughtfully selected fashion for the way you move through the world.",hero_image:"https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2200&q=90",logo_url:"",about_text:"RZIA’S AURA celebrates modern elegance through considered design, expressive details and timeless style.",whatsapp:"",email:"",address:"",instagram:"",facebook:"",tiktok:"",delivery_charges_pkr:250,free_delivery_above_pkr:5000,shipping_information:"Orders are processed after confirmation. Delivery timelines may vary by destination.",return_policy:"Please contact our team promptly if your order arrives damaged or incorrect.",privacy_policy:"We use customer information only to process and support orders.",footer_text:"Where elegance becomes an attitude."},
  announcement:{text:"WELCOME TO RZIA’S AURA — THE AURA OF ELEGANCE",active:true},
  faqs:[{id:"f1",question:"How do I place an order?",answer:"Add items to your bag and contact us to confirm your order."}]
};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, no-cache, must-revalidate"}});
const merge=(d={})=>({...EMPTY,...d,products:Array.isArray(d.products)?d.products:[],collections:Array.isArray(d.collections)?d.collections:EMPTY.collections,settings:{...EMPTY.settings,...(d.settings||{})},announcement:{...EMPTY.announcement,...(d.announcement||{})},faqs:Array.isArray(d.faqs)?d.faqs:EMPTY.faqs});
export default async (req)=>{
 try{
  const store=getStore(STORE);
  if(req.method==="GET"){const saved=await store.get(KEY,{type:"json",consistency:"strong"});return json(merge(saved||EMPTY));}
  if(req.method==="PUT"){
   const auth=req.headers.get("authorization")||"";
   const token=process.env.ADMIN_TOKEN;
   if(!token||auth!==`Bearer ${token}`)return json({success:false,message:"Admin is not configured or session is invalid."},401);
   const incoming=await req.json();
   if(!incoming||!Array.isArray(incoming.products)||!Array.isArray(incoming.collections))return json({success:false,message:"Invalid store data."},400);
   const next=merge(incoming);
   await store.setJSON(KEY,next);
   const check=await store.get(KEY,{type:"json",consistency:"strong"});
   if(!check||!Array.isArray(check.products))return json({success:false,message:"Save verification failed."},500);
   return json({success:true,message:"Store data saved and verified.",data:merge(check)});
  }
  return json({success:false,message:"Method not allowed."},405);
 }catch(e){console.error("DATA FUNCTION ERROR",e);return json({success:false,message:e?.message||"Data request failed."},500);}
};