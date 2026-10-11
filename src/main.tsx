import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Search, ShoppingBag, Heart, Menu, X, ShieldCheck, Instagram, MessageCircle, ChevronDown, Plus, Minus, Trash2, ImagePlus, Save, Package, Settings, LayoutDashboard, LogOut, Upload, Eye, EyeOff, RefreshCw } from "lucide-react";
import "./styles.css";

type Product = { id:string; name:string; category:string; description:string; price_pkr:number; price_bdt:number; price_eur:number; sizes:string[]; colors:string[]; stock:number; images:string[]; active:boolean; featured:boolean; badge:string };
type StoreData = { products:Product[]; collections:{id:string;name:string;description:string;image:string;active:boolean}[]; settings:Record<string,any>; announcement:{text:string;active:boolean}; faqs:{id:string;question:string;answer:string}[] };
const defaultData:StoreData = {
  products:[],
  collections:[
    {id:"women",name:"Women",description:"Modern silhouettes, timeless grace.",image:"https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",active:true},
    {id:"men",name:"Men",description:"Refined essentials for every day.",image:"https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1000&q=85",active:true},
    {id:"modest",name:"Modest Wear",description:"Elegance in every detail.",image:"https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=1000&q=85",active:true}
  ],
  settings:{brand_name:"RZIA’S AURA",tagline:"THE AURA OF ELEGANCE",hero_heading:"Elegance,\\nRedefined.",hero_text:"Thoughtfully selected fashion for the way you move through the world.",hero_image:"https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2200&q=90",logo_url:"",about_text:"RZIA’S AURA celebrates modern elegance through considered design, expressive details and timeless style.",whatsapp:"",email:"",address:"",instagram:"",facebook:"",tiktok:"",delivery_charges_pkr:250,free_delivery_above_pkr:5000,shipping_information:"Orders are processed after confirmation. Delivery timelines may vary by destination.",return_policy:"Please contact our team promptly if your order arrives damaged or incorrect.",privacy_policy:"We use customer information only to process and support orders.",footer_text:"Where elegance becomes an attitude."},
  announcement:{text:"WELCOME TO RZIA’S AURA — THE AURA OF ELEGANCE",active:true},
  faqs:[{id:"f1",question:"How do I place an order?",answer:"Add your favourite items to the bag and follow the checkout instructions, or contact us on WhatsApp."},{id:"f2",question:"How can I check my size?",answer:"Review the size options on each product and contact our team if you need guidance."},{id:"f3",question:"How can I contact customer support?",answer:"Use the contact details in the footer or the WhatsApp button when enabled."}]
};
const money=(v:number,c:string)=>new Intl.NumberFormat(c==="EUR"?"de-DE":c==="BDT"?"en-BD":"en-PK",{style:"currency",currency:c==="EUR"?"EUR":c==="BDT"?"BDT":"PKR",maximumFractionDigits:c==="EUR"?2:0}).format(Number(v||0));
const normalise=(d:any):StoreData=>({...defaultData,...d,products:Array.isArray(d?.products)?d.products:[],collections:Array.isArray(d?.collections)?d.collections:defaultData.collections,settings:{...defaultData.settings,...(d?.settings||{})},announcement:{...defaultData.announcement,...(d?.announcement||{})},faqs:Array.isArray(d?.faqs)?d.faqs:defaultData.faqs});
async function apiData():Promise<StoreData>{try{const r=await fetch("/api/data",{cache:"no-store"});if(!r.ok)throw Error();return normalise(await r.json())}catch{return normalise(JSON.parse(localStorage.getItem("rzia-preview-data")||"null")||defaultData)}}
async function saveData(data:StoreData){const r=await fetch("/api/data",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const j=await r.json().catch(()=>({}));if(!r.ok||j.success!==true)throw new Error(j.message||"Server save failed. Check Netlify setup.");return j.data?normalise(j.data):data}
function imageFor(p:Product){return p.images?.[0]||""}
function App(){
 const [data,setData]=useState<StoreData>(defaultData),[loading,setLoading]=useState(true),[currency,setCurrency]=useState("PKR"),[bag,setBag]=useState<{id:string;qty:number;size:string}[]>([]),[wish,setWish]=useState<string[]>([]),[search,setSearch]=useState(""),[category,setCategory]=useState("All"),[mobileMenu,setMobileMenu]=useState(false),[view,setView]=useState<"home"|"admin"|"login"|"product"|"cart"|"info">("home"),[selected,setSelected]=useState<Product|null>(null),[info,setInfo]=useState("Our Story"),[loginUser,setLoginUser]=useState(""),[loginPass,setLoginPass]=useState(""),[adminToken,setAdminToken]=useState(sessionStorage.getItem("rzia-admin-token")||""),[notice,setNotice]=useState(""),[saving,setSaving]=useState(false),[tab,setTab]=useState("Dashboard"),[editProduct,setEditProduct]=useState<Product|null>(null),[adminData,setAdminData]=useState<StoreData>(defaultData),[fileBusy,setFileBusy]=useState(false),[checkoutName,setCheckoutName]=useState(""),[checkoutPhone,setCheckoutPhone]=useState(""),[checkoutAddress,setCheckoutAddress]=useState("");
 useEffect(()=>{apiData().then(d=>{setData(d);setAdminData(d)}).finally(()=>setLoading(false));},[]);
 useEffect(()=>{if(view==="admin"&&adminToken){apiData().then(setAdminData)}},[view,adminToken]);
 const products=useMemo(()=>data.products.filter(p=>p.active!==false&&(category==="All"||p.category===category)&&(`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(search.toLowerCase()))),[data,category,search]);
 const total=bag.reduce((sum,item)=>{const p=data.products.find(x=>x.id===item.id);return sum+(p?Number((currency==="PKR"?p.price_pkr:currency==="BDT"?p.price_bdt:p.price_eur)||0)*item.qty:0)},0);
 const notify=(s:string)=>{setNotice(s);setTimeout(()=>setNotice(""),3500)};
 const field=(label:string,value:any,onChange:(v:string)=>void,type="text")=><label className="field"><span>{label}</span><input type={type} value={value??""} onChange={e=>onChange(e.target.value)}/></label>;
 const persist=async(next:StoreData)=>{setSaving(true);try{const saved=await saveData(next);setData(saved);setAdminData(saved);localStorage.setItem("rzia-preview-data",JSON.stringify(saved));notify("Saved successfully and verified.");return true}catch(e:any){localStorage.setItem("rzia-preview-data",JSON.stringify(next));setAdminData(next);notify(`Online save failed: ${e.message}`);return false}finally{setSaving(false)}};
 const uploadImage=async(file:File):Promise<string>=>{const fd=new FormData();fd.append("file",file);const r=await fetch("/api/upload",{method:"POST",body:fd});const j=await r.json();if(!r.ok||!j.url)throw Error(j.message||"Image upload failed");return j.url};
 const signIn=async(e:React.FormEvent)=>{e.preventDefault();try{const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:loginUser,password:loginPass})});const j=await r.json();if(!r.ok||!j.token)throw Error(j.message||"Login failed");sessionStorage.setItem("rzia-admin-token",j.token);setAdminToken(j.token);setView("admin");notify("Admin login successful.")}catch(err:any){notify(err.message||"Login failed. Configure Netlify environment variables first.")}};
 const adminFetch=async(path:string,init:RequestInit={})=>{const r=await fetch(path,{...init,headers:{...(init.headers||{}),Authorization:`Bearer ${adminToken}`,"Content-Type":"application/json"}});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.message||"Admin action failed");return j};
 const protectedSave=async(next:StoreData)=>{setSaving(true);try{const j=await adminFetch("/api/admin/data",{method:"PUT",body:JSON.stringify(next)});const saved=normalise(j.data||next);setAdminData(saved);setData(saved);localStorage.setItem("rzia-preview-data",JSON.stringify(saved));notify("Website changes saved and verified.");return true}catch(e:any){notify(e.message);return false}finally{setSaving(false)}};
 const uploadAdmin=async(file:File)=>{setFileBusy(true);try{const fd=new FormData();fd.append("file",file);const r=await fetch("/api/upload",{method:"POST",headers:{Authorization:`Bearer ${adminToken}`},body:fd});const j=await r.json();if(!r.ok||!j.url)throw Error(j.message||"Upload failed");return j.url}catch(e:any){notify(e.message);return ""}finally{setFileBusy(false)}};
 const saveProduct=async()=>{if(!editProduct)return;const next=normalise({...adminData,products:adminData.products.some(p=>p.id===editProduct.id)?adminData.products.map(p=>p.id===editProduct.id?editProduct:p):[editProduct,...adminData.products]});if(await protectedSave(next)){setEditProduct(null);setTab("Products")}};
 const removeProduct=async(id:string)=>{if(!confirm("Delete this product?"))return;await protectedSave(normalise({...adminData,products:adminData.products.filter(p=>p.id!==id)}))};
 const productPrice=(p:Product)=>money(currency==="PKR"?p.price_pkr:currency==="BDT"?p.price_bdt:p.price_eur,currency);
 const navTo=(v:any)=>{setView(v);setMobileMenu(false);window.scrollTo({top:0,behavior:"smooth"})};
 

const header=<><div className="announcement">{data.announcement.active&&data.announcement.text}</div><header className="site-header"><button className="icon-button mobile-only" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Menu">{mobileMenu?<X/>:<Menu/>}</button><button className="wordmark" onClick={()=>navTo("home")}>
{data.settings.logo_url
  ? <img
      className="brand-logo"
      src={data.settings.logo_url}
      style={{ width: "42px", height: "42px", maxWidth: "42px", objectFit: "contain", flexShrink: 0 }}
      alt={data.settings.brand_name || "RZIA’S AURA"}
    />
  : <span className="monogram">RA</span>}
  <span className="wordmark-text"><span className="brand-name">{data.settings.brand_name}</span><small>{data.settings.tagline}</small><small className="founder-credit">FOUNDER &amp; OWNER · MUHAMMAD KALAM SHIKDER</small></span></button><nav className={mobileMenu?"nav-links open":"nav-links"}><button onClick={()=>{setCategory("All");navTo("home")}}>Home</button><button onClick={()=>{setCategory("Women");navTo("home")}}>Women</button><button onClick={()=>{setCategory("Men");navTo("home")}}>Men</button><button onClick={()=>{setCategory("Modest Wear");navTo("home")}}>Modest Wear</button><button onClick={()=>{setCategory("New Arrivals");navTo("home")}}>New Arrivals</button><button onClick={()=>{setInfo("Our Story");navTo("info")}}>Our Story</button></nav><div className="header-actions"><select value={currency} onChange={e=>setCurrency(e.target.value)} aria-label="Currency"><option>PKR</option><option>BDT</option><option>EUR</option></select><button className="icon-button" onClick={()=>{const s=prompt("Search RZIA’S AURA products",search);if(s!==null)setSearch(s)}} aria-label="Search"><Search/></button><button className="icon-button" onClick={()=>navTo("cart")} aria-label="Shopping bag"><ShoppingBag/><i>{bag.reduce((s,x)=>s+x.qty,0)}</i></button><button className="icon-button" onClick={()=>navTo("login")} aria-label="Admin login"><ShieldCheck/></button></div></header></>;

  if(view==="login")return <div className="admin-screen login-screen">{header}<form className="login-card" onSubmit={signIn}><span className="eyebrow">PRIVATE ACCESS</span><h1>Admin sign in</h1><p>This area is reserved for authorised store administrators.</p>{field("Username",loginUser,setLoginUser)}{field("Password",loginPass,setLoginPass,"password")}<button className="button dark full" type="submit">Sign in <ArrowRight size={16}/></button><button type="button" className="text-button" onClick={()=>navTo("home")}>Return to store</button></form></div>;
 if(view==="admin"&&adminToken)return <div className="admin-shell"><aside className="admin-sidebar"><button className="wordmark admin-wordmark" onClick={()=>navTo("home")}><span className="monogram">RA</span><span>RZIA’S AURA<small>STORE MANAGEMENT</small></span></button><div className="admin-nav">{[["Dashboard",LayoutDashboard],["Products",Package],["Collections",ImagePlus],["Homepage & brand",Settings],["Policies & FAQs",Eye]].map(([name,Icon]:any)=><button className={tab===name?"active":""} onClick={()=>setTab(name)} key={name}><Icon size={17}/>{name}</button>)}</div><button className="admin-logout" onClick={()=>{sessionStorage.removeItem("rzia-admin-token");setAdminToken("");navTo("home")}}><LogOut size={17}/> Sign out</button></aside><main className="admin-main"><div className="admin-top"><div><span className="eyebrow">STORE CONTROL</span><h1>{tab}</h1><p>Manage your storefront and publish changes.</p></div><button className="button outline" onClick={()=>navTo("home")}>View storefront <ArrowRight size={16}/></button></div>
 {tab==="Dashboard"&&<><div className="stats-grid"><div className="stat"><span>Total products</span><b>{adminData.products.length}</b></div><div className="stat"><span>Active products</span><b>{adminData.products.filter(p=>p.active!==false).length}</b></div><div className="stat"><span>Collections</span><b>{adminData.collections.length}</b></div><div className="stat"><span>Storage</span><b>Online</b></div></div><div className="admin-panel"><h2>Quick actions</h2><p>Add products, upload images and update your store content. Always check the save confirmation.</p><button className="button dark" onClick={()=>{setEditProduct({id:crypto.randomUUID(),name:"",category:"Women",description:"",price_pkr:0,price_bdt:0,price_eur:0,sizes:["S","M","L"],colors:[],stock:0,images:[],active:true,featured:false,badge:""});setTab("Products")}}>Add a product <Plus size={16}/></button></div></>}

{tab==="Products"&&<div className="admin-panel">
  <h2>Manage products</h2>
  <p>Add products, upload photos, set prices and publish them to your storefront.</p>

  <button className="button dark" onClick={()=>setEditProduct({
    id:crypto.randomUUID(),
    name:"",
    category:"Women",
    description:"",
    price_pkr:0,
    price_bdt:0,
    price_eur:0,
    sizes:["S","M","L"],
    colors:[],
    stock:0,
    images:[],
    active:true,
    featured:false,
    badge:""
  })}>
    <Plus size={16}/> Add Product
  </button>

  {editProduct&&<div className="admin-panel">
    <h2>{adminData.products.some(p=>p.id===editProduct.id)?"Edit product":"New product details"}</h2>

    {field("Product name",editProduct.name,v=>setEditProduct(p=>p?{...p,name:v}:p))}
    <label className="field">
      <span>Category</span>
      <select value={editProduct.category} onChange={e=>setEditProduct(p=>p?{...p,category:e.target.value}:p)}>
        {["Women","Dresses","Suits","Co-Ords","Abayas/Modest Wear","Men","Kurta","Shalwar Kameez","Unisex","Accessories","New Arrivals"].map(c=><option key={c} value={c}>{c}</option>)}
      </select>
    </label>

    <label className="field full-span">
      <span>Description</span>
      <textarea rows={4} value={editProduct.description} onChange={e=>setEditProduct(p=>p?{...p,description:e.target.value}:p)}/>
    </label>

    {field("Price in PKR",editProduct.price_pkr,v=>setEditProduct(p=>p?{...p,price_pkr:Number(v)}:p),"number")}
    {field("Price in BDT",editProduct.price_bdt,v=>setEditProduct(p=>p?{...p,price_bdt:Number(v)}:p),"number")}
    {field("Price in EUR",editProduct.price_eur,v=>setEditProduct(p=>p?{...p,price_eur:Number(v)}:p),"number")}
    {field("Stock quantity",editProduct.stock,v=>setEditProduct(p=>p?{...p,stock:Number(v)}:p),"number")}
    {field("Sizes (comma separated)",editProduct.sizes.join(", "),v=>setEditProduct(p=>p?{...p,sizes:v.split(",").map(s=>s.trim()).filter(Boolean)}:p))}
    {field("Colours (comma separated)",editProduct.colors.join(", "),v=>setEditProduct(p=>p?{...p,colors:v.split(",").map(s=>s.trim()).filter(Boolean)}:p))}
    {field("Product badge (e.g. New Arrival)",editProduct.badge,v=>setEditProduct(p=>p?{...p,badge:v}:p))}

    <label className="field full-span">
      <span>Product image URLs (one per line)</span>
      <textarea rows={3} placeholder="Paste image URLs, one per line" value={editProduct.images.join("\n")} onChange={e=>setEditProduct(p=>p?{...p,images:e.target.value.split("\n").map(s=>s.trim()).filter(Boolean)}:p)}/>
      <span>Or upload product photos</span>
      <input type="file" accept="image/*" multiple disabled={fileBusy} onChange={async e=>{
        const input=e.currentTarget;
        const files=Array.from(input.files||[]);
        input.value="";
        if(!files.length)return;
        if(files.some(f=>f.size>8*1024*1024)){
          notify("Each image must be smaller than 8 MB.");
          return;
        }
        setFileBusy(true);
        try{
          const urls:string[]=[];
          for(const file of files){
            const url=await uploadAdmin(file);
            if(!url)throw Error("A photo upload failed. Please try again.");
            urls.push(url);
          }
          setEditProduct(p=>p?{...p,images:[...p.images,...urls]}:p);
          notify("Photos uploaded. Press Save product.");
        }catch(err:any){
          notify(err.message||"Photo upload failed.");
        }finally{
          setFileBusy(false);
        }
      }}/>
      {fileBusy&&<p>Uploading photos…</p>}
      <div className="editor-grid">
        {editProduct.images.map((url,i)=><div key={url+i}>
          <img src={url} alt={"Product "+(i+1)} style={{width:"100%",maxHeight:"180px",objectFit:"contain"}}/>
          <button type="button" className="button outline" onClick={()=>setEditProduct(p=>p?{...p,images:p.images.filter((_,j)=>j!==i)}:p)}>Remove photo</button>
        </div>)}
      </div>
    </label>

    <label className="check-field">
      <input type="checkbox" checked={editProduct.active} onChange={e=>setEditProduct(p=>p?{...p,active:e.target.checked}:p)}/>
      Show product on website
    </label>
    <label className="check-field">
      <input type="checkbox" checked={editProduct.featured} onChange={e=>setEditProduct(p=>p?{...p,featured:e.target.checked}:p)}/>
      Featured product
    </label>

    <button className="button dark" disabled={saving||fileBusy||!editProduct.name.trim()} onClick={saveProduct}>
      <Save size={16}/>{saving?"Saving…":"Save product"}
    </button>
    <button className="button outline" onClick={()=>setEditProduct(null)}>Cancel</button>
  </div>}

  <h2>Existing products ({adminData.products.length})</h2>
  {adminData.products.length===0?<p>No products added yet. Tap Add Product to create your first item.</p>:adminData.products.map(p=><div className="faq-edit" key={p.id}>
    {imageFor(p)&&<img src={imageFor(p)} alt={p.name} style={{width:"80px",height:"100px",objectFit:"cover"}}/>}
    <div>
      <b>{p.name}</b>
      <p>{p.category} · PKR {p.price_pkr} · Stock: {p.stock}</p>
      
<button
  type="button"
  className="button outline"
  onClick={() => {
    setEditProduct({
      ...p,
      images: [...(p.images || [])],
      sizes: [...(p.sizes || [])],
      colors: [...(p.colors || [])]
    });
    setTab("Products");
  }}
>
  Edit
</button>
   <button className="button outline" onClick={()=>removeProduct(p.id)}><Trash2 size={15}/> Delete</button>
    </div>
  </div>)}
</div>}
   
{tab==="Collections"&&<div className="admin-panel">
  <h2>Manage collections</h2>
  <p>Edit each collection's name, description and image. Press Save and publish when finished.</p>

<button
  className="button dark"
  onClick={() => setAdminData(d => ({
    ...d,
    collections: [
      ...d.collections,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        image: "",
        active: true
      }
    ]
  }))}
>
  <Plus size={16} /> Add New Collection
</button>
  
  {adminData.collections.map((collection,index)=>(
    <div className="admin-panel" key={collection.id}>
      <h3>{collection.name||"Collection"}</h3>

      {field("Collection name",collection.name,v=>
        setAdminData(d=>({...d,collections:d.collections.map((c,i)=>
          i===index?{...c,name:v}:c
        )}))
      )}

      {field("Collection description",collection.description,v=>
        setAdminData(d=>({...d,collections:d.collections.map((c,i)=>
          i===index?{...c,description:v}:c
        )}))
      )}

      <label className="field full-span">
        <span>Collection image URL</span>
        <input
          type="url"
          value={collection.image||""}
          placeholder="Paste image URL"
          onChange={e=>setAdminData(d=>({...d,collections:d.collections.map((c,i)=>
            i===index?{...c,image:e.target.value}:c
          )}))}
        />

        <span>Or upload a new collection image</span>
        <input
          type="file"
          accept="image/*"
          disabled={fileBusy}
          onChange={async e=>{
            const file=e.target.files?.[0];
            if(!file)return;

            if(file.size>8*1024*1024){
              notify("Image must be smaller than 8 MB.");
              e.currentTarget.value="";
              return;
            }

            const url=await uploadAdmin(file);

            if(url){
              setAdminData(d=>({...d,collections:d.collections.map((c,i)=>
                i===index?{...c,image:url}:c
              )}));
              notify("Image uploaded. Press Save and publish.");
            }

            e.currentTarget.value="";
          }}
        />

        {collection.image&&
          <img
            src={collection.image}
            alt={collection.name}
            style={{width:"100%",maxHeight:"240px",objectFit:"cover",borderRadius:"8px",marginTop:"12px"}}
          />
        }
      </label>

      <label className="check-field">
        <input
          type="checkbox"
          checked={collection.active!==false}
          onChange={e=>setAdminData(d=>({...d,collections:d.collections.map((c,i)=>
            i===index?{...c,active:e.target.checked}:c
          )}))}
        />
        Show this collection on the website
      </label>
    </div>
  ))}

  <button
    className="button dark"
    onClick={()=>protectedSave(adminData)}
    disabled={saving}
  >
    <Save size={16}/>
    {saving?"Saving…":"Save and publish"}
  </button>
</div>}
   
{tab==="Homepage & brand"&&<div className="admin-panel">
  <h2>Homepage and brand settings</h2>
  <div className="editor-grid">
    {field("Brand name",adminData.settings.brand_name,v=>setAdminData(d=>({...d,settings:{...d.settings,brand_name:v}})))}
    {field("Tagline",adminData.settings.tagline,v=>setAdminData(d=>({...d,settings:{...d.settings,tagline:v}})))}
    {field("Hero heading",adminData.settings.hero_heading,v=>setAdminData(d=>({...d,settings:{...d.settings,hero_heading:v}})))}

    <label className="field full-span">
      <span>Hero banner image URL</span>
      <input
        type="url"
        placeholder="Paste banner image URL"
        value={adminData.settings.hero_image||""}
        onChange={e=>setAdminData(d=>({...d,settings:{...d.settings,hero_image:e.target.value}}))}
      />
      <span>Or upload a new banner photo</span>
      <input
        type="file"
        accept="image/*"
        disabled={fileBusy}
        onChange={async e=>{
          const file=e.target.files?.[0];
          if(!file)return;
          if(file.size>8*1024*1024){
            notify("Image must be smaller than 8 MB.");
            e.currentTarget.value="";
            return;
          }
          const url=await uploadAdmin(file);
          if(url){
            setAdminData(d=>({...d,settings:{...d.settings,hero_image:url}}));
            notify("Banner uploaded. Now press Save and publish.");
          }
          e.currentTarget.value="";
        }}
      />
      {fileBusy&&<span>Uploading banner...</span>}
      {adminData.settings.hero_image&&
        <img
          src={adminData.settings.hero_image}
          alt="Hero banner preview"
          style={{width:"100%",maxHeight:"280px",objectFit:"cover",borderRadius:"8px",marginTop:"12px"}}
        />
      }
    </label>

    {field("Hero text",adminData.settings.hero_text,v=>setAdminData(d=>({...d,settings:{...d.settings,hero_text:v}})))}

    <label className="field full-span">
      <span>Brand logo image URL</span>
      <input
        type="url"
        placeholder="Paste logo image URL"
        value={adminData.settings.logo_url||""}
        onChange={e=>setAdminData(d=>({...d,settings:{...d.settings,logo_url:e.target.value}}))}
      />
      <span>Or upload your logo</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        disabled={fileBusy}
        onChange={async e=>{
          const file=e.target.files?.[0];
          if(!file)return;
          if(file.size>8*1024*1024){
            notify("Logo must be smaller than 8 MB.");
            e.currentTarget.value="";
            return;
          }
          const url=await uploadAdmin(file);
          if(url){
            setAdminData(d=>({...d,settings:{...d.settings,logo_url:url}}));
            notify("Logo uploaded. Press Save and publish.");
          }
          e.currentTarget.value="";
        }}
      />
      {adminData.settings.logo_url&&
        <>
          <img
            src={adminData.settings.logo_url}
            alt="Brand logo preview"
            style={{width:"150px",maxHeight:"120px",objectFit:"contain",marginTop:"12px"}}
          />
          <button
            type="button"
            className="button outline"
            onClick={()=>setAdminData(d=>({...d,settings:{...d.settings,logo_url:""}}))}
          >
            Remove logo
          </button>
        </>
      }
    </label>

    {field("Founder name",adminData.settings.founder_name??"Muhammad Kalam",v=>setAdminData(d=>({...d,settings:{...d.settings,founder_name:v}})))}
    {field("Founder title",adminData.settings.founder_title??"Founder & Owner",v=>setAdminData(d=>({...d,settings:{...d.settings,founder_title:v}})))}

<label className="field full-span">
  <span>Founder photo URL</span>
  <input
    type="url"
    placeholder="Paste founder photo URL"
    value={adminData.settings.founder_image || ""}
    onChange={e =>
      setAdminData(d => ({
        ...d,
        settings: {
          ...d.settings,
          founder_image: e.target.value
        }
      }))
    }
  />

  <span>Or upload founder photo</span>
  <input
    type="file"
    accept="image/*"
    disabled={fileBusy}
    onChange={async e => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 8 * 1024 * 1024) {
        notify("Image must be smaller than 8 MB.");
        e.currentTarget.value = "";
        return;
      }

      const url = await uploadAdmin(file);

      if (url) {
        setAdminData(d => ({
          ...d,
          settings: {
            ...d.settings,
            founder_image: url
          }
        }));
        notify("Founder photo uploaded. Press Save and publish.");
      }

      e.currentTarget.value = "";
    }}
  />

  {adminData.settings.founder_image && (
    <img
      src={adminData.settings.founder_image}
      alt="Founder preview"
      style={{
        width: "100%",
        maxWidth: "320px",
        maxHeight: "360px",
        objectFit: "cover",
        borderRadius: "8px",
        marginTop: "12px"
      }}
    />
  )}
</label>
    
    <label className="field full-span">
      <span>Founder introduction</span>
      <textarea
        rows={4}
        value={adminData.settings.founder_intro??""}
        onChange={e=>setAdminData(d=>({...d,settings:{...d.settings,founder_intro:e.target.value}}))}
      />
    </label>

    {field("WhatsApp number (international format)",adminData.settings.whatsapp,v=>setAdminData(d=>({...d,settings:{...d.settings,whatsapp:v}})))}
    {field("Email",adminData.settings.email,v=>setAdminData(d=>({...d,settings:{...d.settings,email:v}})))}
    {field("Address",adminData.settings.address,v=>setAdminData(d=>({...d,settings:{...d.settings,address:v}})))}
    {field("Instagram URL",adminData.settings.instagram,v=>setAdminData(d=>({...d,settings:{...d.settings,instagram:v}})))}
    {field("Facebook URL",adminData.settings.facebook,v=>setAdminData(d=>({...d,settings:{...d.settings,facebook:v}})))}
    {field("TikTok URL",adminData.settings.tiktok,v=>setAdminData(d=>({...d,settings:{...d.settings,tiktok:v}})))}
    
{field("Delivery charges (PKR)",adminData.settings.delivery_charges_pkr,v=>setAdminData(d=>({...d,settings:{...d.settings,delivery_charges_pkr:Number(v)}})),"number")}


{field("Free delivery threshold (PKR)",adminData.settings.free_delivery_above_pkr,v=>setAdminData(d=>({...d,settings:{...d.settings,free_delivery_above_pkr:Number(v)}})),"number")}

    <label className="field full-span">
      <span>About / Our Story</span>
      <textarea
        rows={4}
        value={adminData.settings.about_text||""}
        onChange={e=>setAdminData(d=>({...d,settings:{...d.settings,about_text:e.target.value}}))}
      />
    </label>

    <label className="field full-span">
      <span>Announcement bar</span>
      <input
        value={adminData.announcement.text}
        onChange={e=>setAdminData(d=>({...d,announcement:{...d.announcement,text:e.target.value}}))}
      />
    </label>

    <label className="check-field">
      <input
        type="checkbox"
        checked={adminData.announcement.active}
        onChange={e=>setAdminData(d=>({...d,announcement:{...d.announcement,active:e.target.checked}}))}
      />
      Show announcement
    </label>
  </div>

  <button className="button dark" onClick={()=>protectedSave(adminData)} disabled={saving}>
    <Save size={16}/>{saving?"Saving…":"Save and publish"}
  </button>
</div>}
  {tab==="Policies & FAQs"&&<div className="admin-panel"><h2>Policies</h2>{["shipping_information","return_policy","privacy_policy","footer_text"].map(k=><label className="field" key={k}><span>{k.replace(/ /g, "-")}</span><textarea rows={3} value={adminData.settings[k]||""} onChange={e=>setAdminData(d=>({...d,settings:{...d.settings,[k]:e.target.value}}))}/></label>)}<h2>FAQs</h2>{adminData.faqs.map((f,i)=><div className="faq-edit" key={f.id}>{field("Question",f.question,v=>setAdminData(d=>({...d,faqs:d.faqs.map((x,j)=>i===j?{...x,question:v}:x)})))}{field("Answer",f.answer,v=>setAdminData(d=>({...d,faqs:d.faqs.map((x,j)=>i===j?{...x,answer:v}:x)})))}<button className="icon-button danger" onClick={()=>setAdminData(d=>({...d,faqs:d.faqs.filter(x=>x.id!==f.id)}))}><Trash2/></button></div>)}<button className="button outline" onClick={()=>setAdminData(d=>({...d,faqs:[...d.faqs,{id:crypto.randomUUID(),question:"New question",answer:"Answer"}]}))}><Plus size={16}/> Add FAQ</button><div className="editor-actions"><button className="button dark" onClick={()=>protectedSave(adminData)} disabled={saving}><Save size={16}/> Save policies</button></div></div>}
 </main></div>;
 if(view==="cart")return <>{header}<main className="content-page"><span className="eyebrow">YOUR SELECTION</span><h1>Shopping bag</h1>{bag.length===0?<div className="empty-state">Your bag is waiting for something beautiful.</div>:<div className="cart-layout"><div>{bag.map((item,i)=>{const p=data.products.find(x=>x.id===item.id);if(!p)return null;return <div className="cart-item" key={item.id+item.size}><img src={imageFor(p)} alt=""/><div><h3>{p.name}</h3><p>Size: {item.size||"Not selected"}</p><b>{productPrice(p)}</b><div className="qty-control"><button onClick={()=>setBag(b=>b.map((x,j)=>j===i?{...x,qty:Math.max(1,x.qty-1)}:x))}><Minus size={14}/></button>{item.qty}<button onClick={()=>setBag(b=>b.map((x,j)=>j===i?{...x,qty:x.qty+1}:x))}><Plus size={14}/></button><button onClick={()=>setBag(b=>b.filter((_,j)=>j!==i))}><Trash2 size={14}/></button></div></div></div>})}</div><aside className="cart-summary"><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><b>{money(total,currency)}</b></div>{field("Full name",checkoutName,setCheckoutName)}{field("Phone / WhatsApp",checkoutPhone,setCheckoutPhone)}<label className="field"><span>Delivery address</span><textarea rows={3} value={checkoutAddress} onChange={e=>setCheckoutAddress(e.target.value)}/></label><button className="button dark full" onClick={()=>{const msg=`RZIA'S AURA ORDER%0A${bag.map(it=>{const p=data.products.find(x=>x.id===it.id);return `${p?.name} x${it.qty} (size ${it.size})`}).join("%0A")}%0ATotal: ${money(total,currency)}%0AName: ${checkoutName}%0APhone: ${checkoutPhone}%0AAddress: ${checkoutAddress}`;if(!data.settings.whatsapp){notify("Please configure the store WhatsApp number in admin settings.");return}window.open(`https://wa.me/${data.settings.whatsapp.replace(/\\D/g,"")}?text=${msg}`,"_blank")}}>Order via WhatsApp <MessageCircle size={16}/></button><p className="small-note">WhatsApp checkout sends your order details to the store for confirmation. Online card payments are not configured in this starter project.</p></aside></div>}</main></>;
 if(view==="product"&&selected)return <>{header}<main className="product-detail"><div className="detail-image">{selected.images?.[0]?<img src={selected.images[0]} alt={selected.name}/>:<div className="placeholder-image">RZIA’S AURA</div>}</div><div className="detail-copy"><span className="eyebrow">{selected.category}</span><h1>{selected.name}</h1><div className="detail-price">{productPrice(selected)}</div><p>{selected.description}</p><p><b>Available sizes:</b> {selected.sizes?.join(", ")||"Contact us"}</p><p><b>Colours:</b> {selected.colors?.join(", ")||"As pictured"}</p><p><b>Stock:</b> {selected.stock>0?`${selected.stock} available`:"Contact us for availability"}</p><button className="button dark full" onClick={()=>{if(selected.stock<=0){notify("Please contact us for stock availability.");return}const size=selected.sizes?.[0]||"One size";setBag(b=>[...b,{id:selected.id,qty:1,size}]);notify("Added to bag.");navTo("cart")}}>Add to bag <ShoppingBag size={16}/></button><button className="button outline full" onClick={()=>setWish(w=>w.includes(selected.id)?w.filter(x=>x!==selected.id):[...w,selected.id])}><Heart size={16}/>{wish.includes(selected.id)?"Saved to wishlist":"Add to wishlist"}</button><div className="detail-accordion"><h3>Delivery & care</h3><p>{data.settings.shipping_information}</p><h3>Returns & exchanges</h3><p>{data.settings.return_policy}</p></div></div></main></>;
 if(view==="info")return <>{header}<main className="content-page"><span className="eyebrow">RZIA’S AURA</span><h1>{info}</h1>
{info === "Our Story" && (
  <section className="founder-section">
    
    {data.settings.founder_image && (
      <img
        src={data.settings.founder_image}
        alt={data.settings.founder_name || "Founder of RZIA’S AURA"}
        style={{
          width: "100%",
          maxWidth: "340px",
          maxHeight: "420px",
          objectFit: "cover",
          borderRadius: "10px",
          margin: "16px 0"
        }}
      />
    )}
    
    <span className="eyebrow">MEET THE FOUNDER</span>
    <h2>
      {data.settings.founder_name || "Muhammad Kalam"}
    </h2>
    <p>
      {data.settings.founder_title || "Founder & Owner"}
    </p>
    {data.settings.founder_intro && (
      <p>{data.settings.founder_intro}</p>
    )}
  </section>
)}
   <p className="info-copy">{info==="Our Story"?data.settings.about_text:info==="FAQs"?data.faqs.map(f=>`${f.question}\n${f.answer}`).join("\n\n"):info==="Contact"?`${data.settings.address}\n${data.settings.email}\n${data.settings.whatsapp}`:info==="Shipping"?data.settings.shipping_information:info==="Returns"?data.settings.return_policy:data.settings.privacy_policy}</p>{info==="FAQs"&&data.faqs.map(f=><details className="faq" key={f.id}><summary>{f.question}<ChevronDown size={16}/></summary><p>{f.answer}</p></details>)}</main></>;
 return <>{header}<main><section className="hero" style={{backgroundImage:`linear-gradient(90deg,rgba(28,20,15,.64),rgba(28,20,15,.04)),url("${data.settings.hero_image}")`}}><div className="hero-content"><span className="eyebrow light">THE WORLD OF RZIA’S AURA</span><h1>{data.settings.hero_heading.split("\\n").map((x:string,i:number)=><React.Fragment key={i}>{i>0&&<br/>}{x}</React.Fragment>)}</h1><p>{data.settings.hero_text}</p><button className="button light-button" onClick={()=>document.getElementById("shop")?.scrollIntoView({behavior:"smooth"})}>Explore the collection <ArrowRight size={16}/></button></div><div className="hero-caption">A STUDY IN TIMELESS STYLE</div></section><section className="trust-strip"><span>Thoughtfully selected</span><i/> <span>Designed for everyday elegance</span><i/> <span>Made to be remembered</span></section><section className="section collections-section"><div className="section-heading"><div><span className="eyebrow">CURATED FOR YOU</span><h2>Explore our world</h2></div><p>Pieces to make every moment feel considered.</p></div><div className="collection-grid">{data.collections.filter(c=>c.active!==false).map(c=><button className="collection-card" key={c.id} onClick={()=>{setCategory(c.name);document.getElementById("shop")?.scrollIntoView({behavior:"smooth"})}}><img src={c.image} alt={c.name}/><span><b>{c.name}</b><small>{c.description}</small><i>Discover <ArrowRight size={14}/></i></span></button>)}</div></section><section id="shop" className="section shop-section"><div className="section-heading"><div><span className="eyebrow">THE EDIT</span><h2>Discover the collection</h2></div><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search pieces…"/></label></div><div className="category-chips">{["All","Women","Men","Unisex","Modest Wear","Accessories","New Arrivals"].map(c=><button key={c} className={category===c?"selected":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>{loading?<div className="empty-state"><RefreshCw className="spin"/> Loading collection…</div>:products.length===0?<div className="empty-state"><span className="eyebrow">THE COLLECTION IS GROWING</span><h3>{search?"No pieces match your search":"Your next favourite piece belongs here."}</h3><p>Visit us again soon, or check back after our next collection launch.</p></div>:<div className="product-grid">{products.map(p=><article className="product-card" key={p.id}><button className="product-photo" onClick={()=>{setSelected(p);navTo("product")}}>{imageFor(p)?<img src={imageFor(p)} alt={p.name}/>:<div className="placeholder-image">RZIA’S AURA</div>}{p.badge&&<span className="product-badge">{p.badge}</span>}<button className="heart-button" onClick={e=>{e.stopPropagation();setWish(w=>w.includes(p.id)?w.filter(x=>x!==p.id):[...w,p.id])}} aria-label="Wishlist"><Heart size={17} fill={wish.includes(p.id)?"currentColor":"none"}/></button></button><div className="product-meta"><span>{p.category}</span><button onClick={()=>{setSelected(p);navTo("product")}}>{p.name}</button><div><b>{productPrice(p)}</b>{p.stock<=0&&<small>Sold out</small>}</div></div></article>)}</div>}</section><section className="story-band"><div><span className="eyebrow light">OUR PHILOSOPHY</span><h2>Elegance is not a moment.<br/>It is an attitude.</h2><p>{data.settings.about_text}</p><button className="button light-button" onClick={()=>{setInfo("Our Story");navTo("info")}}>Discover our story <ArrowRight size={16}/></button></div><div className="story-image" style={{backgroundImage:`url("${data.settings.hero_image}")`}}/></section><section className="newsletter"><span className="eyebrow">A NOTE FROM THE AURA</span><h2>Stay close to the new.</h2><p>Discover new arrivals, edits and stories from RZIA’S AURA.</p><form onSubmit={e=>{e.preventDefault();notify("Thank you for your interest. Newsletter delivery requires an email marketing provider.");}}><input type="email" placeholder="Your email address" required/><button className="button dark" type="submit">Join the list <ArrowRight size={16}/></button></form></section></main><footer className="site-footer"><div className="footer-brand"><span className="monogram">RA</span><h2>{data.settings.brand_name}</h2><p>{data.settings.footer_text}</p><div className="social-links">{data.settings.instagram&&<a href={data.settings.instagram} target="_blank" rel="noreferrer"><Instagram/></a>}{data.settings.facebook&&<a href={data.settings.facebook} target="_blank" rel="noreferrer">f</a>}{data.settings.tiktok&&<a href={data.settings.tiktok} target="_blank" rel="noreferrer">♪</a>}</div></div><div className="footer-links"><div><b>EXPLORE</b>{["Our Story","FAQs","Contact"].map(x=><button key={x} onClick={()=>{setInfo(x);navTo("info")}}>{x}</button>)}</div><div><b>HELP & POLICIES</b>{["Shipping","Returns","Privacy Policy"].map(x=><button key={x} onClick={()=>{setInfo(x);navTo("info")}}>{x}</button>)}</div><div><b>CONTACT</b><span>{data.settings.email}</span><span>{data.settings.address}</span>{data.settings.whatsapp&&<a href={`https://wa.me/${data.settings.whatsapp.replace(/\\D/g,"")}`}><MessageCircle size={15}/> WhatsApp us</a>}</div></div><div className="copyright">© {new Date().getFullYear()} {data.settings.brand_name}. All rights reserved.</div><button className="admin-footer" onClick={()=>navTo("login")}>Store administration</button></footer>{notice&&<div className="toast">{notice}</div>}</>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
