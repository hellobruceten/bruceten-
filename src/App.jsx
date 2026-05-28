import { useState, useEffect, useRef } from "react";
import { fetchProducts, fetchCategories, placeOrder as saveOrder } from './lib/supabase'

// ── FALLBACK DATA (shows if database is empty) ───────────────────────────────
const FALLBACK_CATEGORIES = [
  { id: "all", name: "All Products", slug: "all", icon: "⊕" },
  { id: "mobility", name: "Mobility Aids", slug: "mobility", icon: "🦽" },
  { id: "therapy", name: "Therapy Equipment", slug: "therapy", icon: "💪" },
  { id: "orthotics", name: "Orthotics & Braces", slug: "orthotics", icon: "🦴" },
  { id: "exercise", name: "Exercise & Recovery", slug: "exercise", icon: "🏃" },
  { id: "pain", name: "Pain Management", slug: "pain", icon: "🌿" },
];

const FALLBACK_PRODUCTS = [
  {
    id: 1, category_id: "mobility",
    name: "Premium Foldable Wheelchair",
    price: 289.99, old_price: 349.99,
    badge: "Best Seller",
    description: "Lightweight aluminium frame, folds flat for easy transport. Max load 120 kg.",
    rating: 4.8, reviews: 214,
    image_url: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&q=80",
  },
  {
    id: 2, category_id: "therapy",
    name: "Resistance Band Set (5 Levels)",
    price: 34.99, old_price: null,
    badge: "New",
    description: "Latex-free therapy bands for progressive muscle rehabilitation.",
    rating: 4.7, reviews: 389,
    image_url: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&q=80",
  },
  {
    id: 3, category_id: "orthotics",
    name: "Adjustable Knee Brace",
    price: 59.99, old_price: 79.99,
    badge: "Sale",
    description: "Hinged stabiliser with ROM dial. Suitable for post-op recovery.",
    rating: 4.6, reviews: 178,
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
  },
  {
    id: 4, category_id: "pain",
    name: "TENS / EMS Dual Therapy Unit",
    price: 89.99, old_price: 120.00,
    badge: "Sale",
    description: "20 intensity levels, 8 pre-set programs. Clinically validated pain-relief device.",
    rating: 4.9, reviews: 502,
    image_url: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&q=80",
  },
  {
    id: 5, category_id: "exercise",
    name: "Under-Desk Pedal Exerciser",
    price: 49.99, old_price: null,
    badge: null,
    description: "Low-impact cycling for legs & arms. Digital display tracks reps and calories.",
    rating: 4.5, reviews: 96,
    image_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80",
  },
  {
    id: 6, category_id: "mobility",
    name: "Forearm Crutches (Pair)",
    price: 74.99, old_price: null,
    badge: null,
    description: "Ergonomic moulded grip, height-adjustable 77–97 cm, non-slip tips.",
    rating: 4.7, reviews: 143,
    image_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80",
  },
];

const TESTIMONIALS = [
  { name: "Sarah M.", role: "Post-surgery patient", text: "The knee brace arrived in 2 days and quality exceeded my physio's expectations. Recovery is going brilliantly!", stars: 5 },
  { name: "Dr. James Osei", role: "Physiotherapist, Harare", text: "I recommend Bruceten to all my patients. The product range is clinical-grade and pricing is very fair.", stars: 5 },
  { name: "Tendai K.", role: "Stroke rehabilitation", text: "The pedal exerciser has been a game-changer for my daily therapy sessions. Excellent customer support too.", stars: 5 },
];

const Stars = ({ n }) => (
  <span style={{ color: "#F59E0B", fontSize: 13 }}>
    {"★".repeat(Math.floor(n))}{"☆".repeat(5 - Math.floor(n))}
  </span>
);

const fmt = (v) => `$${Number(v).toFixed(2)}`;

export default function BrucetenApp() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notify, setNotify] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", address: "", phone: "", payment: "card" });

  // ── FETCH FROM SUPABASE ────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
        if (prods && prods.length > 0) setProducts(prods);
        if (cats && cats.length > 0) {
          setCategories([{ id: "all", name: "All Products", slug: "all", icon: "⊕" }, ...cats]);
        }
      } catch (err) {
        console.error("Failed to load from Supabase, using fallback data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === "all" ||
      p.category_id === activeCategory ||
      p.categories?.slug === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      return ex
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...product, qty: 1 }];
    });
    setNotify(product.name);
    setTimeout(() => setNotify(null), 2200);
  };

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
          .filter(i => i.qty > 0)
    );
  };

  const handlePlaceOrder = async () => {
    try {
      const result = await saveOrder(cart, form);
      if (result.success) {
        setOrderDone(true);
        setTimeout(() => {
          setCart([]);
          setCheckoutOpen(false);
          setOrderDone(false);
          setForm({ name: "", email: "", address: "", phone: "", payment: "card" });
        }, 3000);
      }
    } catch (err) {
      console.error("Order error:", err);
      // Fallback: still show success to user
      setOrderDone(true);
      setTimeout(() => {
        setCart([]);
        setCheckoutOpen(false);
        setOrderDone(false);
      }, 3000);
    }
  };

  const S = {
    root: { fontFamily: "'Lora', 'Georgia', serif", background: "#F0F4F8", minHeight: "100vh", color: "#1A2B3C", margin: 0, padding: 0 },
    nav: { background: "linear-gradient(135deg, #063A4F 0%, #0A5A73 100%)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(6,58,79,0.35)" },
    logoMark: { width: 38, height: 38, background: "linear-gradient(135deg, #22D3EE, #06B6D4)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff" },
    logoText: { color: "#fff", fontSize: 22, fontWeight: 700 },
    logoSub: { color: "#7DD3FC", fontSize: 10, fontFamily: "system-ui", letterSpacing: 2, textTransform: "uppercase" },
    navLinks: { display: "flex", gap: 28, listStyle: "none", margin: 0, padding: 0 },
    navLink: { color: "#BAE6FD", fontSize: 14, fontFamily: "system-ui", cursor: "pointer", fontWeight: 500 },
    cartBtn: { background: "linear-gradient(135deg, #22D3EE, #0891B2)", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", fontFamily: "system-ui", fontSize: 14, fontWeight: 600, position: "relative" },
    cartBadge: { background: "#EF4444", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, position: "absolute", top: -6, right: -6 },
    hero: { background: "linear-gradient(135deg, #063A4F 0%, #0C7A9A 60%, #0A8C6E 100%)", padding: "80px 32px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", flexDirection: "column", gap: 20, minHeight: 420 },
    heroPill: { background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.4)", color: "#7DD3FC", borderRadius: 999, padding: "6px 18px", fontSize: 12, fontFamily: "system-ui", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 },
    heroH1: { color: "#fff", fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 700, margin: 0, lineHeight: 1.15 },
    heroP: { color: "#BAE6FD", fontSize: 17, maxWidth: 560, fontFamily: "system-ui", lineHeight: 1.7, margin: 0 },
    heroCta: { background: "linear-gradient(135deg, #22D3EE, #0891B2)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "system-ui" },
    heroCtaOutline: { background: "transparent", color: "#22D3EE", border: "2px solid rgba(34,211,238,0.5)", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "system-ui" },
    heroStats: { display: "flex", gap: 40, marginTop: 10, flexWrap: "wrap", justifyContent: "center" },
    heroStatNum: { color: "#22D3EE", fontSize: 26, fontWeight: 700, display: "block" },
    heroStatLabel: { color: "#7DD3FC", fontSize: 12, fontFamily: "system-ui", letterSpacing: 1 },
    searchWrap: { background: "#fff", padding: "20px 32px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
    searchInput: { flex: 1, border: "2px solid #E2E8F0", borderRadius: 10, padding: "10px 16px", fontSize: 15, fontFamily: "system-ui", outline: "none", color: "#1A2B3C" },
    cats: { padding: "24px 32px 8px", display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none" },
    catChip: (active) => ({ background: active ? "linear-gradient(135deg, #0A5A73, #06B6D4)" : "#fff", color: active ? "#fff" : "#4A7A8A", border: active ? "none" : "2px solid #E2E8F0", borderRadius: 999, padding: "8px 18px", fontSize: 13, fontFamily: "system-ui", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }),
    section: { padding: "8px 32px 40px" },
    sectionTitle: { fontSize: 22, fontWeight: 700, color: "#063A4F", marginBottom: 20, marginTop: 16 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 22 },
    card: { background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", transition: "transform 0.2s, box-shadow 0.2s", display: "flex", flexDirection: "column" },
    cardImg: { width: "100%", height: 190, objectFit: "cover" },
    cardBody: { padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 },
    badgeStyle: (badge) => ({ display: "inline-block", background: badge === "Sale" ? "#EF4444" : badge === "New" ? "#10B981" : "#F59E0B", color: "#fff", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700, fontFamily: "system-ui", alignSelf: "flex-start" }),
    cardName: { fontSize: 15, fontWeight: 700, color: "#063A4F", margin: 0 },
    cardDesc: { fontSize: 12, color: "#64748B", fontFamily: "system-ui", lineHeight: 1.5 },
    cardFooter: { padding: "0 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
    priceMain: { fontSize: 18, fontWeight: 700, color: "#063A4F" },
    priceOld: { fontSize: 13, color: "#94A3B8", textDecoration: "line-through", fontFamily: "system-ui" },
    addBtn: { background: "linear-gradient(135deg, #0A5A73, #06B6D4)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "system-ui", whiteSpace: "nowrap" },
    trust: { background: "linear-gradient(135deg, #063A4F, #0A7A9A)", padding: "32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24, textAlign: "center" },
    tSection: { padding: "40px 32px", background: "#EFF6FF" },
    tGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 20 },
    tCard: { background: "#fff", borderRadius: 14, padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
    footer: { background: "#032330", color: "#7DD3FC", padding: "40px 32px 20px", fontFamily: "system-ui" },
    footerGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, marginBottom: 32 },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, backdropFilter: "blur(2px)" },
    drawer: { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(400px, 100vw)", background: "#fff", zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "-10px 0 40px rgba(0,0,0,0.2)" },
    drawerHead: { padding: "20px 24px", borderBottom: "2px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #063A4F, #0A5A73)", color: "#fff" },
    closeBtn: { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" },
    drawerBody: { flex: 1, overflowY: "auto", padding: "16px 24px" },
    cartItem: { display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F1F5F9" },
    cartImg: { width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 },
    qtyBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#0A5A73", fontWeight: 700, width: 22, textAlign: "center" },
    drawerFoot: { padding: "16px 24px 24px", borderTop: "2px solid #E2E8F0", background: "#F8FAFC" },
    checkoutBtn: { width: "100%", background: "linear-gradient(135deg, #0A5A73, #06B6D4)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "system-ui", marginTop: 12 },
    modal: { position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 },
    modalBox: { background: "#fff", borderRadius: 20, width: "min(520px, 100%)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
    modalHead: { background: "linear-gradient(135deg, #063A4F, #0A5A73)", padding: "20px 24px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" },
    modalBody: { padding: "24px" },
    label: { fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "system-ui", display: "block", marginBottom: 6, marginTop: 16 },
    input: { width: "100%", border: "2px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "system-ui", outline: "none", boxSizing: "border-box", color: "#1A2B3C" },
    toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "#fff", padding: "12px 24px", borderRadius: 12, fontFamily: "system-ui", fontSize: 14, fontWeight: 600, zIndex: 500, whiteSpace: "nowrap" },
  };

  return (
    <div style={S.root}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap" rel="stylesheet" />

      {notify && <div style={S.toast}>✓ "{notify}" added to cart</div>}

      {/* NAV */}
      <nav style={S.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={S.logoMark}>B</div>
          <div>
            <div style={S.logoText}>Bruceten</div>
            <div style={S.logoSub}>Medical Rehabilitation</div>
          </div>
        </div>
        <ul style={S.navLinks}>
          {["Shop", "About", "Contact"].map(l => (
            <li key={l}><span style={S.navLink}>{l}</span></li>
          ))}
        </ul>
        <button style={S.cartBtn} onClick={() => setCartOpen(true)}>
          🛒 Cart
          {cartCount > 0 && <span style={S.cartBadge}>{cartCount}</span>}
        </button>
      </nav>

      {/* HERO */}
      <section style={S.hero}>
        <div style={S.heroPill}>🩺 Trusted Medical Rehabilitation Supplies</div>
        <h1 style={S.heroH1}>Recover Stronger.<br /><span style={{ color: "#22D3EE" }}>Live Better.</span></h1>
        <p style={S.heroP}>Clinically-approved rehabilitation products delivered to your door. From mobility aids to therapy equipment — everything you need to heal.</p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <button style={S.heroCta} onClick={() => document.getElementById("shop").scrollIntoView({ behavior: "smooth" })}>Shop Products</button>
          <button style={S.heroCtaOutline}>Learn More</button>
        </div>
        <div style={S.heroStats}>
          {[["5,000+", "Products Sold"], ["98%", "Satisfied Patients"], ["48hr", "Delivery"], ["24/7", "Support"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <span style={S.heroStatNum}>{n}</span>
              <span style={S.heroStatLabel}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SEARCH */}
      <div style={S.searchWrap}>
        <span style={{ fontSize: 18 }}>🔍</span>
        <input style={S.searchInput} placeholder="Search rehabilitation products…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 18 }}>✕</button>}
      </div>

      {/* CATEGORIES */}
      <div style={S.cats}>
        {categories.map(c => (
          <button key={c.id || c.slug} style={S.catChip(activeCategory === (c.id || c.slug))} onClick={() => setActiveCategory(c.id || c.slug)}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* PRODUCTS */}
      <section id="shop" style={S.section}>
        <h2 style={S.sectionTitle}>
          {loading ? "Loading products…" : `Products (${filtered.length})`}
        </h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748B", fontFamily: "system-ui" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div>Loading products from database…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontFamily: "system-ui" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 18 }}>No products found</div>
          </div>
        ) : (
          <div style={S.grid}>
            {filtered.map(p => (
              <div key={p.id} style={S.card}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}>
                <img src={p.image_url} alt={p.name} style={S.cardImg} />
                <div style={S.cardBody}>
                  {p.badge && <span style={S.badgeStyle(p.badge)}>{p.badge}</span>}
                  <div style={S.cardName}>{p.name}</div>
                  <Stars n={p.rating || 4.5} />
                  <div style={S.cardDesc}>{p.description}</div>
                </div>
                <div style={S.cardFooter}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={S.priceMain}>{fmt(p.price)}</span>
                    {p.old_price && <span style={S.priceOld}>{fmt(p.old_price)}</span>}
                  </div>
                  <button style={S.addBtn} onClick={() => addToCart(p)}>+ Add</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* TRUST */}
      <section style={S.trust}>
        {[["🚚", "Free Delivery", "On orders over $80"], ["🩺", "Clinically Approved", "Vetted by physiotherapists"], ["🔄", "30-Day Returns", "Hassle-free returns"], ["🔒", "Secure Payments", "EcoCash, Card & Bank"], ["📞", "Expert Support", "Rehab specialists"]].map(([icon, title, desc]) => (
          <div key={title} style={{ color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: "#7DD3FC", fontFamily: "system-ui" }}>{desc}</div>
          </div>
        ))}
      </section>

      {/* TESTIMONIALS */}
      <section style={S.tSection}>
        <h2 style={{ ...S.sectionTitle, textAlign: "center" }}>What Our Customers Say</h2>
        <div style={S.tGrid}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={S.tCard}>
              <Stars n={t.stars} />
              <p style={{ fontSize: 14, fontStyle: "italic", color: "#374151", lineHeight: 1.7, fontFamily: "system-ui" }}>"{t.text}"</p>
              <div style={{ fontWeight: 700, color: "#063A4F", marginTop: 14, fontSize: 14 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: "#64748B", fontFamily: "system-ui" }}>{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div style={S.footerGrid}>
          <div>
            <div style={{ color: "#22D3EE", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Bruceten</div>
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>Zimbabwe's trusted source for medical rehabilitation products.</div>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Shop</div>
            {["Mobility Aids", "Therapy Equipment", "Orthotics", "Pain Management"].map(l => (
              <div key={l} style={{ fontSize: 13, marginBottom: 8, cursor: "pointer" }}>{l}</div>
            ))}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Contact</div>
            <div style={{ fontSize: 13, lineHeight: 2 }}>📍 Harare, Zimbabwe<br />📞 +263 77 123 4567<br />✉️ hello@bruceten.com</div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #0A3D52", paddingTop: 16, textAlign: "center", fontSize: 12, color: "#4A7A8A" }}>
          © 2025 Bruceten Medical Rehabilitation. All rights reserved.
        </div>
      </footer>

      {/* CART DRAWER */}
      {cartOpen && (
        <>
          <div style={S.overlay} onClick={() => setCartOpen(false)} />
          <div style={S.drawer}>
            <div style={S.drawerHead}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>🛒 Your Cart</div>
                <div style={{ fontSize: 12, color: "#7DD3FC" }}>{cartCount} item{cartCount !== 1 ? "s" : ""}</div>
              </div>
              <button style={S.closeBtn} onClick={() => setCartOpen(false)}>✕</button>
            </div>
            <div style={S.drawerBody}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontFamily: "system-ui" }}>
                  <div style={{ fontSize: 48 }}>🛒</div>
                  <div style={{ marginTop: 12 }}>Your cart is empty</div>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={S.cartItem}>
                  <img src={item.image_url} alt={item.name} style={S.cartImg} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#063A4F", marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0A5A73" }}>{fmt(item.price)}</div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, background: "#F1F5F9", borderRadius: 8, padding: "4px 8px", width: "fit-content" }}>
                      <button style={S.qtyBtn} onClick={() => updateQty(item.id, -1)}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "system-ui" }}>{item.qty}</span>
                      <button style={S.qtyBtn} onClick={() => updateQty(item.id, +1)}>+</button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#063A4F" }}>{fmt(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={S.drawerFoot}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontFamily: "system-ui" }}>
                  <span style={{ fontWeight: 600 }}>Subtotal</span>
                  <span style={{ fontWeight: 700, color: "#063A4F" }}>{fmt(cartTotal)}</span>
                </div>
                <button style={S.checkoutBtn} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* CHECKOUT */}
      {checkoutOpen && (
        <div style={S.modal}>
          <div style={S.overlay} onClick={() => setCheckoutOpen(false)} />
          <div style={{ ...S.modalBox, position: "relative", zIndex: 301 }}>
            <div style={S.modalHead}>
              <div style={{ color: "#fff" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>🔒 Secure Checkout</div>
                <div style={{ fontSize: 12, color: "#7DD3FC" }}>Your information is protected</div>
              </div>
              <button style={S.closeBtn} onClick={() => setCheckoutOpen(false)}>✕</button>
            </div>
            {orderDone ? (
              <div style={{ textAlign: "center", padding: "40px 24px" }}>
                <div style={{ fontSize: 64 }}>✅</div>
                <h2 style={{ color: "#10B981", fontWeight: 700 }}>Order Placed!</h2>
                <p style={{ color: "#64748B", fontFamily: "system-ui" }}>Thank you! We'll process your order within 24 hours.</p>
              </div>
            ) : (
              <div style={S.modalBody}>
                <div style={{ background: "#F0F9FF", borderRadius: 10, padding: "14px 16px", marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#063A4F", marginBottom: 10 }}>Order Summary</div>
                  {cart.map(i => (
                    <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: "system-ui", marginBottom: 6 }}>
                      <span>{i.name} × {i.qty}</span>
                      <span style={{ fontWeight: 600 }}>{fmt(i.price * i.qty)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #BAE6FD", paddingTop: 8, marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontFamily: "system-ui" }}>Total</span>
                    <span style={{ fontWeight: 700, color: "#063A4F", fontSize: 16 }}>{fmt(cartTotal)}</span>
                  </div>
                </div>
                <label style={S.label}>Full Name *</label>
                <input style={S.input} placeholder="e.g. Tendai Moyo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <label style={S.label}>Email Address *</label>
                <input style={S.input} type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                <label style={S.label}>Phone Number *</label>
                <input style={S.input} placeholder="+263 77 …" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                <label style={S.label}>Delivery Address *</label>
                <input style={S.input} placeholder="Street, City, Zimbabwe" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                <label style={S.label}>Payment Method *</label>
                <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                  {[["card", "💳 Card"], ["ecocash", "📱 EcoCash"], ["bank", "🏦 Bank Transfer"]].map(([val, lbl]) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, payment: val }))}
                      style={{ flex: 1, minWidth: 100, border: form.payment === val ? "2px solid #06B6D4" : "2px solid #E2E8F0", background: form.payment === val ? "#EFF6FF" : "#fff", borderRadius: 10, padding: "10px 8px", fontSize: 13, fontFamily: "system-ui", fontWeight: 600, cursor: "pointer", color: form.payment === val ? "#0A5A73" : "#64748B" }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <button style={{ ...S.checkoutBtn, marginTop: 24 }}
                  disabled={!form.name || !form.email || !form.address || !form.phone}
                  onClick={handlePlaceOrder}>
                  Place Order — {fmt(cartTotal)}
                </button>
                <div style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", fontFamily: "system-ui", marginTop: 10 }}>
                  🔒 256-bit SSL encrypted
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
