
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ShoppingBag,
  Menu,
  X,
  Search,
  Plus,
  Trash2,
  Pencil,
  Save,
  Image as ImageIcon,
  Instagram,
  Mail,
  MapPin,
  ChevronLeft,
  Minus,
  Check,
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
  image_url: string;
  image_urls: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  active: boolean;
  best_seller: boolean;
  sale: boolean;
  badge: string;
};

type Collection = {
  id: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
};

type Settings = {
  brand_name: string;
  tagline: string;
  hero_heading: string;
  hero_text: string;
  hero_image: string;
  about_text: string;
  footer_text: string;
  address: string;
  email: string;
  whatsapp: string;
  instagram: string;
  currency: string;
  delivery_charge: number;
  free_delivery_threshold: number;
};

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

type StoreData = {
  products: Product[];
  collections: Collection[];
  settings: Settings;
  faqs: FAQ[];
};

type BagItem = {
  id: string;
  qty: number;
  size: string;
};

const defaultData: StoreData = {
  products: [],
  collections: [
    {
      id: "women",
      name: "Women",
      description: "Modern silhouettes, timeless grace.",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",
      active: true,
    },
    {
      id: "men",
      name: "Men",
      description: "Effortless style for every occasion.",
      image:
        "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1000&q=85",
      active: true,
    },
    {
      id: "modest",
      name: "Modest Wear",
      description: "Refined modesty, beautifully expressed.",
      image:
        "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=1000&q=85",
      active: true,
    },
  ],
  settings: {
    brand_name: "RZIA’S AURA",
    tagline: "THE AURA OF ELEGANCE",
    hero_heading: "Elegance in Every Thread",
    hero_text:
      "Discover timeless pieces designed to make every moment feel extraordinary.",
    hero_image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=90",
    about_text:
      "RZIA’S AURA celebrates confidence, individuality and the art of dressing beautifully.",
    footer_text: "Where elegance becomes an attitude.",
    address: "",
    email: "",
    whatsapp: "",
    instagram: "",
    currency: "PKR",
    delivery_charge: 200,
    free_delivery_threshold: 5000,
  },
  faqs: [
    {
      id: "faq-1",
      question: "How can I place an order?",
      answer:
        "Explore our collection, add your items to the bag and contact us to complete your order.",
    },
    {
      id: "faq-2",
      question: "How can I check my size?",
      answer:
        "Check the available sizes on each product. Contact us if you need help choosing a size.",
    },
  ],
};

function normalise(input: unknown): StoreData {
  const value =
    input && typeof input === "object"
      ? (input as Partial<StoreData>)
      : {};

  return {
    ...defaultData,
    ...value,
    products: Array.isArray(value.products)
      ? value.products.map((p) => ({
          ...p,
          image_url: p.image_url || "",
          image_urls: Array.isArray(p.image_urls)
            ? p.image_urls
            : p.image_url
              ? [p.image_url]
              : [],
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          colors: Array.isArray(p.colors) ? p.colors : [],
          active: p.active !== false,
          best_seller: Boolean(p.best_seller),
          sale: Boolean(p.sale),
          stock: Number(p.stock || 0),
          price_pkr: Number(p.price_pkr || 0),
          price_bdt: Number(p.price_bdt || 0),
          price_eur: Number(p.price_eur || 0),
        }))
      : [],
    collections: Array.isArray(value.collections)
      ? value.collections
      : defaultData.collections,
    settings: {
      ...defaultData.settings,
      ...(value.settings || {}),
    },
    faqs: Array.isArray(value.faqs) ? value.faqs : defaultData.faqs,
  };
}

function imageFor(product: Product): string {
  return (
    product.image_url ||
    product.image_urls?.[0] ||
    ""
  );
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function App() {
  const [data, setData] = useState<StoreData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<
    "home" | "product" | "cart" | "admin" | "info"
  >("home");
  const [selected, setSelected] = useState<Product | null>(null);
  const [category, setCategory] = useState("All");
  const [currency, setCurrency] = useState("PKR");
  const [bag, setBag] = useState<BagItem[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [info, setInfo] = useState("Our Story");
  const [adminTab, setAdminTab] = useState<
    "dashboard" | "products" | "collections" | "settings" | "faqs"
  >("dashboard");
  const [adminData, setAdminData] = useState<StoreData>(defaultData);
  const [editingId, setEditingId] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const navTo = (
    next: "home" | "product" | "cart" | "admin" | "info"
  ) => {
    setView(next);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const productPrice = (product: Product) => {
    const amount =
      currency === "BDT"
        ? product.price_bdt
        : currency === "EUR"
          ? product.price_eur
          : product.price_pkr;

    const symbol =
      currency === "EUR" ? "€" : currency === "BDT" ? "৳" : "Rs. ";

    return `${symbol}${Number(amount || 0).toLocaleString()}`;
  };

  const products = useMemo(
    () =>
      data.products.filter((product) => {
        if (product.active === false) return false;

        const matchesCategory =
          category === "All" ||
          (category === "New Arrivals"
            ? product.badge?.toLowerCase().includes("new")
            : product.category.toLowerCase() === category.toLowerCase());

        const matchesSearch =
          `${product.name} ${product.category}`
            .toLowerCase()
            .includes(search.toLowerCase());

        return matchesCategory && matchesSearch;
      }),
    [data.products, category, search]
  );

  const bagCount = bag.reduce((sum, item) => sum + item.qty, 0);
  
  useEffect(() => {
    let mounted = true;

    async function loadStore() {
      try {
        const response = await fetch("/api/admin-data", {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Store API returned ${response.status}`);
        }

        const result = await response.json();
        const store = normalise(result.data ?? result);

        if (mounted) {
          setData(store);
          setAdminData(store);
        }
      } catch (error) {
        console.error("Unable to load store data:", error);

        if (mounted) {
          setData(defaultData);
          setAdminData(defaultData);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadStore();

    return () => {
      mounted = false;
    };
  }, []);

  const saveStore = async (next: StoreData) => {
    setSaving(true);

    try {
      const response = await fetch("/api/admin-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(next),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Save failed: ${response.status}`);
      }

      const result = await response.json().catch(() => ({}));
      const saved = normalise(result.data ?? result.store ?? next);

      setData(saved);
      setAdminData(saved);
      notify("Changes saved successfully.");
    } catch (error) {
      console.error("Unable to save store data:", error);
      notify("Save failed. Please check the Netlify API.");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof Settings, value: string | number) => {
    setAdminData((previous) =>
      normalise({
        ...previous,
        settings: {
          ...previous.settings,
          [key]: value,
        },
      })
    );
  };

  const updateProduct = (id: string, changes: Partial<Product>) => {
    setAdminData((previous) =>
      normalise({
        ...previous,
        products: previous.products.map((product) =>
          product.id === id ? { ...product, ...changes } : product
        ),
      })
    );
  };

  const addProduct = () => {
    const product: Product = {
      id: makeId(),
      name: "New Product",
      category: "Women",
      description: "",
      price_pkr: 0,
      price_bdt: 0,
      price_eur: 0,
      image_url: "",
      image_urls: [],
      sizes: ["S", "M", "L"],
      colors: [],
      stock: 1,
      active: true,
      best_seller: false,
      sale: false,
      badge: "New Arrival",
    };

    setAdminData((previous) =>
      normalise({
        ...previous,
        products: [product, ...previous.products],
      })
    );

    setEditingId(product.id);
    setAdminTab("products");
  };

  const deleteProduct = (id: string) => {
    if (!window.confirm("Delete this product permanently?")) return;

    setAdminData((previous) =>
      normalise({
        ...previous,
        products: previous.products.filter((product) => product.id !== id),
      })
    );

    if (editingId === id) setEditingId("");
    notify("Product removed. Save changes to publish.");
  };

  const addCollection = () => {
    const collection: Collection = {
      id: makeId(),
      name: "New Collection",
      description: "",
      image: "",
      active: true,
    };

    setAdminData((previous) =>
      normalise({
        ...previous,
        collections: [...previous.collections, collection],
      })
    );
  };

  const updateCollection = (
    id: string,
    changes: Partial<Collection>
  ) => {
    setAdminData((previous) =>
      normalise({
        ...previous,
        collections: previous.collections.map((collection) =>
          collection.id === id
            ? { ...collection, ...changes }
            : collection
        ),
      })
    );
  };

  const deleteCollection = (id: string) => {
    if (!window.confirm("Delete this collection?")) return;

    setAdminData((previous) =>
      normalise({
        ...previous,
        collections: previous.collections.filter(
          (collection) => collection.id !== id
        ),
      })
    );
  };

  const addFAQ = () => {
    const faq: FAQ = {
      id: makeId(),
      question: "New question",
      answer: "",
    };

    setAdminData((previous) =>
      normalise({
        ...previous,
        faqs: [...previous.faqs, faq],
      })
    );
  };

  const updateFAQ = (id: string, changes: Partial<FAQ>) => {
    setAdminData((previous) =>
      normalise({
        ...previous,
        faqs: previous.faqs.map((faq) =>
          faq.id === id ? { ...faq, ...changes } : faq
        ),
      })
    );
  };

  const deleteFAQ = (id: string) => {
    setAdminData((previous) =>
      normalise({
        ...previous,
        faqs: previous.faqs.filter((faq) => faq.id !== id),
      })
    );
  };

  const addToBag = (product: Product) => {
    if (product.stock <= 0) {
      notify("Please contact us for stock availability.");
      return;
    }

    const size = product.sizes?.[0] || "One size";

    setBag((previous) => {
      const existing = previous.find(
        (item) => item.id === product.id && item.size === size
      );

      if (existing) {
        return previous.map((item) =>
          item.id === product.id && item.size === size
            ? { ...item, qty: Math.min(item.qty + 1, product.stock) }
            : item
        );
      }

      return [...previous, { id: product.id, qty: 1, size }];
    });

    notify("Added to bag.");
  };

  const changeBagQty = (id: string, size: string, amount: number) => {
    setBag((previous) =>
      previous
        .map((item) =>
          item.id === id && item.size === size
            ? { ...item, qty: item.qty + amount }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const bagItems = bag
    .map((item) => ({
      ...item,
      product: data.products.find((product) => product.id === item.id),
    }))
    .filter(
      (item): item is BagItem & { product: Product } =>
        Boolean(item.product)
    );

  const bagTotal = bagItems.reduce((total, item) => {
    const amount =
      currency === "BDT"
        ? item.product.price_bdt
        : currency === "EUR"
          ? item.product.price_eur
          : item.product.price_pkr;

    return total + Number(amount || 0) * item.qty;
  }, 0);

  const header = (
    <header className="site-header">
      <button
        className="icon-button mobile-menu-button"
        aria-label="Toggle menu"
        onClick={() => setMobileMenu((previous) => !previous)}
      >
        {mobileMenu ? <X size={22} /> : <Menu size={22} />}
      </button>

      <button className="brand-mark" onClick={() => navTo("home")}>
        <span className="brand-name">{data.settings.brand_name}</span>
        <span className="brand-tagline">{data.settings.tagline}</span>
      </button>

      <nav className={`main-nav ${mobileMenu ? "open" : ""}`}>
        <button onClick={() => { setCategory("All"); navTo("home"); }}>
          Home
        </button>
        <button onClick={() => { setCategory("Women"); navTo("home"); }}>
          Women
        </button>
        <button onClick={() => { setCategory("Men"); navTo("home"); }}>
          Men
        </button>
        <button onClick={() => { setCategory("New Arrivals"); navTo("home"); }}>
          New Arrivals
        </button>
        <button onClick={() => { setInfo("Our Story"); navTo("info"); }}>
          Our Story
        </button>
      </nav>

      <div className="header-actions">
        <select
          aria-label="Currency"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
        >
          <option value="PKR">PKR</option>
          <option value="BDT">BDT</option>
          <option value="EUR">EUR</option>
        </select>

        <button
          className="icon-button"
          aria-label="Search products"
          onClick={() => {
            navTo("home");
            document.getElementById("shop")?.scrollIntoView({
              behavior: "smooth",
            });
          }}
        >
          <Search size={19} />
        </button>

        <button
          className="icon-button bag-button"
          aria-label="Shopping bag"
          onClick={() => navTo("cart")}
        >
          <ShoppingBag size={20} />
          <span>{bagCount}</span>
        </button>
      </div>
    </header>
  );

  if (view === "admin") {
    const filteredAdminProducts = adminData.products.filter((product) =>
      `${product.name} ${product.category}`
        .toLowerCase()
        .includes(adminSearch.toLowerCase())
    );

    return (
      <div className="admin-page">
        <header className="admin-header">
          <button className="brand-mark" onClick={() => navTo("home")}>
            <span className="brand-name">RZIA’S AURA</span>
            <span className="brand-tagline">ADMIN STUDIO</span>
          </button>
          <button className="button-outline" onClick={() => navTo("home")}>
            View Store
          </button>
        </header>

        <main className="admin-content">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">STORE MANAGEMENT</p>
              <h1>Admin Studio</h1>
              <p>Manage your products and brand settings.</p>
            </div>
            <button
              className="button-primary"
              disabled={saving}
              onClick={() => void saveStore(adminData)}
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>

          <nav className="admin-tabs">
            {(
              ["dashboard", "products", "collections", "settings", "faqs"] as const
            ).map((tab) => (
              <button
                key={tab}
                className={adminTab === tab ? "active" : ""}
                onClick={() => setAdminTab(tab)}
              >
                {tab === "dashboard"
                  ? "Dashboard"
                  : tab === "faqs"
                    ? "FAQs"
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          {adminTab === "dashboard" && (
            <section className="admin-panel">
              <p className="eyebrow">OVERVIEW</p>
              <h2>Your store at a glance</h2>
              <div className="admin-stats">
                <div className="stat-card">
                  <span>Total Products</span>
                  <strong>{adminData.products.length}</strong>
                </div>
                <div className="stat-card">
                  <span>Visible Products</span>
                  <strong>
                    {adminData.products.filter((p) => p.active).length}
                  </strong>
                </div>
                <div className="stat-card">
                  <span>Collections</span>
                  <strong>{adminData.collections.length}</strong>
                </div>
                <div className="stat-card">
                  <span>FAQs</span>
                  <strong>{adminData.faqs.length}</strong>
                </div>
              </div>
              <p>
                Edit your store using the tabs above. Press “Save All Changes”
                to publish updates through your Netlify API.
              </p>
            </section>
          )}

          {adminTab === "products" && (
            <section className="admin-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">YOUR CATALOGUE</p>
                  <h2>Products</h2>
                </div>
                <button className="button-primary" onClick={addProduct}>
                  <Plus size={17} /> Add Product
                </button>
              </div>

              <input
                className="admin-input"
                placeholder="Search products..."
                value={adminSearch}
                onChange={(event) => setAdminSearch(event.target.value)}
              />

              {filteredAdminProducts.length === 0 && (
                <p className="empty-state">
                  No products found. Click “Add Product” to create one.
                </p>
              )}

              <div className="admin-product-list">
                {filteredAdminProducts.map((product) => {
                  const editing = editingId === product.id;

                  return (
                    <article className="admin-product-card" key={product.id}>
                      <div className="admin-product-summary">
                        {imageFor(product) ? (
                          <img src={imageFor(product)} alt={product.name} />
                        ) : (
                          <div className="image-placeholder">
                            <ImageIcon size={24} />
                          </div>
                        )}

                        <div className="admin-product-info">
                          <strong>{product.name || "Untitled Product"}</strong>
                          <span>{product.category}</span>
                          <span>
                            PKR {product.price_pkr} · BDT {product.price_bdt} ·
                            EUR {product.price_eur}
                          </span>
                          <span>
                            {product.active ? "Visible" : "Hidden"} · Stock:{" "}
                            {product.stock}
                          </span>
                        </div>

                        <div className="admin-product-actions">
                          <button
                            className="icon-button"
                            aria-label="Edit product"
                            onClick={() =>
                              setEditingId(editing ? "" : product.id)
                            }
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            className="icon-button danger"
                            aria-label="Delete product"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {editing && (
                        <div className="admin-edit-form">
                          <label>
                            Product Name
                            <input
                              className="admin-input"
                              value={product.name}
                              onChange={(event) =>
                                updateProduct(product.id, {
                                  name: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label>
                            Category
                            <select
                              className="admin-input"
                              value={product.category}
                              onChange={(event) =>
                                updateProduct(product.id, {
                                  category: event.target.value,
                                })
                              }
                            >
                              <option>Women</option>
                              <option>Men</option>
                              <option>Modest Wear</option>
                              <option>Western Wear</option>
                              <option>Hoodies</option>
                              <option>Accessories</option>
                            </select>
                          </label>

                          <label>
                            Description
                            <textarea
                              className="admin-input"
                              rows={3}
                              value={product.description}
                              onChange={(event) =>
                                updateProduct(product.id, {
                                  description: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label>
                            Main Image URL
                            <input
                              className="admin-input"
                              placeholder="https://..."
                              value={product.image_url}
                              onChange={(event) =>
                                updateProduct(product.id, {
                                  image_url: event.target.value,
                                  image_urls: event.target.value
                                    ? [
                                        event.target.value,
                                        ...product.image_urls.filter(
                                          (url) => url !== event.target.value
                                        ),
                                      ]
                                    : product.image_urls,
                                })
                              }
                            />
                          </label>

                          <label>
                            Additional Image URLs (one URL per line)
                            <textarea
                              className="admin-input"
                              rows={3}
                              placeholder={"https://image-1.jpg\nhttps://image-2.jpg"}
                              value={product.image_urls.join("\n")}
                              onChange={(event) => {
                                const urls = event.target.value
                                  .split("\n")
                                  .map((url) => url.trim())
                                  .filter(Boolean);

                                updateProduct(product.id, {
                                  image_urls: urls,
                                  image_url: urls[0] || "",
                                });
                              }}
                            />
                          </label>

                          <div className="admin-form-grid">
                            <label>
                              Price (PKR)
                              <input
                                className="admin-input"
                                type="number"
                                min="0"
                                value={product.price_pkr}
                                onChange={(event) =>
                                  updateProduct(product.id, {
                                    price_pkr: Number(event.target.value),
                                  })
                                }
                              />
                            </label>

                            <label>
                              Price (BDT)
                              <input
                                className="admin-input"
                                type="number"
                                min="0"
                                value={product.price_bdt}
                                onChange={(event) =>
                                  updateProduct(product.id, {
                                    price_bdt: Number(event.target.value),
                                  })
                                }
                              />
                            </label>

                            <label>
                              Price (EUR)
                              <input
                                className="admin-input"
                                type="number"
                                min="0"
                                step="0.01"
                                value={product.price_eur}
                                onChange={(event) =>
                                  updateProduct(product.id, {
                                    price_eur: Number(event.target.value),
                                  })
                                }
                              />
                            </label>

                            <label>
                              Stock
                              <input
                                className="admin-input"
                                type="number"
                                min="0"
                                value={product.stock}
                                onChange={(event) =>
                                  updateProduct(product.id, {
                                    stock: Number(event.target.value),
                                  })
                                }
                              />
                            </label>
                          </div>

                          <label>
                            Sizes (comma-separated)
                            <input
                              className="admin-input"
                              value={product.sizes.join(", ")}
                              onChange={(event) =>
                                updateProduct(product.id, {
                                  sizes: event.target.value
                                    .split(",")
                                    .map((size) => size.trim())
                                    .filter(Boolean),
                                })
                              }
                            />
                          </label>

                          <label>
                            Colours (comma-separated)
                            <input
                              className="admin-input"
                              value={product.colors.join(", ")}
                              onChange={(event) =>
                                updateProduct(product.id, {
                                  colors: event.target.value
                                    .split(",")
                                    .map((color) => color.trim())
                                    .filter(Boolean),
                                })
                              }
                            />
                          </label>

                          <label>
                            Badge
                            <input
                              className="admin-input"
                              placeholder="New Arrival, Best Seller..."
                              value={product.badge}
                              onChange={(event) =>
                                updateProduct(product.id, {
                                  badge: event.target.value,
                                  best_seller: event.target.value
                                    .toLowerCase()
                                    .includes("best"),
                                })
                              }
                            />
                          </label>

                          <div className="admin-checkboxes">
                            <label>
                              <input
                                type="checkbox"
                                checked={product.active}
                                onChange={(event) =>
                                  updateProduct(product.id, {
                                    active: event.target.checked,
                                  })
                                }
                              />
                              Show on website
                            </label>

                            <label>
                              <input
                                type="checkbox"
                                checked={product.best_seller}
                                onChange={(event) =>
                                  updateProduct(product.id, {
                                    best_seller: event.target.checked,
                                  })
                                }
                              />
                              Best seller
                            </label>

                            <label>
                              <input
                                type="checkbox"
                                checked={product.sale}
                                onChange={(event) =>
                                  updateProduct(product.id, {
                                    sale: event.target.checked,
                                  })
                                }
                              />
                              On sale
                            </label>
                          </div>

                          <button
                            className="button-primary"
                            onClick={() => {
                              setEditingId("");
                              notify("Product edited. Save all changes to publish.");
                            }}
                          >
                            <Check size={17} /> Done Editing
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {adminTab === "collections" && (
            <section className="admin-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">SHOP BY STYLE</p>
                  <h2>Collections</h2>
                </div>
                <button className="button-primary" onClick={addCollection}>
                  <Plus size={17} /> Add Collection
                </button>
              </div>

              {adminData.collections.map((collection) => (
                <article className="admin-edit-form collection-editor" key={collection.id}>
                  <label>
                    Collection Name
                    <input
                      className="admin-input"
                      value={collection.name}
                      onChange={(event) =>
                        updateCollection(collection.id, {
                          name: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Description
                    <textarea
                      className="admin-input"
                      rows={2}
                      value={collection.description}
                      onChange={(event) =>
                        updateCollection(collection.id, {
                          description: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Image URL
                    <input
                      className="admin-input"
                      placeholder="https://..."
                      value={collection.image}
                      onChange={(event) =>
                        updateCollection(collection.id, {
                          image: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={collection.active}
                      onChange={(event) =>
                        updateCollection(collection.id, {
                          active: event.target.checked,
                        })
                      }
                    />
                    Show this collection
                  </label>

                  <button
                    className="button-outline danger"
                    
                    onClick={() => deleteCollection(collection.id)}
                  >
                    <Trash2 size={16} /> Delete Collection
                  </button>
                </article>
              ))}
            </section>
          )}

          {adminTab === "settings" && (
            <section className="admin-panel">
              <p className="eyebrow">BRAND IDENTITY</p>
              <h2>Store Settings</h2>

              {(
                [
                  ["brand_name", "Brand Name"],
                  ["tagline", "Tagline"],
                  ["hero_heading", "Hero Heading"],
                  ["hero_text", "Hero Text"],
                  ["hero_image", "Hero Image URL"],
                  ["about_text", "Our Story"],
                  ["footer_text", "Footer Text"],
                  ["address", "Business Address"],
                  ["email", "Contact Email"],
                  ["whatsapp", "WhatsApp Number"],
                  ["instagram", "Instagram URL"],
                ] as [keyof Settings, string][]
              ).map(([key, label]) => (
                <label className="settings-field" key={key}>
                  {label}
                  {["hero_text", "about_text", "footer_text"].includes(key) ? (
                    <textarea
                      className="admin-input"
                      rows={3}
                      value={String(adminData.settings[key] ?? "")}
                      onChange={(event) =>
                        updateSetting(key, event.target.value)
                      }
                    />
                  ) : (
                    <input
                      className="admin-input"
                      value={String(adminData.settings[key] ?? "")}
                      onChange={(event) =>
                        updateSetting(key, event.target.value)
                      }
                    />
                  )}
                </label>
              ))}

              <div className="admin-form-grid">
                <label>
                  Delivery Charge (PKR)
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    value={adminData.settings.delivery_charge}
                    onChange={(event) =>
                      updateSetting(
                        "delivery_charge",
                        Number(event.target.value)
                      )
                    }
                  />
                </label>

                <label>
                  Free Delivery Threshold (PKR)
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    value={adminData.settings.free_delivery_threshold}
                    onChange={(event) =>
                      updateSetting(
                        "free_delivery_threshold",
                        Number(event.target.value)
                      )
                    }
                  />
                </label>
              </div>

              <button
                className="button-primary"
                disabled={saving}
                onClick={() => void saveStore(adminData)}
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </section>
          )}

          {adminTab === "faqs" && (
            <section className="admin-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">CUSTOMER SUPPORT</p>
                  <h2>Frequently Asked Questions</h2>
                </div>
                <button className="button-primary" onClick={addFAQ}>
                  <Plus size={17} /> Add FAQ
                </button>
              </div>

              {adminData.faqs.map((faq) => (
                <article className="admin-edit-form" key={faq.id}>
                  <label>
                    Question
                    <input
                      className="admin-input"
                      value={faq.question}
                      onChange={(event) =>
                        updateFAQ(faq.id, {
                          question: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Answer
                    <textarea
                      className="admin-input"
                      rows={3}
                      value={faq.answer}
                      onChange={(event) =>
                        updateFAQ(faq.id, {
                          answer: event.target.value,
                        })
                      }
                    />
                  </label>

                  <button
                    className="button-outline danger"
                    onClick={() => deleteFAQ(faq.id)}
                  >
                    <Trash2 size={16} /> Delete FAQ
                  </button>
                </article>
              ))}
            </section>
          )}
        </main>
      </div>
    );
  }

  if (view === "cart") {
    return (
      <>
        {header}
        <main className="content-page cart-page">
          <p className="eyebrow">YOUR SELECTION</p>
          <h1>Shopping Bag</h1>

          {bagItems.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={35} />
              <h2>Your bag is waiting</h2>
              <p>Discover pieces made for your personal style.</p>
              <button
                className="button-primary"
                onClick={() => navTo("home")}
              >
                Continue Shopping <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {bagItems.map(({ product, qty, size }) => (
                  <article
                    className="cart-item"
                    key={`${product.id}-${size}`}
                  >
                    {imageFor(product) ? (
                      <img src={imageFor(product)} alt={product.name} />
                    ) : (
                      <div className="image-placeholder">
                        <ImageIcon size={22} />
                      </div>
                    )}

                    <div className="cart-item-info">
                      <h3>{product.name}</h3>
                      <p>Size: {size}</p>
                      <strong>{productPrice(product)}</strong>

                      <div className="quantity-control">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() =>
                            changeBagQty(product.id, size, -1)
                          }
                        >
                          <Minus size={15} />
                        </button>
                        <span>{qty}</span>
                        <button
                          aria-label="Increase quantity"
                          disabled={qty >= product.stock}
                          onClick={() =>
                            changeBagQty(product.id, size, 1)
                          }
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>

                    <button
                      className="icon-button danger"
                      aria-label="Remove item"
                      onClick={() =>
                        setBag((previous) =>
                          previous.filter(
                            (item) =>
                              !(
                                item.id === product.id &&
                                item.size === size
                              )
                          )
                        )
                      }
                    >
                      <Trash2 size={18} />
                    </button>
                  </article>
                ))}
              </div>

              <div className="cart-summary">
                <p>
                  <span>Subtotal</span>
                  <strong>
                    {currency === "EUR"
                      ? "€"
                      : currency === "BDT"
                        ? "৳"
                        : "Rs. "}
                    {bagTotal.toLocaleString()}
                  </strong>
                </p>
                <p className="muted-text">
                  Delivery charges will be confirmed when placing your order.
                </p>

                <button
                  className="button-primary checkout-button"
                  onClick={() => {
                    const phone = data.settings.whatsapp.replace(/\D/g, "");

                    if (!phone) {
                      notify(
                        "Please add your WhatsApp number in Admin Settings."
                      );
                      return;
                    }

                    const lines = bagItems
                      .map(
                        ({ product, qty, size }) =>
                          `${product.name} | Size: ${size} | Qty: ${qty}`
                      )
                      .join("\n");

                    const message = encodeURIComponent(
                      `Hello ${data.settings.brand_name}, I would like to place an order:\n${lines}\nSubtotal: ${currency} ${bagTotal}\nPlease confirm availability and delivery.`
                    );

                    window.open(
                      `https://wa.me/${phone}?text=${message}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                >
                  Checkout via WhatsApp <ArrowRight size={17} />
                </button>
              </div>
            </>
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
          <button
            className="back-link"
            onClick={() => navTo("home")}
          >
            <ChevronLeft size={17} /> Back to collection
          </button>

          <div className="detail-layout">
            <div className="detail-gallery">
              {(selected.image_urls?.length
                ? selected.image_urls
                : [imageFor(selected)]
              )
                .filter(Boolean)
                .map((url, index) => (
                  <img
                    key={`${url}-${index}`}
                    src={url}
                    alt={`${selected.name} view ${index + 1}`}
                  />
                ))}

              {!imageFor(selected) && (
                <div className="image-placeholder">
                  <ImageIcon size={40} />
                  <span>Product image coming soon</span>
                </div>
              )}
            </div>

            <div className="detail-copy">
              <p className="eyebrow">{selected.category}</p>
              <h1>{selected.name}</h1>
              <p className="detail-price">{productPrice(selected)}</p>

              {selected.badge && (
                <span className="product-badge">{selected.badge}</span>
              )}

              <p className="detail-description">
                {selected.description ||
                  "Thoughtfully selected for timeless style."}
              </p>

              <div className="detail-meta">
                <strong>Available Sizes</strong>
                <p>
                  {selected.sizes.length
                    ? selected.sizes.join(" · ")
                    : "One size"}
                </p>
              </div>

              {selected.colors.length > 0 && (
                <div className="detail-meta">
                  <strong>Colours</strong>
                  <p>{selected.colors.join(" · ")}</p>
                </div>
              )}

              <p className="stock-note">
                {selected.stock > 0
                  ? `${selected.stock} available`
                  : "Currently out of stock"}
              </p>

              <button
                className="button-primary checkout-button"
                disabled={selected.stock <= 0}
                onClick={() => {
                  addToBag(selected);
                  navTo("cart");
                }}
              >
                <ShoppingBag size={18} /> Add to Bag
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (view === "info") {
    return (
      <>
        {header}
        <main className="content-page info-page">
          <p className="eyebrow">RZIA’S AURA</p>
          <h1>{info}</h1>

          {info === "Our Story" ? (
            <p>{data.settings.about_text}</p>
          ) : info === "FAQs" ? (
            <div className="faq-list">
              {data.faqs.map((faq) => (
                <details key={faq.id}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          ) : info === "Contact" ? (
            <div className="contact-details">
              {data.settings.address && (
                <p>
                  <MapPin size={18} /> {data.settings.address}
                </p>
              )}

              {data.settings.email && (
                <p>
                  <Mail size={18} /> {data.settings.email}
                </p>
              )}

              {data.settings.whatsapp && (
                <p>WhatsApp: {data.settings.whatsapp}</p>
              )}

              {data.settings.instagram && (
                <p>
                  <Instagram size={18} />
                  <a
                    href={data.settings.instagram}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Follow us on Instagram
                  </a>
                </p>
              )}

              {!data.settings.address &&
                !data.settings.email &&
                !data.settings.whatsapp &&
                !data.settings.instagram && (
                  <p>Contact details will be available soon.</p>
                )}
            </div>
          ) : (
            <p>{data.settings.footer_text}</p>
          )}

          <button
            className="button-outline"
            onClick={() => navTo("home")}
          >
            <ChevronLeft size={17} /> Back to Store
          </button>
        </main>
      </>
    );
                }
          
  return (
    <>
      {header}

      <main className="home-page">
        {loading && (
          <div className="loading-bar">
            <span />
            Loading RZIA’S AURA...
          </div>
        )}

        <section className="hero-section">
          <div className="hero-image">
            <img
              src={data.settings.hero_image}
              alt="RZIA’S AURA fashion collection"
            />
          </div>

          <div className="hero-overlay" />

          <div className="hero-content">
            <p className="eyebrow">THE ART OF EVERYDAY LUXURY</p>
            <h1>{data.settings.hero_heading}</h1>
            <p>{data.settings.hero_text}</p>

            <button
              className="button-primary hero-button"
              onClick={() => {
                setCategory("All");
                navTo("home");
                document.getElementById("shop")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              Explore Collection <ArrowRight size={18} />
            </button>
          </div>

          <div className="hero-caption">
            <span>01</span>
            <span className="hero-caption-line" />
            <span>THE NEW EXPRESSION</span>
          </div>
        </section>

        <section className="brand-intro">
          <p className="eyebrow">WELCOME TO {data.settings.brand_name}</p>
          <h2>{data.settings.tagline}</h2>
          <p>{data.settings.about_text}</p>
        </section>

        <section className="collections-section" id="collections">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CURATED FOR YOU</p>
              <h2>Explore Our Collections</h2>
            </div>

            <button
              className="text-link"
              onClick={() => {
                setCategory("All");
                document.getElementById("shop")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              View All <ArrowRight size={16} />
            </button>
          </div>

          <div className="collection-grid">
            {data.collections
              .filter((collection) => collection.active)
              .map((collection, index) => (
                <button
                  className={`collection-card collection-card-${index + 1}`}
                  key={collection.id}
                  onClick={() => {
                    setCategory(collection.name);
                    document.getElementById("shop")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  <div className="collection-image">
                    {collection.image ? (
                      <img
                        src={collection.image}
                        alt={collection.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="image-placeholder">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>

                  <div className="collection-copy">
                    <span className="eyebrow">DISCOVER THE EDIT</span>
                    <h3>{collection.name}</h3>
                    <p>{collection.description}</p>
                    <span className="collection-link">
                      Shop Collection <ArrowRight size={16} />
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE RZIA’S AURA EDIT</p>
              <h2>
                {category === "All" ? "Shop the Collection" : category}
              </h2>
            </div>

            <span className="product-count">
              {products.length} {products.length === 1 ? "PIECE" : "PIECES"}
            </span>
          </div>

          <div className="shop-toolbar">
            <div className="category-filters">
              {["All", "Women", "Men", "Modest Wear", "Western Wear", "Hoodies", "New Arrivals"].map(
                (item) => (
                  <button
                    key={item}
                    className={category === item ? "active" : ""}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            <label className="search-field">
              <Search size={17} />
              <input
                type="search"
                placeholder="Find your style..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X size={15} />
                </button>
              )}
            </label>
          </div>

          {products.length === 0 ? (
            <div className="empty-state shop-empty">
              <ShoppingBag size={32} />
              <h3>No products to show just yet</h3>
              <p>
                Try another category, or visit us again as new pieces arrive.
              </p>

              {search || category !== "All" ? (
                <button
                  className="button-outline"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                >
                  Clear Filters
                </button>
              ) : (
                <p>New arrivals are coming soon.</p>
              )}
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <article className="product-card" key={product.id}>
                  <button
                    className="product-image-button"
                    onClick={() => {
                      setSelected(product);
                      navTo("product");
                    }}
                    aria-label={`View ${product.name}`}
                  >
                    <div className="product-image">
                      {imageFor(product) ? (
                        <img
                          src={imageFor(product)}
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="image-placeholder">
                          <ImageIcon size={30} />
                          <span>Product image</span>
                        </div>
                      )}

                      {product.badge && (
                        <span className="product-badge">
                          {product.badge}
                        </span>
                      )}

                      {product.stock <= 0 && (
                        <span className="out-of-stock-badge">
                          Out of Stock
                        </span>
                      )}

                      <span className="product-quick-view">
                        View Details <ArrowRight size={15} />
                      </span>
                    </div>
                  </button>

                  <div className="product-card-info">
                    <p className="product-category">{product.category}</p>

                    <button
                      className="product-name-button"
                      onClick={() => {
                        setSelected(product);
                        navTo("product");
                      }}
                    >
                      {product.name}
                    </button>

                    <div className="product-price-row">
                      <strong>{productPrice(product)}</strong>

                      <button
                        className="quick-add-button"
                        aria-label={`Add ${product.name} to bag`}
                        disabled={product.stock <= 0}
                        onClick={() => addToBag(product)}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="editorial-banner">
          <div className="editorial-image">
            <img
              src={data.settings.hero_image}
              alt="The RZIA’S AURA editorial collection"
              loading="lazy"
            />
          </div>

          <div className="editorial-copy">
            <p className="eyebrow">A SIGNATURE OF YOUR OWN</p>
            <h2>Elegance is not a trend. It is an attitude.</h2>
            <p>
              Discover thoughtfully chosen pieces that bring confidence,
              character and timeless beauty to your wardrobe.
            </p>

            <button
              className="button-outline"
              onClick={() => {
                setCategory("All");
                document.getElementById("shop")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              Discover the Edit <ArrowRight size={17} />
            </button>
          </div>
        </section>

        <section className="story-section">
          <div className="story-copy">
            <p className="eyebrow">OUR PHILOSOPHY</p>
            <h2>Made for the way you express yourself.</h2>
            <p>{data.settings.about_text}</p>

            <button
              className="text-link"
              onClick={() => {
                setInfo("Our Story");
                navTo("info");
              }}
            >
              Discover Our Story <ArrowRight size={16} />
            </button>
          </div>

          <div className="story-image">
            <img
              src={data.settings.hero_image}
              alt="RZIA’S AURA signature style"
              loading="lazy"
            />
          </div>
        </section>

        <section className="faq-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">HERE TO HELP</p>
              <h2>Frequently Asked Questions</h2>
            </div>

            <button
              className="text-link"
              onClick={() => {
                setInfo("FAQs");
                navTo("info");
              }}
            >
              All FAQs <ArrowRight size={16} />
            </button>
          </div>

          <div className="faq-list">
            {data.faqs.slice(0, 4).map((faq) => (
              <details key={faq.id}>
                <summary>
                  <span>{faq.question}</span>
                  <Plus size={17} />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="newsletter-section">
          <p className="eyebrow">A LITTLE AURA IN YOUR INBOX</p>
          <h2>Stay in the know.</h2>
          <p>
            Follow our journey for new collections, signature styles and
            brand updates.
          </p>

          {data.settings.instagram ? (
            <a
              className="button-primary"
              href={data.settings.instagram}
              target="_blank"
              rel="noreferrer"
            >
              Follow Our Instagram <Instagram size={17} />
            </a>
          ) : (
            <button
              className="button-primary"
              onClick={() => {
                setInfo("Contact");
                navTo("info");
              }}
            >
              Get in Touch <ArrowRight size={17} />
            </button>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <button
              className="brand-mark footer-brand-mark"
              onClick={() => navTo("home")}
            >
              <span className="brand-name">{data.settings.brand_name}</span>
              <span className="brand-tagline">{data.settings.tagline}</span>
            </button>

            <p>{data.settings.footer_text}</p>

            {data.settings.instagram && (
              <a
                href={data.settings.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <Instagram size={19} />
              </a>
            )}
          </div>

          <div className="footer-links">
            <h3>Explore</h3>
            <button
              onClick={() => {
                setCategory("All");
                navTo("home");
                document.getElementById("shop")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              Shop All
            </button>
            <button
              onClick={() => {
                setCategory("Women");
                navTo("home");
                document.getElementById("shop")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              Women
            </button>
            <button
              onClick={() => {
                setCategory("Men");
                navTo("home");
                document.getElementById("shop")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              Men
            </button>
            <button
              onClick={() => {
                setCategory("New Arrivals");
                navTo("home");
                document.getElementById("shop")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              New Arrivals
            </button>
          </div>

          <div className="footer-links">
            <h3>Information</h3>
            <button
              onClick={() => {
                setInfo("Our Story");
                navTo("info");
              }}
            >
              Our Story
            </button>
            <button
              onClick={() => {
                setInfo("FAQs");
                navTo("info");
              }}
            >
              FAQs
            </button>
            <button
              onClick={() => {
                setInfo("Contact");
                navTo("info");
              }}
            >
              Contact Us
            </button>
            <button
              onClick={() => {
                setInfo("Shipping & Returns");
                navTo("info");
              }}
            >
              Shipping & Returns
            </button>
          </div>

          <div className="footer-contact">
            <h3>Get in Touch</h3>

            {data.settings.address && (
              <p>
                <MapPin size={16} />
                {data.settings.address}
              </p>
            )}

            {data.settings.email && (
              <p>
                <Mail size={16} />
                <a href={`mailto:${data.settings.email}`}>
                  {data.settings.email}
                </a>
              </p>
            )}

            {data.settings.whatsapp && (
              <a
                className="footer-whatsapp"
                href={`https://wa.me/${data.settings.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                Contact via WhatsApp <ArrowRight size={15} />
              </a>
            )}

            {!data.settings.address &&
              !data.settings.email &&
              !data.settings.whatsapp && (
                <p>Contact details coming soon.</p>
              )}
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {data.settings.brand_name}. All rights
            reserved.
          </p>

          <button
            className="footer-admin-link"
            onClick={() => {
              setAdminData(data);
              setAdminTab("dashboard");
              navTo("admin");
            }}
          >
            Store Management
          </button>

          <p>Designed with elegance.</p>
        </div>
      </footer>

      {notice && (
        <div className="toast-notice" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
    </>
  );
            
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
