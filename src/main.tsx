
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, Search, ShoppingBag, Heart, Menu, X, ShieldCheck,
  Instagram, MessageCircle, ChevronDown, Plus, Minus, Trash2,
  ImagePlus, Save, Package, Settings, LayoutDashboard, LogOut,
  Upload, Eye, EyeOff, RefreshCw
} from "lucide-react";
import "./styles.css";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price_pkr: number;
  price_bdt: number;
  price_eur: number;
  sizes: string[];
  colors: string[];
  stock: number;
  images: string[];
  active: boolean;
  featured: boolean;
  badge: string;
};

type Collection = {
  id: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
};

type StoreData = {
  products: Product[];
  collections: Collection[];
  settings: Record<string, any>;
  announcement: { text: string; active: boolean };
  faqs: { id: string; question: string; answer: string }[];
};

const defaultData: StoreData = {
  products: [],
  collections: [
    {
      id: "women",
      name: "Women",
      description: "Modern silhouettes, timeless grace.",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",
      active: true
    },
    {
      id: "men",
      name: "Men",
      description: "Refined essentials for every day.",
      image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1000&q=85",
      active: true
    },
    {
      id: "modest",
      name: "Modest Wear",
      description: "Elegance in every detail.",
      image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=1000&q=85",
      active: true
    }
  ],
  settings: {
    brand_name: "RZIA’S AURA",
    tagline: "THE AURA OF ELEGANCE",
    hero_heading: "Elegance,\\nRedefined.",
    hero_text: "Thoughtfully selected fashion for the way you move through the world.",
    hero_image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2200&q=90",
    logo_url: "",
    about_text: "RZIA’S AURA celebrates modern elegance through considered design, expressive details and timeless style.",
    whatsapp: "",
    email: "",
    address: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    delivery_charges_pkr: 250,
    free_delivery_above_pkr: 5000,
    shipping_information: "Orders are processed after confirmation. Delivery timelines may vary by destination.",
    return_policy: "Please contact our team promptly if your order arrives damaged or incorrect.",
    privacy_policy: "We use customer information only to process and support orders.",
    footer_text: "Where elegance becomes an attitude."
  },
  announcement: {
    text: "WELCOME TO RZIA’S AURA — THE AURA OF ELEGANCE",
    active: true
  },
  faqs: [
    {
      id: "f1",
      question: "How do I place an order?",
      answer: "Add your favourite items to the bag and follow the checkout instructions, or contact us on WhatsApp."
    },
    {
      id: "f2",
      question: "How can I check my size?",
      answer: "Review the size options on each product and contact our team if you need guidance."
    },
    {
      id: "f3",
      question: "How can I contact customer support?",
      answer: "Use the contact details in the footer or the WhatsApp button when enabled."
    }
  ]
};

const money = (v: number, c: string) =>
  new Intl.NumberFormat(
    c === "EUR" ? "de-DE" : c === "BDT" ? "en-BD" : "en-PK",
    {
      style: "currency",
      currency: c === "EUR" ? "EUR" : c === "BDT" ? "BDT" : "PKR",
      maximumFractionDigits: c === "EUR" ? 2 : 0
    }
  ).format(Number(v || 0));

const normalise = (d: any): StoreData => ({
  ...defaultData,
  ...(d || {}),
  products: Array.isArray(d?.products)
    ? d.products.map((p: any) => ({
        ...p,
        images: Array.isArray(p.images)
          ? p.images
          : p.image_url
            ? [p.image_url]
            : Array.isArray(p.image_urls)
              ? p.image_urls
              : [],
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        colors: Array.isArray(p.colors) ? p.colors : []
      }))
    : [],
  collections: Array.isArray(d?.collections)
    ? d.collections.map((c: any) => ({
        ...c,
        image: c.image || c.image_url || ""
      }))
    : defaultData.collections,
  settings: {
    ...defaultData.settings,
    ...(d?.settings || {})
  },
  announcement: {
    ...defaultData.announcement,
    ...(d?.announcement || {})
  },
  faqs: Array.isArray(d?.faqs) ? d.faqs : defaultData.faqs
});

async function apiData(): Promise<StoreData> {
  try {
    const r = await fetch("/api/data", { cache: "no-store" });
    if (!r.ok) throw new Error("Could not load online store data.");
    return normalise(await r.json());
  } catch {
    try {
      const cached = localStorage.getItem("rzia-preview-data");
      return normalise(cached ? JSON.parse(cached) : defaultData);
    } catch {
      return normalise(defaultData);
    }
  }
}

async function saveData(data: StoreData, token: string) {
  const r = await fetch("/api/admin/data", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  const j = await r.json().catch(() => ({}));

  if (!r.ok || j.success !== true) {
    throw new Error(j.message || "Online save failed. Please try again.");
  }

  return j.data ? normalise(j.data) : normalise(data);
}

function imageFor(p: Product) {
  return p.images?.[0] || "";
}

function App() {
  const [data, setData] = useState<StoreData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("PKR");
  const [bag, setBag] = useState<{ id: string; qty: number; size: string }[]>([]);
  const [wish, setWish] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [view, setView] = useState<"home" | "admin" | "login" | "product" | "cart" | "info">("home");
  const [selected, setSelected] = useState<Product | null>(null);
  const [info, setInfo] = useState("Our Story");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [adminToken, setAdminToken] = useState(sessionStorage.getItem("rzia-admin-token") || "");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("Dashboard");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [adminData, setAdminData] = useState<StoreData>(defaultData);
  const [fileBusy, setFileBusy] = useState(false);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");

  useEffect(() => {
    apiData()
      .then(d => {
        setData(d);
        setAdminData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (view === "admin" && adminToken) {
      apiData().then(setAdminData);
    }
  }, [view, adminToken]);

  const products = useMemo(
    () =>
      data.products.filter(
        p =>
          p.active !== false &&
          (category === "All" ||
            p.category === category ||
            (category === "New Arrivals" && p.badge?.toLowerCase().includes("new"))) &&
          `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(search.toLowerCase())
      ),
    [data, category, search]
  );

  const total = bag.reduce((sum, item) => {
    const p = data.products.find(x => x.id === item.id);
    return sum + (p ? Number((currency === "PKR" ? p.price_pkr : currency === "BDT" ? p.price_bdt : p.price_eur) || 0) * item.qty : 0);
  }, 0);

  const notify = (s: string) => {
    setNotice(s);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const field = (
    label: string,
    value: any,
    onChange: (v: string) => void,
    type = "text"
  ) => (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );

  const protectedSave = async (next: StoreData) => {
    setSaving(true);
    try {
      const saved = await saveData(normalise(next), adminToken);
      setAdminData(saved);
      setData(saved);
      localStorage.setItem("rzia-preview-data", JSON.stringify(saved));
      notify("Website changes saved and verified.");
      return true;
    } catch (e: any) {
      notify(e.message || "Online save failed.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadAdmin = async (file: File): Promise<string> => {
    setFileBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const r = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`
        },
        body: fd
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) {
        throw new Error(j.message || "Image upload failed.");
      }

      return j.url;
    } catch (e: any) {
      notify(e.message || "Image upload failed.");
      return "";
    } finally {
      setFileBusy(false);
    }
  };

  const uploadSettingImage = async (
    file: File,
    setting: "hero_image" | "logo_url"
  ) => {
    const url = await uploadAdmin(file);
    if (!url) return;

    setAdminData(d =>
      normalise({
        ...d,
        settings: { ...d.settings, [setting]: url }
      })
    );
    notify("Image uploaded. Press Save and publish to apply it.");
  };

  const uploadCollectionImage = async (file: File, collectionId: string) => {
    const url = await uploadAdmin(file);
    if (!url) return;

    setAdminData(d =>
      normalise({
        ...d,
        collections: d.collections.map(c =>
          c.id === collectionId ? { ...c, image: url } : c
        )
      })
    );
    notify("Collection image uploaded. Save collections to publish it.");
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUser,
          password: loginPass
        })
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.token) {
        throw new Error(j.message || "Login failed.");
      }

      sessionStorage.setItem("rzia-admin-token", j.token);
      setAdminToken(j.token);
      setView("admin");
      notify("Admin login successful.");
    } catch (err: any) {
      notify(err.message || "Login failed. Check your Netlify settings.");
    }
  };

  const saveProduct = async () => {
    if (!editProduct) return;

    if (!editProduct.name.trim()) {
      notify("Please enter a product name.");
      return;
    }

    const next = normalise({
      ...adminData,
      products: adminData.products.some(p => p.id === editProduct.id)
        ? adminData.products.map(p => p.id === editProduct.id ? editProduct : p)
        : [editProduct, ...adminData.products]
    });

    if (await protectedSave(next)) {
      setEditProduct(null);
      setTab("Products");
    }
  };

  const removeProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    await protectedSave(
      normalise({
        ...adminData,
        products: adminData.products.filter(p => p.id !== id)
      })
    );
  };

  const productPrice = (p: Product) =>
    money(
      currency === "PKR" ? p.price_pkr : currency === "BDT" ? p.price_bdt : p.price_eur,
      currency
    );

  const navTo = (v: any) => {
    setView(v);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const newProduct = (): Product => ({
    id: crypto.randomUUID(),
    name: "",
    category: "Women",
    description: "",
    price_pkr: 0,
    price_bdt: 0,
    price_eur: 0,
    sizes: ["S", "M", "L"],
    colors: [],
    stock: 0,
    images: [],
    active: true,
    featured: false,
    badge: ""
  });

  const header = (
    <>
      <div className="announcement">
        {data.announcement.active && data.announcement.text}
      </div>

      <header className="site-header">
        <button
          className="icon-button mobile-only"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Menu"
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>

        <button className="wordmark" onClick={() => navTo("home")}>
          <span className="monogram">RA</span>
          <span>
            {data.settings.brand_name}
            <small>{data.settings.tagline}</small>
          </span>
        </button>

        <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
          {["Home", "Women", "Men", "Modest Wear", "New Arrivals"].map(item => (
            <button
              key={item}
              onClick={() => {
                setCategory(item === "Home" ? "All" : item);
                navTo("home");
              }}
            >
              {item}
            </button>
          ))}
          <button
            onClick={() => {
              setInfo("Our Story");
              navTo("info");
            }}
          >
            Our Story
          </button>
        </nav>

        <div className="header-actions">
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            aria-label="Currency"
          >
            <option>PKR</option>
            <option>BDT</option>
            <option>EUR</option>
          </select>

          <button className="icon-button" onClick={() => {
            const s = prompt("Search RZIA’S AURA products", search);
            if (s !== null) setSearch(s);
          }} aria-label="Search">
            <Search />
          </button>

          <button className="icon-button" onClick={() => navTo("cart")} aria-label="Shopping bag">
            <ShoppingBag />
            <i>{bag.reduce((s, x) => s + x.qty, 0)}</i>
          </button>

          <button className="icon-button" onClick={() => navTo("login")} aria-label="Admin login">
            <ShieldCheck />
          </button>
        </div>
      </header>
    </>
  );

  if (view === "login") {
    return (
      <div className="admin-screen login-screen">
        {header}
        <form className="login-card" onSubmit={signIn}>
          <span className="eyebrow">PRIVATE ACCESS</span>
          <h1>Admin sign in</h1>
          <p>This area is reserved for authorised store administrators.</p>
          {field("Username", loginUser, setLoginUser)}
          {field("Password", loginPass, setLoginPass, "password")}
          <button className="button dark full" type="submit">
            Sign in <ArrowRight size={16} />
          </button>
          <button type="button" className="text-button" onClick={() => navTo("home")}>
            Return to store
          </button>
        </form>
      </div>
    );
  }

  if (view === "admin" && adminToken) {
    return (
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <button className="wordmark admin-wordmark" onClick={() => navTo("home")}>
            <span className="monogram">RA</span>
            <span>RZIA’S AURA<small>STORE MANAGEMENT</small></span>
          </button>

          <div className="admin-nav">
            {[
              ["Dashboard", LayoutDashboard],
              ["Products", Package],
              ["Collections", ImagePlus],
              ["Homepage & brand", Settings],
              ["Policies & FAQs", Eye]
            ].map(([name, Icon]: any) => (
              <button
                className={tab === name ? "active" : ""}
                onClick={() => setTab(name)}
                key={name}
              >
                <Icon size={17} /> {name}
              </button>
            ))}
          </div>

          <button
            className="admin-logout"
            onClick={() => {
              sessionStorage.removeItem("rzia-admin-token");
              setAdminToken("");
              navTo("home");
            }}
          >
            <LogOut size={17} /> Sign out
          </button>
        </aside>

        <main className="admin-main">
          <div className="admin-top">
            <div>
              <span className="eyebrow">STORE CONTROL</span>
              <h1>{tab}</h1>
              <p>Manage your storefront and publish changes.</p>
            </div>
            <button className="button outline" onClick={() => navTo("home")}>
              View storefront <ArrowRight size={16} />
            </button>
          </div>

          {tab === "Dashboard" && (
            <>
              <div className="stats-grid">
                <div className="stat"><span>Total products</span><b>{adminData.products.length}</b></div>
                <div className="stat"><span>Active products</span><b>{adminData.products.filter(p => p.active !== false).length}</b></div>
                <div className="stat"><span>Collections</span><b>{adminData.collections.length}</b></div>
                <div className="stat"><span>Storage</span><b>Online</b></div>
              </div>
              <div className="admin-panel">
                <h2>Quick actions</h2>
                <p>Add products, upload images and update your store content. Always check the save confirmation.</p>
                <button className="button dark" onClick={() => { setEditProduct(newProduct()); setTab("Products"); }}>
                  Add a product <Plus size={16} />
                </button>
              </div>
            </>
          )}

          {tab === "Products" && (
            <>
              <div className="panel-toolbar">
                <p>{adminData.products.length} products in catalogue</p>
                <button className="button dark" onClick={() => setEditProduct(newProduct())}>
                  <Plus size={16} /> Add product
                </button>
              </div>

              {editProduct && (
                <div className="admin-panel product-editor">
                  <div className="panel-title">
                    <h2>{adminData.products.some(p => p.id === editProduct.id) ? "Edit product" : "New product"}</h2>
                    <button className="icon-button" onClick={() => setEditProduct(null)}><X /></button>
                  </div>

                  <div className="editor-grid">
                    {field("Product name", editProduct.name, v => setEditProduct({ ...editProduct, name: v }))}
                    <label className="field">
                      <span>Category</span>
                      <select value={editProduct.category} onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}>
                        {["Women", "Men", "Kids", "Unisex", "Modest Wear", "Accessories", "New Arrivals"].map(x => <option key={x}>{x}</option>)}
                      </select>
                    </label>
                    {field("Price (PKR)", editProduct.price_pkr, v => setEditProduct({ ...editProduct, price_pkr: Number(v) }), "number")}
                    {field("Price (BDT)", editProduct.price_bdt, v => setEditProduct({ ...editProduct, price_bdt: Number(v) }), "number")}
                    {field("Price (EUR)", editProduct.price_eur, v => setEditProduct({ ...editProduct, price_eur: Number(v) }), "number")}
                    {field("Stock quantity", editProduct.stock, v => setEditProduct({ ...editProduct, stock: Number(v) }), "number")}
                    {field("Sizes (comma separated)", editProduct.sizes.join(", "), v => setEditProduct({ ...editProduct, sizes: v.split(",").map(x => x.trim()).filter(Boolean) }))}
                    {field("Colours (comma separated)", editProduct.colors.join(", "), v => setEditProduct({ ...editProduct, colors: v.split(",").map(x => x.trim()).filter(Boolean) }))}
                    {field("Badge (e.g. New / Sale)", editProduct.badge, v => setEditProduct({ ...editProduct, badge: v }))}

                    <label className="field full-span">
                      <span>Description</span>
                      <textarea rows={4} value={editProduct.description} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} />
                    </label>

                    <label className="check-field">
                      <input type="checkbox" checked={editProduct.active} onChange={e => setEditProduct({ ...editProduct, active: e.target.checked })} />
                      Visible on storefront
                    </label>
                    <label className="check-field">
                      <input type="checkbox" checked={editProduct.featured} onChange={e => setEditProduct({ ...editProduct, featured: e.target.checked })} />
                      Featured product
                    </label>

                    <div className="image-upload full-span">
                      <span>Product photos</span>
                      <div className="upload-previews">
                        {editProduct.images.map((src, i) => (
                          <div key={src + i}>
                            <img src={src} alt="Product" />
                            <button type="button" onClick={() => setEditProduct(p => p ? { ...p, images: p.images.filter((_, j) => j !== i) } : p)} aria-label="Remove image">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <label className="upload-button">
                        <Upload size={16} /> {fileBusy ? "Uploading…" : "Upload photos"}
                        <input type="file" accept="image/*" multiple disabled={fileBusy} onChange={async e => {
                          const input = e.currentTarget;
                          const files = Array.from(input.files || []);
                          const urls: string[] = [];
                          for (const file of files) {
                            const url = await uploadAdmin(file);
                            if (url) urls.push(url);
                          }
                          if (urls.length) setEditProduct(p => p ? { ...p, images: [...p.images, ...urls] } : p);
                          input.value = "";
                        }} />
                      </label>
                      <small>After uploading, press Save product to publish the product and its images.</small>
                    </div>
                  </div>

                  <div className="editor-actions">
                    <button className="button outline" onClick={() => setEditProduct(null)}>Cancel</button>
                    <button className="button dark" disabled={saving || fileBusy} onClick={saveProduct}>
                      <Save size={16} /> {saving ? "Saving…" : "Save product"}
                    </button>
                  </div>
                </div>
              )}

              <div className="admin-panel table-panel">
                <div className="admin-table">
                  {adminData.products.map(p => (
                    <div className="product-row" key={p.id}>
                      <img src={imageFor(p) || "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=150&q=70"} alt="" />
                      <div className="row-name">
                        <b>{p.name || "Untitled product"}</b>
                        <span>{p.category} · Stock {p.stock}</span>
                      </div>
                      <b>{money(p.price_pkr, "PKR")}</b>
                      <span className={p.active === false ? "pill off" : "pill"}>{p.active === false ? "Hidden" : "Visible"}</span>
                      <button className="icon-button" onClick={() => setEditProduct({ ...p, images: [...(p.images || [])] })} aria-label="Edit"><Settings size={17} /></button>
                      <button className="icon-button danger" onClick={() => removeProduct(p.id)} aria-label="Delete"><Trash2 size={17} /></button>
                    </div>
                  ))}
                  {!adminData.products.length && <div className="empty-state">No products yet. Add your first product above.</div>}
                </div>
              </div>
            </>
          )}

          {tab === "Collections" && (
            <div className="admin-panel">
              <h2>Collections</h2>
              {adminData.collections.map(c => (
                <div className="collection-edit" key={c.id}>
                  <div className="collection-image-editor">
                    <img src={c.image} alt={c.name} />
                    <label className="upload-button">
                      <Upload size={16} /> {fileBusy ? "Uploading…" : "Change image"}
                      <input type="file" accept="image/*" disabled={fileBusy} onChange={async e => {
                        const input = e.currentTarget;
                        const file = input.files?.[0];
                        if (file) await uploadCollectionImage(file, c.id);
                        input.value = "";
                      }} />
                    </label>
                    
                  </div>
                  <div>
                    {field("Name", c.name, v =>
                      setAdminData(d =>
                        normalise({
                          ...d,
                          collections: d.collections.map(x =>
                            x.id === c.id ? { ...x, name: v } : x
                          )
                        })
                      )
                    )}
                    {field("Description", c.description, v =>
                      setAdminData(d =>
                        normalise({
                          ...d,
                          collections: d.collections.map(x =>
                            x.id === c.id ? { ...x, description: v } : x
                          )
                        })
                      )
                    )}
                    <label className="check-field">
                      <input
                        type="checkbox"
                        checked={c.active !== false}
                        onChange={e =>
                          setAdminData(d =>
                            normalise({
                              ...d,
                              collections: d.collections.map(x =>
                                x.id === c.id
                                  ? { ...x, active: e.target.checked }
                                  : x
                              )
                            })
                          )
                        }
                      />
                      Show collection
                    </label>
                  </div>
                  <button
                    className="icon-button danger"
                    onClick={() =>
                      setAdminData(d =>
                        normalise({
                          ...d,
                          collections: d.collections.filter(x => x.id !== c.id)
                        })
                      )
                    }
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}

              <button
                className="button outline"
                onClick={() =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      collections: [
                        ...d.collections,
                        {
                          id: crypto.randomUUID(),
                          name: "New Collection",
                          description: "",
                          image: "",
                          active: true
                        }
                      ]
                    })
                  )
                }
              >
                <Plus size={16} /> Add collection
              </button>

              <div className="editor-actions">
                <button
                  className="button dark"
                  onClick={() => protectedSave(adminData)}
                  disabled={saving || fileBusy}
                >
                  <Save size={16} />
                  {saving ? "Saving…" : "Save collections"}
                </button>
              </div>
            </div>
          )}

          {tab === "Homepage & brand" && (
            <div className="admin-panel">
              <h2>Homepage and brand settings</h2>
              <div className="editor-grid">
                {field("Brand name", adminData.settings.brand_name, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, brand_name: v }
                    })
                  )
                )}
                {field("Tagline", adminData.settings.tagline, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, tagline: v }
                    })
                  )
                )}
                {field("Hero heading", adminData.settings.hero_heading, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, hero_heading: v }
                    })
                  )
                )}
                {field("Hero text", adminData.settings.hero_text, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, hero_text: v }
                    })
                  )
                )}

                <div className="image-upload full-span">
                  <span>Homepage hero image</span>
                  {adminData.settings.hero_image && (
                    <img
                      className="setting-image-preview"
                      src={adminData.settings.hero_image}
                      alt="Hero preview"
                    />
                  )}
                  <label className="upload-button">
                    <Upload size={16} />
                    {fileBusy ? "Uploading…" : "Upload hero image"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={fileBusy}
                      onChange={async e => {
                        const input = e.currentTarget;
                        const file = input.files?.[0];
                        if (file) await uploadSettingImage(file, "hero_image");
                        input.value = "";
                      }}
                    />
                  </label>
                  {field("Hero image URL", adminData.settings.hero_image, v =>
                    setAdminData(d =>
                      normalise({
                        ...d,
                        settings: { ...d.settings, hero_image: v }
                      })
                    )
                  )}
                </div>

                <div className="image-upload full-span">
                  <span>Brand logo</span>
                  {adminData.settings.logo_url && (
                    <img
                      className="setting-image-preview logo-preview"
                      src={adminData.settings.logo_url}
                      alt="Logo preview"
                    />
                  )}
                  <label className="upload-button">
                    <Upload size={16} />
                    {fileBusy ? "Uploading…" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={fileBusy}
                      onChange={async e => {
                        const input = e.currentTarget;
                        const file = input.files?.[0];
                        if (file) await uploadSettingImage(file, "logo_url");
                        input.value = "";
                      }}
                    />
                  </label>
                  {field("Logo image URL", adminData.settings.logo_url, v =>
                    setAdminData(d =>
                      normalise({
                        ...d,
                        settings: { ...d.settings, logo_url: v }
                      })
                    )
                  )}
                </div>

                {field("WhatsApp number (international format)", adminData.settings.whatsapp, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, whatsapp: v }
                    })
                  )
                )}
                {field("Email", adminData.settings.email, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, email: v }
                    })
                  )
                )}
                {field("Address", adminData.settings.address, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, address: v }
                    })
                  )
                )}
                {field("Instagram URL", adminData.settings.instagram, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, instagram: v }
                    })
                  )
                )}
                {field("Facebook URL", adminData.settings.facebook, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, facebook: v }
                    })
                  )
                )}
                {field("TikTok URL", adminData.settings.tiktok, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, tiktok: v }
                    })
                  )
                )}
                {field("Delivery charges (PKR)", adminData.settings.delivery_charges_pkr, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, delivery_charges_pkr: Number(v) }
                    })
                  ), "number"
                )}
                {field("Free delivery threshold (PKR)", adminData.settings.free_delivery_above_pkr, v =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      settings: { ...d.settings, free_delivery_above_pkr: Number(v) }
                    })
                  ), "number"
                )}

                <label className="field full-span">
                  <span>About / Our Story</span>
                  <textarea
                    rows={4}
                    value={adminData.settings.about_text}
                    onChange={e =>
                      setAdminData(d =>
                        normalise({
                          ...d,
                          settings: {
                            ...d.settings,
                            about_text: e.target.value
                          }
                        })
                      )
                    }
                  />
                </label>

                <label className="field full-span">
                  <span>Announcement bar</span>
                  <input
                    value={adminData.announcement.text}
                    onChange={e =>
                      setAdminData(d =>
                        normalise({
                          ...d,
                          announcement: {
                            ...d.announcement,
                            text: e.target.value
                          }
                        })
                      )
                    }
                  />
                </label>

                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={adminData.announcement.active}
                    onChange={e =>
                      setAdminData(d =>
                        normalise({
                          ...d,
                          announcement: {
                            ...d.announcement,
                            active: e.target.checked
                          }
                        })
                      )
                    }
                  />
                  Show announcement
                </label>
              </div>

              <button
                className="button dark"
                onClick={() => protectedSave(adminData)}
                disabled={saving || fileBusy}
              >
                <Save size={16} />
                {saving ? "Saving…" : "Save and publish"}
              </button>
            </div>
          )}

          {tab === "Policies & FAQs" && (
            <div className="admin-panel">
              <h2>Policies</h2>
              {[
                "shipping_information",
                "return_policy",
                "privacy_policy",
                "footer_text"
              ].map(k => (
                <label className="field" key={k}>
                  <span>
                    {k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                  <textarea
                    rows={3}
                    value={adminData.settings[k] || ""}
                    onChange={e =>
                      setAdminData(d =>
                        normalise({
                          ...d,
                          settings: {
                            ...d.settings,
                            [k]: e.target.value
                          }
                        })
                      )
                    }
                  />
                </label>
              ))}

              <h2>FAQs</h2>
              {adminData.faqs.map(f => (
                <div className="faq-edit" key={f.id}>
                  {field("Question", f.question, v =>
                    setAdminData(d =>
                      normalise({
                        ...d,
                        faqs: d.faqs.map(x =>
                          x.id === f.id ? { ...x, question: v } : x
                        )
                      })
                    )
                  )}
                  {field("Answer", f.answer, v =>
                    setAdminData(d =>
                      normalise({
                        ...d,
                        faqs: d.faqs.map(x =>
                          x.id === f.id ? { ...x, answer: v } : x
                        )
                      })
                    )
                  )}
                  <button
                    className="icon-button danger"
                    onClick={() =>
                      setAdminData(d =>
                        normalise({
                          ...d,
                          faqs: d.faqs.filter(x => x.id !== f.id)
                        })
                      )
                    }
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}

              <button
                className="button outline"
                onClick={() =>
                  setAdminData(d =>
                    normalise({
                      ...d,
                      faqs: [
                        ...d.faqs,
                        {
                          id: crypto.randomUUID(),
                          question: "New question",
                          answer: "Answer"
                        }
                      ]
                    })
                  )
                }
              >
                <Plus size={16} /> Add FAQ
              </button>

              <div className="editor-actions">
                <button
                  className="button dark"
                  onClick={() => protectedSave(adminData)}
                  disabled={saving}
                >
                  <Save size={16} /> Save policies
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (view === "cart") {
    return (
      <>
        {header}
        <main className="content-page">
          <span className="eyebrow">YOUR SELECTION</span>
          <h1>Shopping bag</h1>
          {bag.length === 0 ? (
            <div className="empty-state">Your bag is waiting for something beautiful.</div>
          ) : (
            <div className="cart-layout">
              <div>
                {bag.map((item, i) => {
                  const p = data.products.find(x => x.id === item.id);
                  if (!p) return null;
                  return (
                    <div className="cart-item" key={item.id + item.size}>
                      <img src={imageFor(p)} alt="" />
                      <div>
                        <h3>{p.name}</h3>
                        <p>Size: {item.size || "Not selected"}</p>
                        <b>{productPrice(p)}</b>
                        <div className="qty-control">
                          <button onClick={() => setBag(b => b.map((x, j) => j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}><Minus size={14} /></button>
                          {item.qty}
                          <button onClick={() => setBag(b => b.map((x, j) => j === i ? { ...x, qty: x.qty + 1 } : x))}><Plus size={14} /></button>
                          <button onClick={() => setBag(b => b.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="cart-summary">
                <h2>Order summary</h2>
                <div className="summary-line"><span>Subtotal</span><b>{money(total, currency)}</b></div>
                {field("Full name", checkoutName, setCheckoutName)}
                {field("Phone / WhatsApp", checkoutPhone, setCheckoutPhone)}
                <label className="field">
                  <span>Delivery address</span>
                  <textarea rows={3} value={checkoutAddress} onChange={e => setCheckoutAddress(e.target.value)} />
                </label>
                <button className="button dark full" onClick={() => {
                  const msg = `RZIA'S AURA ORDER\n${bag.map(it => {
                    const p = data.products.find(x => x.id === it.id);
                    return `${p?.name} x${it.qty} (size ${it.size})`;
                  }).join("\n")}\nTotal: ${money(total, currency)}\nName: ${checkoutName}\nPhone: ${checkoutPhone}\nAddress: ${checkoutAddress}`;
                  if (!data.settings.whatsapp) {
                    notify("Please configure the store WhatsApp number in admin settings.");
                    return;
                  }
                  window.open(`https://wa.me/${data.settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
                }}>
                  Order via WhatsApp <MessageCircle size={16} />
                </button>
                <p className="small-note">WhatsApp checkout sends your order details to the store for confirmation. Online card payments are not configured in this starter project.</p>
              </aside>
            </div>
          )}
        </main>
      </>
    );
  }

  
  if (view === "product" && selected) {
    return (
      <>
        {header}
        <main className="product-detail">
          <div className="detail-image">
            {imageFor(selected) ? (
              <img
                src={imageFor(selected)}
                alt={selected.name}
              />
            ) : (
              <div className="placeholder-image">
                RZIA’S AURA
              </div>
            )}
          </div>

          <div className="detail-copy">
            <span className="eyebrow">
              {selected.category}
            </span>

            <h1>{selected.name}</h1>

            <div className="detail-price">
              {productPrice(selected)}
            </div>

            <p>{selected.description}</p>

            <p>
              <b>Available sizes:</b>{" "}
              {selected.sizes?.join(", ") || "Contact us"}
            </p>

            <p>
              <b>Colours:</b>{" "}
              {selected.colors?.join(", ") || "As pictured"}
            </p>

            <p>
              <b>Stock:</b>{" "}
              {selected.stock > 0
                ? `${selected.stock} available`
                : "Contact us for availability"}
            </p>

            <button
              className="button dark full"
              onClick={() => {
                if (selected.stock <= 0) {
                  notify("Please contact us for stock availability.");
                  return;
                }

                const size = selected.sizes?.[0] || "One size";

                setBag((b) => [
                  ...b,
                  { id: selected.id, qty: 1, size },
                ]);

                notify("Added to bag.");
                navTo("cart");
              }}
            >
              Add to Bag
            </button>
          </div>
        </main>
      </>
    );
  }
}
