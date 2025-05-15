import React, { useState, useEffect } from "react";
import { 
  Package, Plus, Search, Trash2, Edit3, LogOut, User, 
  ChevronLeft, ChevronRight, Filter, ShoppingBag, 
  Layers, Smartphone, Check, AlertCircle, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  creatorName?: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  profileImage?: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("inventory_token"));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("inventory_user");
    return saved ? JSON.parse(saved) : null;
  });

  // UI Navigation / Modal states
  const [activeTab, setActiveTab] = useState<"marketplace" | "android">("marketplace");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  // Auth Form
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, totalItems: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Product CRUD Modals / Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState(0);
  const [prodQty, setProdQty] = useState(0);
  const [prodImg, setProdImg] = useState("");
  const [prodError, setProdError] = useState("");
  const [prodLoading, setProdLoading] = useState(false);

  // Notification Banner
  const [banner, setBanner] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch products whenever search/sorting/pagination changes
  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [search, sortBy, sortOrder, page, token]);

  const triggerBanner = (text: string, type: "success" | "error" = "success") => {
    setBanner({ text, type });
    setTimeout(() => setBanner(null), 4000);
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "8",
        sortBy,
        sortOrder,
        ...(search ? { search } : {})
      });

      const res = await fetch(`/api/products?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, limit: 8, totalItems: 0, totalPages: 1 });
      } else {
        triggerBanner(data.error || "Failed to load products", "error");
      }
    } catch (err) {
      triggerBanner("Could not connect to database server", "error");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const url = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
    const body = authMode === "register" 
      ? { name: authName, email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("inventory_token", data.token);
        localStorage.setItem("inventory_user", JSON.stringify(data.user));
        triggerBanner(`Welcome back, ${data.user.name}!`);
        // Reset inputs
        setAuthName("");
        setAuthEmail("");
        setAuthPassword("");
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch (err) {
      setAuthError("Could not connect to server. Ensure port 3000 is open.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("inventory_token");
    localStorage.removeItem("inventory_user");
    setProducts([]);
    triggerBanner("Logged out successfully");
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdError("");
    setProdLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName,
          description: prodDesc,
          price: prodPrice,
          quantity: prodQty,
          image_url: prodImg || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerBanner("Product added successfully");
        setShowAddModal(false);
        // Reset Form
        setProdName("");
        setProdDesc("");
        setProdPrice(0);
        setProdQty(0);
        setProdImg("");
        setPage(1); // return to page 1 to see new product
        fetchProducts();
      } else {
        setProdError(data.error || "Failed to create product");
      }
    } catch (err) {
      setProdError("Network error during product creation");
    } finally {
      setProdLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setProdName(product.name);
    setProdDesc(product.description);
    setProdPrice(product.price);
    setProdQty(product.quantity);
    setProdImg(product.imageUrl || "");
    setProdError("");
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setProdError("");
    setProdLoading(true);

    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName,
          description: prodDesc,
          price: prodPrice,
          quantity: prodQty,
          image_url: prodImg || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerBanner(`Product updated! Version incremented to v${data.version}`);
        setShowEditModal(false);
        setSelectedProduct(null);
        fetchProducts();
      } else {
        setProdError(data.error || "Failed to update product");
      }
    } catch (err) {
      setProdError("Network error during product update");
    } finally {
      setProdLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${productName}"?`)) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerBanner("Product deleted successfully");
        fetchProducts();
      } else {
        triggerBanner(data.error || "Failed to delete product", "error");
      }
    } catch (err) {
      triggerBanner("Network error during deletion", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      
      {/* Alert Banners */}
      <AnimatePresence>
        {banner && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 ${
              banner.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {banner.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {banner.text}
          </motion.div>
        )}
      </AnimatePresence>

      {!token ? (
        /* Authentication Screen (Styled minimal & utility) */
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
              {authMode === "login" ? "Sign in to InvenSync" : "Create business account"}
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500 font-medium">
              Phase 1: Online Sync Ready
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 border border-slate-200 shadow-sm sm:rounded-2xl sm:px-10">
              <form onSubmit={handleAuthSubmit} className="space-y-5">
                {authMode === "register" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Business Name / Personal Name</label>
                    <input 
                      type="text" 
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full h-10 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="e.g. Acme Corporation"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                  <input 
                    type="password" 
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 flex items-center gap-2 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center disabled:opacity-50 text-sm"
                >
                  {authLoading ? "Synchronizing state..." : authMode === "login" ? "Sign In Securely" : "Register Credentials"}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <button 
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setAuthError("");
                  }}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold transition"
                >
                  {authMode === "login" 
                    ? "Need an account? Sign up here" 
                    : "Already registered? Sign in here"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full Layout (Sidebar + Main) */
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-900">
          
          {/* Sidebar Navigation */}
          <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-3 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">InvenSync</span>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-4">
              <button 
                onClick={() => setActiveTab("marketplace")}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === "marketplace" 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Layers className="w-4 h-4" />
                Dashboard / Inventory
              </button>
              <button 
                onClick={() => setActiveTab("android")}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === "android" 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Android Code View
              </button>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>

            {/* Profile Bar in Sidebar */}
            <div className="mt-auto border-t border-slate-100 p-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm border border-slate-300">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-bold text-slate-800">{user?.name || "Seller User"}</p>
                  <p className="truncate text-xs text-slate-500 font-mono">ID: {user?.id || "N/A"}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex flex-1 flex-col overflow-y-auto">
            
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 md:px-8 shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex md:hidden items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="font-bold tracking-tight text-slate-800">InvenSync</span>
                </div>
                <h1 className="hidden md:block text-lg font-bold text-slate-800">
                  {activeTab === "marketplace" ? "Inventory Management" : "Android Companion App"}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {activeTab === "marketplace" && (
                  <>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="h-10 w-40 sm:w-64 rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    </div>
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Product</span>
                    </button>
                  </>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="flex md:hidden p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Inner scroll viewport */}
            <div className="flex-1 p-6 md:p-8 space-y-6">
              
              {/* Tabs selector on mobile devices */}
              <div className="flex md:hidden border-b border-slate-200 pb-2 gap-4">
                <button 
                  onClick={() => setActiveTab("marketplace")}
                  className={`pb-2 text-sm font-bold border-b-2 transition ${
                    activeTab === "marketplace" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"
                  }`}
                >
                  Inventory
                </button>
                <button 
                  onClick={() => setActiveTab("android")}
                  className={`pb-2 text-sm font-bold border-b-2 transition ${
                    activeTab === "android" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"
                  }`}
                >
                  Android SDK
                </button>
              </div>

              {activeTab === "marketplace" ? (
                <>
                  {/* Top Stats (styled clean utility) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Total Valuation</div>
                      <div className="text-2xl font-bold text-slate-900">
                        ${products.reduce((acc, p) => acc + (p.price * p.quantity), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="mt-1 text-xs text-green-600">Online store valuation</div>
                    </div>
                    
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Active Stock</div>
                      <div className="text-2xl font-bold text-slate-900">
                        {products.reduce((acc, p) => acc + p.quantity, 0).toLocaleString()}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">Items inside pool</div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock Alert</div>
                      <div className={`text-2xl font-bold ${products.filter(p => p.quantity <= 5).length > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {products.filter(p => p.quantity <= 5).length}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">Critical restock levels</div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Sync</div>
                      <div className="text-2xl font-bold text-indigo-600">Ready</div>
                      <div className="mt-1 text-xs text-slate-400 font-mono">
                        Conflict layer: v{products.length > 0 ? Math.max(...products.map(p => p.version)) : 1}
                      </div>
                    </div>
                  </div>

                  {/* Filter bar options */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5" />
                      Filter & Sort controls
                    </span>
                    <div className="flex items-center gap-2">
                      <select 
                        value={sortBy} 
                        onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                        className="h-9 text-xs px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="createdAt">Date Created</option>
                        <option value="price">Price</option>
                        <option value="name">Product Name</option>
                        <option value="quantity">Stock Quantity</option>
                      </select>
                      <select 
                        value={sortOrder} 
                        onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                        className="h-9 text-xs px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                      </select>
                    </div>
                  </div>

                  {/* Clean Utility Inventory Grid Table */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <div className="min-w-[800px]">
                        {/* Table Header */}
                        <div className="grid grid-cols-6 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <div className="col-span-2">Product Information</div>
                          <div className="text-right">Unit Price</div>
                          <div className="text-right">Quantity</div>
                          <div className="text-center">Version</div>
                          <div className="text-right">Actions</div>
                        </div>

                        {/* Table Rows */}
                        {loadingProducts ? (
                          <div className="py-24 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs font-semibold text-slate-400 font-mono">Querying database pool...</span>
                            </div>
                          </div>
                        ) : products.length === 0 ? (
                          <div className="py-20 text-center">
                            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-sm font-bold text-slate-700">No Inventory Items</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Create products to start tracking store stock, monitoring version sequences, and logging items.</p>
                            <button 
                              onClick={() => setShowAddModal(true)}
                              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs transition"
                            >
                              Add First Product
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto">
                            {products.map((p) => {
                              const isOwner = p.createdBy === user?.id;
                              const isLowStock = p.quantity <= 5;
                              return (
                                <div key={p.id} className="grid grid-cols-6 items-center px-6 py-4 transition-colors hover:bg-slate-50">
                                  
                                  {/* Col 1 & 2: Product Info */}
                                  <div className="col-span-2 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                                      {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <Package className="w-5 h-5 text-slate-300" />
                                      )}
                                    </div>
                                    <div className="overflow-hidden">
                                      <h3 className="text-sm font-bold text-slate-800 truncate" title={p.name}>{p.name}</h3>
                                      <p className="text-xs text-slate-500 truncate mt-0.5">{p.description}</p>
                                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                                        <span>Owner: {p.creatorName || "Unknown"}</span>
                                        <span>•</span>
                                        <span>ID: #{p.id}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Col 3: Price */}
                                  <div className="text-right text-sm font-medium text-slate-800">
                                    ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>

                                  {/* Col 4: Quantity */}
                                  <div className="text-right">
                                    <span className={`text-sm font-semibold ${isLowStock ? "text-rose-600" : "text-slate-800"}`}>
                                      {p.quantity}
                                    </span>
                                    {isLowStock && (
                                      <div className="text-[10px] uppercase text-rose-400 font-bold leading-tight">
                                        {p.quantity === 0 ? "Out of Stock" : "Critical"}
                                      </div>
                                    )}
                                  </div>

                                  {/* Col 5: Version sequence */}
                                  <div className="flex justify-center flex-col items-center gap-1">
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                      isOwner ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                                    }`}>
                                      v{p.version}
                                    </span>
                                    {isOwner && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">My Item</span>
                                    )}
                                  </div>

                                  {/* Col 6: Actions */}
                                  <div className="flex justify-end gap-2">
                                    {isOwner ? (
                                      <>
                                        <button 
                                          onClick={() => handleEditClick(p)}
                                          className="h-8 w-8 rounded-md border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition flex items-center justify-center"
                                          title="Edit product"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteProduct(p.id, p.name)}
                                          className="h-8 w-8 rounded-md border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition flex items-center justify-center"
                                          title="Delete product"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-xs text-slate-400 italic">Read-only</span>
                                    )}
                                  </div>

                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pagination Footer */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm">
                      <span className="text-slate-500">
                        Showing page <b>{page}</b> of <b>{pagination.totalPages}</b> ({pagination.totalItems} total items)
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-50 transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          disabled={page === pagination.totalPages}
                          onClick={() => setPage(page + 1)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-50 transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer metadata tracks */}
                  <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 border-t border-slate-100 pt-4">
                    <p>Phase 1: Online Mode Active. Versioning tracking enabled for conflict resolution preparation.</p>
                    <p>Last backend sync: 2 minutes ago</p>
                  </div>
                </>
              ) : (
                /* Android Companion documentation code view (styled beautiful minimal) */
                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Android Companion App Integration</h3>
                      <p className="text-xs text-slate-500">Structured layout mirroring backend API models and Jetpack state managers.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-800">1. Clean Architecture</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Perfect separation of API services, Repository caches, unified StateFlow ViewModels, and Jetpack Compose screens.</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-800">2. Synchronization Versioning</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Contains complete version sequences on product records (`version: Int`), tracking local modifications and conflicts.</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-800">3. Retrofit Network Gateway</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">A fully-typed API client matching route signatures, handling secure token exchanges during session launches.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 text-sm">Created Companion Source Files inside workspace:</h4>
                    <ul className="text-xs space-y-2 text-slate-400 font-mono bg-slate-900 p-4 rounded-xl shadow-inner max-h-60 overflow-y-auto leading-relaxed">
                      <li className="text-emerald-400">✓ /android/MainActivity.kt (Navigation router & App initialization)</li>
                      <li className="text-emerald-400">✓ /android/data/remote/NetworkModels.kt (Payload transfer models)</li>
                      <li className="text-emerald-400">✓ /android/data/remote/ApiService.kt (Retrofit interface parameters)</li>
                      <li className="text-emerald-400">✓ /android/data/repository/Repository.kt (Data sources abstraction manager)</li>
                      <li className="text-emerald-400">✓ /android/viewmodel/InventoryViewModel.kt (Unified UI state dispatcher)</li>
                      <li className="text-emerald-400">✓ /android/ui/auth/LoginScreen.kt (Authentication view layout)</li>
                      <li className="text-emerald-400">✓ /android/ui/auth/RegisterScreen.kt (Registration view layout)</li>
                      <li className="text-emerald-400">✓ /android/ui/products/ProductListScreen.kt (List grid & search interface)</li>
                      <li className="text-emerald-400">✓ /android/ui/products/ProductDetailScreen.kt (Product specifications)</li>
                      <li className="text-emerald-400">✓ /android/ui/products/AddProductScreen.kt (New product generator view)</li>
                      <li className="text-emerald-400">✓ /android/ui/products/EditProductScreen.kt (Incremental update controls view)</li>
                    </ul>
                    <p className="text-xs text-slate-400 italic">These files are fully saved inside the project workspace directory under `/android/*` for seamless exporting and integration.</p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Add Product Modal (Styled clean utility / minimal) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">Add New Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-semibold">×</button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Product Name</label>
                <input 
                  type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="e.g. Latitude 7420 Business Laptop"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea 
                  required value={prodDesc} onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="e.g. High-performance enterprise laptop with Intel Core i7..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price (USD)</label>
                  <input 
                    type="number" min={0} step="any" required value={prodPrice || ""} onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="1299.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Quantity</label>
                  <input 
                    type="number" min={0} required value={prodQty || ""} onChange={(e) => setProdQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="42"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Image URL (Optional)</label>
                <input 
                  type="url" value={prodImg} onChange={(e) => setProdImg(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="https://example.com/image.png"
                />
              </div>

              {prodError && (
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>{prodError}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-sm">
                <button 
                  type="button" onClick={() => setShowAddModal(false)}
                  className="h-10 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={prodLoading}
                  className="flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {prodLoading ? "Creating..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal (Styled clean utility / minimal) */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">Edit Product Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-semibold">×</button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-800 leading-normal font-medium">
                <Info className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>Editing this product automatically increments its conflict synchronization version sequence from <b>v{selectedProduct.version}</b> to <b>v{selectedProduct.version + 1}</b>.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Product Name</label>
                <input 
                  type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea 
                  required value={prodDesc} onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price (USD)</label>
                  <input 
                    type="number" min={0} step="any" required value={prodPrice} onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Quantity</label>
                  <input 
                    type="number" min={0} required value={prodQty} onChange={(e) => setProdQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Image URL (Optional)</label>
                <input 
                  type="url" value={prodImg} onChange={(e) => setProdImg(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              {prodError && (
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>{prodError}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-sm">
                <button 
                  type="button" onClick={() => setShowEditModal(false)}
                  className="h-10 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={prodLoading}
                  className="flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {prodLoading ? "Syncing update..." : "Apply Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
