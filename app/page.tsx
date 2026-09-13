"use client";
import { useState, useEffect, useRef } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  img: string;
  category?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  locationUrl?: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: "admin_review" | "store_preparing" | "ready_for_delivery" | "delivered";
  date: string;
  deliveredAt?: string;
}

interface RegisteredUser {
  phone: string;
  name: string;
  city: string;
  street: string;
  locationUrl: string;
  verificationCode: string;
  isVerified: boolean;
}

const IRAQ_CITIES = [
  "هەولێر (Erbil)",
  "سلێمانی (Sulaymaniyah)",
  "دهۆک (Duhok)",
  "هەڵەبجە (Halabja)",
  "کەرکووک (Kirkuk)",
  "بەغدا (Baghdad)",
  "بەسرە (Basra)",
  "نەینەوا / مووسڵ (Nineveh)",
  "ئەنبار (Anbar)",
  "بابل (Babil)",
  "دیالە (Diyala)",
  "کەربەلا (Karbala)",
  "نەجەف (Najaf)",
  "قادسیە / دیوانیە (Al-Qadisiyyah)",
  "سەڵاحەدین (Salah al-Din)",
  "واسیت / کووت (Wasit)",
  "میسان / عەمارە (Maysan)",
  "زیقار / ناسریە (Dhi Qar)",
  "موسەننا / سەماوە (Al-Muthanna)"
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["پاککەرەوە", "game"]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);

  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);

  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModalUser, setShowLoginModalUser] = useState(false);
  const [showOtpInputModal, setShowOtpInputModal] = useState(false);
  const [showVerifiedAdminModal, setShowVerifiedAdminModal] = useState(false);

  // Signup form states
  const [regName, setRegName] = useState("");
  const [regPrefix, setRegPrefix] = useState("0750");
  const [regPhone, setRegPhone] = useState("");
  const [regCity, setRegCity] = useState(IRAQ_CITIES[0]);
  const [regStreet, setRegStreet] = useState("");
  const [regLocationUrl, setRegLocationUrl] = useState("");
  const [regLocLoading, setRegLocLoading] = useState(false);
  const [pendingOtpPhone, setPendingOtpPhone] = useState("");
  const [enteredOtpCode, setEnteredOtpCode] = useState("");

  // Login form state
  const [loginPrefix, setLoginPrefix] = useState("0750");
  const [loginPhone, setLoginPhone] = useState("");

  // Checkout inputs
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderStreet, setOrderStreet] = useState("");
  const [orderCity, setOrderCity] = useState("");
  const [orderLocationUrl, setOrderLocationUrl] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoaded, setIsLoaded] = useState(false);

  // Roles: Admin, Store, Delivery
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStore, setIsStore] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);

  const [passwordInput, setPasswordInput] = useState("");
  const [showLoginModal, setShowLoginModal] = useState<"admin" | "store" | "delivery" | null>(null);

  // Add Product states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categorySelect, setCategorySelect] = useState("پاککەرەوە");
  const [selectedImage, setSelectedImage] = useState<string>("");

  const prevUnverifiedCount = useRef<number>(0);

  const playBigAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {}
  };

  const fetchLiveData = async () => {
    try {
      const res = await fetch("/api/store", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.products) setProducts(data.products);
        if (data.categories) setCategories(data.categories);
        if (data.orders) setOrders(data.orders);
        if (data.registeredUsers) {
          const list: RegisteredUser[] = data.registeredUsers;
          const unverifiedList = list.filter((u) => !u.isVerified);

          if (unverifiedList.length > prevUnverifiedCount.current && prevUnverifiedCount.current !== 0) {
            playBigAlertSound();
          }
          prevUnverifiedCount.current = unverifiedList.length;
          setRegisteredUsers(list);
        }
      }
    } catch (err) {
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchLiveData();
    const timer = setInterval(fetchLiveData, 2000);

    const savedUserSession = localStorage.getItem("current_logged_user");
    if (savedUserSession) {
      try {
        setCurrentUser(JSON.parse(savedUserSession));
      } catch (e) {}
    }

    return () => clearInterval(timer);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showLoginModal === "admin") {
      if (passwordInput === "harzaniawn987") {
        setIsAdmin(true);
        setShowLoginModal(null);
        setPasswordInput("");
      } else {
        alert("وشەی نهێنی ئەدمین هەڵەیە!");
      }
    } else if (showLoginModal === "store") {
      if (passwordInput === "store123") {
        setIsStore(true);
        setShowLoginModal(null);
        setPasswordInput("");
      } else {
        alert("وشەی نهێنی دوکان هەڵەیە!");
      }
    } else if (showLoginModal === "delivery") {
      if (passwordInput === "del123") {
        setIsDelivery(true);
        setShowLoginModal(null);
        setPasswordInput("");
      } else {
        alert("وشەی نهێنی دلیڤەری هەڵەیە!");
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const payload = {
      name: name.trim(),
      price: Number(price),
      stock: Number(stock) || 0,
      category: categorySelect || "پاککەرەوە",
      img: selectedImage || "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600",
    };

    setName("");
    setPrice("");
    setStock("");
    setSelectedImage("");

    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_PRODUCT", payload }),
      });
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {}
  };

  const handleAddNewHashtag = async () => {
    const newTag = prompt("ناوی هاشتاگە نوێیەکە بنووسە:");
    if (!newTag || !newTag.trim()) return;

    const cleanTag = newTag.trim().replace(/^#/, "");
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_CATEGORY", payload: { category: cleanTag } }),
      });
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (err) {}
  };

  const handleUpdateProductCategory = async (productId: number, newCat: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, category: newCat } : p))
    );
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_PRODUCT_CATEGORY", payload: { id: productId, category: newCat } }),
      });
    } catch (err) {}
  };

  const handleDeleteProduct = async (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_PRODUCT", payload: { id } }),
      });
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {}
  };

  const handleUpdateStock = async (id: number, newStock: number) => {
    const stockVal = Math.max(0, newStock);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: stockVal } : p))
    );
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_STOCK", payload: { id, stock: stockVal } }),
      });
    } catch (err) {}
  };

  const handleRegGetLocation = () => {
    setRegLocLoading(true);
    if (!navigator.geolocation) {
      alert("مۆبایلەکەت پشتیوانی GPS ناکات.");
      setRegLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setRegLocationUrl(`https://www.google.com/maps?q=${lat},${lng}`);
        setRegLocLoading(false);
      },
      () => {
        setRegLocLoading(false);
        alert("⚠️ تکایە GPS پێبکە و ڕێگەپێدان بدە.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || regPhone.length < 7 || !regStreet.trim() || !regLocationUrl) {
      alert("تکایە هەموو خانەکان پربکەرەوە و لۆکەیشنی GPS دیاری بکە.");
      return;
    }

    const fullPhone = `${regPrefix}${regPhone}`;
    const payload = {
      phone: fullPhone,
      name: regName.trim(),
      city: regCity,
      street: regStreet.trim(),
      locationUrl: regLocationUrl,
    };

    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REGISTER_USER", payload }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingOtpPhone(fullPhone);
        setShowSignupModal(false);
        setShowOtpInputModal(true);
        fetchLiveData();
      }
    } catch (err) {}
  };

  const handleVerifySignupCode = async () => {
    const targetUser = registeredUsers.find((u) => u.phone === pendingOtpPhone);
    if (!targetUser) return;

    if (enteredOtpCode.trim() === targetUser.verificationCode) {
      try {
        const res = await fetch("/api/store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "VERIFY_REGISTER_CODE", payload: { phone: pendingOtpPhone, code: enteredOtpCode.trim() } }),
        });
        const data = await res.json();
        if (data.success) {
          const verifiedUser = data.registeredUsers.find((u: RegisteredUser) => u.phone === pendingOtpPhone);
          setCurrentUser(verifiedUser);
          localStorage.setItem("current_logged_user", JSON.stringify(verifiedUser));
          setShowOtpInputModal(false);
          setEnteredOtpCode("");
          alert("تۆمارکردن و پشکنین بە سەرکەوتوویی تەواو بوو!");
        }
      } catch (e) {}
    } else {
      alert("کۆدەکە هەڵەیە! سەیری واتسአپ بکە کە ئەدمین بۆی ناردووی.");
    }
  };

  const handleLoginUser = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = `${loginPrefix}${loginPhone}`;
    const foundUser = registeredUsers.find((u) => u.phone === fullPhone && u.isVerified);

    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem("current_logged_user", JSON.stringify(foundUser));
      setShowLoginModalUser(false);
      setLoginPhone("");
      alert("بە سەرکەوتوویی چوویە ژوورەوە!");
    } else {
      alert("ئەم ژمارەیە تۆمار نەکراوە یان هێشتا ڤێریفای نەکراوە!");
    }
  };

  const handleAdminSendOtpWhatsApp = (user: RegisteredUser) => {
    const msg = `سڵاو بەڕێز ${user.name}، کۆدی پشکنینی تۆ بۆ پشتڕاستکردنەوەی هەژمارەکەت لە هەرزانی ئاون ئەمەیە: ${user.verificationCode}`;
    const cleanPhone = user.phone.startsWith("0") ? user.phone.substring(1) : user.phone;
    window.open(`https://wa.me/964${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDeleteRegisteredUser = async (phone: string) => {
    if (!confirm(`دڵنیایت لە سڕینەوەی ئەم هژمارەیە؟`)) return;
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_REGISTERED_USER", payload: { phone } }),
      });
      const data = await res.json();
      if (data.registeredUsers) setRegisteredUsers(data.registeredUsers);
    } catch (e) {}
  };

  const handleOpenCheckout = () => {
    if (!currentUser) {
      alert("تکایە سەرەتا خۆت تۆمار بکە (Sign Up) یان لۆگین بە!");
      setShowLoginModalUser(true);
      return;
    }
    setOrderStreet(currentUser.street);
    setOrderCity(currentUser.city);
    setOrderLocationUrl(currentUser.locationUrl);
    setShowCheckout(true);
  };

  const handleFinalSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const fullAddress = `${orderCity} - ${orderStreet.trim()}`;
    const payload = {
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      customerAddress: fullAddress,
      locationUrl: orderLocationUrl,
      items: cart.map((c) => ({
        name: c.product.name,
        quantity: c.quantity,
        price: c.product.price,
      })),
      total: totalCartAmount,
    };

    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_ORDER", payload }),
      });
      const data = await res.json();
      if (data.success) {
        setCart([]);
        setShowCheckout(false);
        setOrderSuccess(true);
        fetchLiveData();
      }
    } catch (e) {}
  };

  const handleSendToStore = async (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "store_preparing" as const } : o))
    );
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_TO_STORE", payload: { orderId } }),
      });
    } catch (err) {}
  };

  const handleReadyForDelivery = async (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "ready_for_delivery" as const } : o))
    );
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "READY_FOR_DELIVERY", payload: { orderId } }),
      });
    } catch (err) {}
  };

  const handleMarkDelivered = async (orderId: number) => {
    const now = new Date();
    const timeStr = `${now.toLocaleDateString("en-GB")} | ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "delivered" as const, deliveredAt: timeStr } : o))
    );
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELIVER_ORDER", payload: { orderId } }),
      });
    } catch (err) {}
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("ئایا دڵنیایت لە هەڵوەشاندنەوەی ئەم داواکارییە؟ کاڵاکان دەگەڕێنەوە ناو ستۆک.")) return;
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL_ORDER", payload: { orderId } }),
      });
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
      if (data.products) setProducts(data.products);
    } catch (err) {}
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert("ناتوانیت زیاتر لە عەدەدی بەردەست زیاد بکەیت!");
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert("زیاتر لە عەدەدی ناو ستۆک بەردەست نییە!");
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products.filter((p) => {
    const cleanSearch = searchQuery.toLowerCase().trim().replace(/^#/, "");
    const matchSearch =
      p.name.toLowerCase().includes(cleanSearch) ||
      (p.category && p.category.toLowerCase().includes(cleanSearch));

    if (selectedCategory === "all") return matchSearch;
    return matchSearch && p.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const adminOrders = orders.filter((o) => o.status === "admin_review");
  const storeOrders = orders.filter((o) => o.status === "store_preparing");
  const deliveryOrders = orders.filter((o) => o.status === "ready_for_delivery");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const unverifiedUsersCount = registeredUsers.filter((u) => !u.isVerified).length;

  if (!isLoaded)
    return (
      <div style={{ backgroundColor: "#171717", color: "#fff", minHeight: "100vh", padding: "30px", textAlign: "center" }}>
        داگرتنی زانیارییەکان لە سێرڤەر...
      </div>
    );

  return (
    <main dir="rtl" style={{ backgroundColor: "#171717", color: "#ffffff", minHeight: "100vh", padding: "16px 16px 100px 16px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* سەرپەڕە */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "20px", borderBottom: "1px solid #262626", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#3b82f6", margin: 0 }}>
              هەرزانی ئاون
            </h1>
            <p style={{ fontSize: "12px", color: "#a3a3a3", marginTop: "4px", margin: 0 }}>فرۆشگای فەرمی هەرزانی ئاون بە نرخی دیناری عێراقی (IQD)</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {currentUser ? (
              <div style={{ backgroundColor: "#1e293b", border: "1px solid #3b82f6", padding: "8px 14px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span>👤 <strong style={{ color: "#60a5fa" }}>{currentUser.name}</strong></span>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem("current_logged_user");
                  }}
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "none", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "11px" }}
                >
                  دەرچوون
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setShowSignupModal(true)}
                  style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "9px 14px", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
                >
                  👤 خۆتۆمارکردن (Sign Up)
                </button>
                <button
                  onClick={() => setShowLoginModalUser(true)}
                  style={{ backgroundColor: "#334155", color: "#fff", border: "none", padding: "9px 14px", borderRadius: "10px", fontSize: "12px", cursor: "pointer" }}
                >
                  چوونەژوورەوە (Login)
                </button>
              </div>
            )}

            {!isStore ? (
              <button
                onClick={() => setShowLoginModal("store")}
                style={{ backgroundColor: "#262626", color: "#38bdf8", padding: "9px 12px", borderRadius: "10px", border: "1px solid #0284c7", fontSize: "12px", cursor: "pointer" }}
              >
                🏪 دوکان
              </button>
            ) : (
              <button
                onClick={() => setIsStore(false)}
                style={{ backgroundColor: "#0284c7", color: "#fff", padding: "9px 12px", borderRadius: "10px", border: "none", fontSize: "12px", cursor: "pointer" }}
              >
                دەرچوون لە دوکان
              </button>
            )}

            {!isDelivery ? (
              <button
                onClick={() => setShowLoginModal("delivery")}
                style={{ backgroundColor: "#262626", color: "#fbbf24", padding: "9px 12px", borderRadius: "10px", border: "1px solid #d97706", fontSize: "12px", cursor: "pointer" }}
              >
                🛵 دلیڤەری
              </button>
            ) : (
              <button
                onClick={() => setIsDelivery(false)}
                style={{ backgroundColor: "#b45309", color: "#fff", padding: "9px 12px", borderRadius: "10px", border: "none", fontSize: "12px", cursor: "pointer" }}
              >
                دەرچوون لە دلیڤەری
              </button>
            )}

            {!isAdmin ? (
              <button
                onClick={() => setShowLoginModal("admin")}
                style={{ backgroundColor: "#262626", color: "#a3a3a3", padding: "9px 12px", borderRadius: "10px", border: "1px solid #404040", fontSize: "12px", cursor: "pointer", position: "relative" }}
              >
                🔒 ئەدمین
                {unverifiedUsersCount > 0 && (
                  <span style={{ position: "absolute", top: "-6px", right: "-6px", backgroundColor: "#ef4444", color: "#fff", fontSize: "10px", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    {unverifiedUsersCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsAdmin(false)}
                style={{ backgroundColor: "#dc2626", color: "#fff", padding: "9px 12px", borderRadius: "10px", border: "none", fontSize: "12px", cursor: "pointer" }}
              >
                دەرچوون لە ئەدمین
              </button>
            )}
          </div>
        </header>

        {orderSuccess && (
          <div style={{ marginTop: "16px", backgroundColor: "#064e3b", border: "1px solid #10b981", color: "#6ee7b7", padding: "14px", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>داواکارییەکەت بە سەرکەوتوویی نێردرا! 🎉</span>
            <button onClick={() => setOrderSuccess(false)} style={{ backgroundColor: "#047857", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer" }}>باشە</button>
          </div>
        )}

        {/* مۆداڵی لۆگینی ئەدمین و ستۆف */}
        {showLoginModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "1px solid #404040", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "380px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", marginTop: 0 }}>
                {showLoginModal === "admin" && "🔒 چوونەژوورەوەی ئەدمین"}
                {showLoginModal === "store" && "🏪 چوونەژوورەوەی دوکان (Store)"}
                {showLoginModal === "delivery" && "🛵 چوونەژوورەوەی دلیڤەری"}
              </h3>
              <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="password"
                  placeholder="وشەی نهێنی بنووسە..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px", color: "#fff", outline: "none" }}
                  required
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>
                    چوونەژوورەوە
                  </button>
                  <button type="button" onClick={() => setShowLoginModal(null)} style={{ flex: 1, backgroundColor: "#404040", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer" }}>
                    داخستن
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 👤 مۆداڵی خۆتۆمارکردن (Sign Up) بۆ کڕیار */}
        {showSignupModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "2px solid #2563eb", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "440px", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#60a5fa", margin: "0 0 14px 0", borderBottom: "1px solid #404040", paddingBottom: "10px" }}>
                📝 خۆتۆمارکردن لە هەرزانی ئاون
              </h2>
              <form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="text"
                  placeholder="ناوی سیانی تەواو"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  style={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none" }}
                  required
                />

                <div>
                  <label style={{ fontSize: "11px", color: "#a3a3a3", display: "block", marginBottom: "4px" }}>هێڵی مۆبایل:</label>
                  <div style={{ display: "flex", gap: "8px" }} dir="ltr">
                    <select
                      value={regPrefix}
                      onChange={(e) => setRegPrefix(e.target.value)}
                      style={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px", color: "#60a5fa", fontWeight: "bold", outline: "none" }}
                    >
                      <option value="0750">0750</option>
                      <option value="0751">0751</option>
                      <option value="0770">0770</option>
                      <option value="0771">0771</option>
                      <option value="0780">0780</option>
                    </select>
                    <input
                      type="tel"
                      maxLength={7}
                      placeholder="xxxxxxx"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
                      style={{ flex: 1, backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none", fontFamily: "monospace" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: "#a3a3a3", display: "block", marginBottom: "4px" }}>پارێزگا / شار:</label>
                  <select
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    style={{ width: "100%", backgroundColor: "#171717", border: "1px solid #3b82f6", borderRadius: "10px", padding: "10px 14px", color: "#60a5fa", fontSize: "13px", outline: "none", fontWeight: "bold" }}
                  >
                    {IRAQ_CITIES.map((c) => (
                      <option key={c} value={c}>📍 {c}</option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="ناوی گەڕەک و کۆڵان"
                  value={regStreet}
                  onChange={(e) => setRegStreet(e.target.value)}
                  style={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none" }}
                  required
                />

                <div style={{ backgroundColor: "#171717", padding: "10px", borderRadius: "10px", border: "1px solid #404040", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={handleRegGetLocation}
                    disabled={regLocLoading}
                    style={{ backgroundColor: "#262626", border: "1px solid #3b82f6", color: "#fff", padding: "10px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    {regLocLoading ? "وەرگرتنی GPS..." : regLocationUrl ? "✓ لۆکەیشنی GPS وەرگیرا" : "📍 دیاریکردنی شوێن بە خودکار (GPS) پێویستە"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
                    خۆتۆمارکردن و داواکردنی کۆد 🚀
                  </button>
                  <button type="button" onClick={() => setShowSignupModal(false)} style={{ flex: 1, backgroundColor: "#404040", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>
                    داخستن
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 🔑 مۆداڵی چوونەژوورەوەی کڕیار (Login) */}
        {showLoginModalUser && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "1px solid #404040", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "360px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#60a5fa", margin: "0 0 12px 0" }}>چوونەژوورەوە بە ژمارەی مۆبایل</h3>
              <form onSubmit={handleLoginUser} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", gap: "8px" }} dir="ltr">
                  <select
                    value={loginPrefix}
                    onChange={(e) => setLoginPrefix(e.target.value)}
                    style={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px", color: "#60a5fa", fontWeight: "bold", outline: "none" }}
                  >
                    <option value="0750">0750</option>
                    <option value="0751">0751</option>
                    <option value="0770">0770</option>
                    <option value="0771">0771</option>
                    <option value="0780">0780</option>
                  </select>
                  <input
                    type="tel"
                    maxLength={7}
                    placeholder="xxxxxxx"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ""))}
                    style={{ flex: 1, backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none", fontFamily: "monospace" }}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
                    چوونەژوورەوە ✅
                  </button>
                  <button type="button" onClick={() => setShowLoginModalUser(false)} style={{ flex: 1, backgroundColor: "#404040", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer" }}>
                    داخستن
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 💬 مۆداڵی چاوەڕوانی کڕیار لە کاتی ساین ئەپ بۆ وەرگرتنی کۆد */}
        {showOtpInputModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "2px solid #25D366", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "380px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>⏳</div>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#25D366", margin: "0 0 10px 0" }}>
                چاوەڕێی کۆدی پشکنین بە
              </h3>
              <p style={{ fontSize: "13px", color: "#d4d4d4", lineHeight: "1.6", margin: "0 0 16px 0" }}>
                خۆتۆمارکردنەکەت سەرکەوتوو بوو! ئەدمین ئێستا کۆدەکەت لە واتسአپ بۆ دەنێرێت.
                <br />
                <span style={{ fontSize: "12px", color: "#fbbf24" }}>کاتێک کۆدەکەت لە واتسአپ پێگەیشت، لێرە بینوسە:</span>
              </p>

              <input
                type="text"
                maxLength={4}
                placeholder="کۆدە ٤ ژمارەییەکە..."
                value={enteredOtpCode}
                onChange={(e) => setEnteredOtpCode(e.target.value.replace(/\D/g, ""))}
                style={{ width: "100%", boxSizing: "border-box", backgroundColor: "#171717", border: "1px solid #25D366", borderRadius: "10px", padding: "12px", color: "#fff", textAlign: "center", fontSize: "20px", letterSpacing: "6px", outline: "none", fontFamily: "monospace", marginBottom: "16px" }}
              />

              <button
                onClick={handleVerifySignupCode}
                style={{ width: "100%", backgroundColor: "#25D366", color: "#000", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
              >
                پشتڕاستکردنەوە و چوونەژوورەوە ✅
              </button>
            </div>
          </div>
        )}

        {/* پۆستەری دوکان */}
        {isStore && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <section style={{ backgroundColor: "#1e293b", border: "2px solid #38bdf8", borderRadius: "20px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #475569", paddingBottom: "14px", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#38bdf8", margin: 0 }}>
                    🏪 پۆستەری ئامادەکردنی کاڵاکان لە دوکان
                  </h2>
                </div>
                <span style={{ fontSize: "16px", fontWeight: "bold", backgroundColor: "#0f172a", color: "#38bdf8", padding: "6px 14px", borderRadius: "12px", border: "1px solid #38bdf8" }}>
                  {storeOrders.length} پۆستەر
                </span>
              </div>

              {storeOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#0f172a", borderRadius: "16px", border: "1px solid #334155" }}>
                  <p style={{ fontSize: "16px", color: "#94a3b8", margin: 0 }}>هیچ داواکارییەک نییە 😴</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
                  {storeOrders.map((o) => (
                    <div key={o.id} style={{ backgroundColor: "#0f172a", border: "2px solid #38bdf8", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "10px", marginBottom: "12px" }}>
                          <span style={{ backgroundColor: "#0284c7", color: "#fff", fontSize: "12px", fontWeight: "bold", padding: "3px 8px", borderRadius: "6px" }}>📦 پۆستەری دوکان</span>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{o.date}</span>
                        </div>
                        <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "12px", border: "1px solid #475569", marginBottom: "14px" }}>
                          {o.items.map((it, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                              <span style={{ fontSize: "16px", fontWeight: "900", color: "#ffffff" }}>{it.name}</span>
                              <span style={{ backgroundColor: "#f59e0b", color: "#000", fontWeight: "900", fontSize: "16px", padding: "2px 10px", borderRadius: "8px" }}>{it.quantity} دانە</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                          <div>👤 کڕیار: <span style={{ fontWeight: "bold", color: "#fff" }}>{o.customerName}</span></div>
                          <div>📍 ناونیشان: {o.customerAddress}</div>
                        </div>
                      </div>
                      <button onClick={() => handleReadyForDelivery(o.id)} style={{ marginTop: "16px", backgroundColor: "#f59e0b", color: "#000", border: "none", padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: "900", cursor: "pointer" }}>
                        ئامادەکرا و تەواو بوو ⬅ ناردن بۆ دلیڤەری 🛵
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* پانێڵی دلیڤەری */}
        {isDelivery && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <section style={{ backgroundColor: "#262626", border: "2px solid #f59e0b", borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#fbbf24", margin: "0 0 16px 0" }}>🛵 پانێڵی دلیڤەری</h2>
              {deliveryOrders.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#a3a3a3", textAlign: "center", padding: "20px" }}>هیچ داواکارییەک نییە 😴</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {deliveryOrders.map((o) => (
                    <div key={o.id} style={{ backgroundColor: "#171717", border: "1px solid #f59e0b", padding: "16px", borderRadius: "14px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "16px" }}>کڕیار: {o.customerName}</div>
                        <div style={{ fontSize: "14px", marginTop: "6px" }}>📞 مۆبایل: <a href={`tel:${o.customerPhone}`} style={{ color: "#60a5fa" }}>{o.customerPhone}</a></div>
                        <div style={{ fontSize: "13px", color: "#d4d4d4", marginTop: "4px" }}>📍 ناونیشان: {o.customerAddress}</div>
                        {o.locationUrl && (
                          <a href={o.locationUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "8px", backgroundColor: "#15803d", color: "#fff", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", textDecoration: "none", fontWeight: "bold" }}>
                            🗺️ کردنەوە لە Google Maps
                          </a>
                        )}
                      </div>
                      <button onClick={() => handleMarkDelivered(o.id)} style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>
                        گەیەندرا و تەواو بوو ✅
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* 🔒 پانێڵی ئەدمین */}
        {isAdmin && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* دوگمەی بینینی لیستی کڕیارە تۆمارکراوەکان لەگەڵ ئاگادارکردنەوەی نەبەستراو */}
            <div style={{ backgroundColor: "#262626", border: "1px solid #3b82f6", borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#60a5fa", margin: 0 }}>👥 بەڕێوەبردنی کڕیارە تۆمارکراوەکان (Sign Ups)</h3>
                <p style={{ fontSize: "12px", color: "#a3a3a3", margin: "2px 0 0 0" }}>
                  کەسانی چاوەڕێ بۆ ڤێریفای: <strong style={{ color: "#fbbf24" }}>{unverifiedUsersCount} کەس</strong>
                </p>
              </div>
              <button
                onClick={() => setShowVerifiedAdminModal(true)}
                style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "10px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", position: "relative" }}
              >
                بینینی لیست 📋
                {unverifiedUsersCount > 0 && (
                  <span style={{ position: "absolute", top: "-6px", right: "-6px", backgroundColor: "#ef4444", color: "#fff", fontSize: "10px", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    {unverifiedUsersCount}
                  </span>
                )}
              </button>
            </div>

            <section style={{ backgroundColor: "#262626", border: "1px solid #ef4444", borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#f87171", marginBottom: "16px", marginTop: 0 }}>
                🔔 ١. داواکارییە نوێیەکان لە کڕیارەوە ({adminOrders.length})
              </h2>

              {adminOrders.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#a3a3a3", margin: 0 }}>هیچ داواکارییەکی نوێ نییە.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "400px", overflowY: "auto" }}>
                  {adminOrders.map((o) => (
                    <div key={o.id} style={{ backgroundColor: "#171717", border: "1px solid rgba(239,68,68,0.4)", padding: "16px", borderRadius: "14px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "15px" }}>کڕیار: {o.customerName} - <span style={{ fontSize: "11px", color: "#f87171" }}>{o.date}</span></div>
                        <div style={{ fontSize: "13px", marginTop: "4px" }}>📞 مۆبایل: <a href={`tel:${o.customerPhone}`} style={{ color: "#60a5fa" }}>{o.customerPhone}</a></div>
                        <div style={{ fontSize: "13px", color: "#d4d4d4", marginTop: "2px" }}>📍 {o.customerAddress}</div>
                        {o.locationUrl && (
                          <a href={o.locationUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#4ade80", display: "inline-block", marginTop: "4px" }}>
                            🗺️ لۆکەیشنی GPS ی کڕیار
                          </a>
                        )}
                      </div>
                      <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ fontWeight: "bold", color: "#4ade80", fontSize: "16px" }}>{o.total.toLocaleString()} IQD</div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleSendToStore(o.id)} style={{ backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                            ناردن بۆ دوکان 🏪
                          </button>
                          <button onClick={() => handleCancelOrder(o.id)} style={{ backgroundColor: "rgba(220,38,38,0.3)", color: "#f87171", border: "1px solid #dc2626", padding: "6px 10px", borderRadius: "8px", fontSize: "11px", cursor: "pointer" }}>
                            سڕینەوە
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={{ backgroundColor: "#262626", border: "1px solid #0284c7", borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#38bdf8", marginBottom: "16px", marginTop: 0 }}>
                🏪 ٢. لە لایەن دوکانەوە ئامادە دەکرێت ({storeOrders.length})
              </h2>
              {storeOrders.map((o) => (
                <div key={o.id} style={{ backgroundColor: "#171717", padding: "12px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{o.customerName} - {o.customerAddress}</span>
                  <button onClick={() => handleReadyForDelivery(o.id)} style={{ backgroundColor: "#f59e0b", color: "#000", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>
                    ناردن بۆ دلیڤەری 🛵
                  </button>
                </div>
              ))}
            </section>

            <section style={{ backgroundColor: "#262626", border: "1px solid #f59e0b", borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#fbbf24", marginBottom: "16px", marginTop: 0 }}>
                🛵 ٣. لەلایەن دلیڤەرییەوە وەرگیراوە ({deliveryOrders.length})
              </h2>
              {deliveryOrders.map((o) => (
                <div key={o.id} style={{ backgroundColor: "#171717", padding: "12px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{o.customerName} - {o.customerAddress}</span>
                  <button onClick={() => handleMarkDelivered(o.id)} style={{ backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "8px", fontSize: "11px", cursor: "pointer" }}>
                    گەیەندرا ✓
                  </button>
                </div>
              ))}
            </section>

            <section style={{ backgroundColor: "#262626", border: "1px solid #404040", borderRadius: "16px", padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#d4d4d4", marginBottom: "12px", marginTop: 0 }}>
                📁 ٤. ئەرشیف ({deliveredOrders.length})
              </h3>
              {deliveredOrders.map((d) => (
                <div key={d.id} style={{ backgroundColor: "#171717", padding: "10px", borderRadius: "8px", display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span>{d.customerName} - {d.total.toLocaleString()} IQD</span>
                  <span style={{ color: "#4ade80" }}>گەیەندراوە</span>
                </div>
              ))}
            </section>

            {/* زیادکردنی کاڵا */}
            <section style={{ backgroundColor: "#262626", border: "1px solid rgba(59,130,246,0.4)", borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#60a5fa", marginBottom: "14px", marginTop: 0 }}>⚡ زیادکردنی کاڵای نوێ بۆ فرۆشگا</h2>
              <form onSubmit={handleAddProduct} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                <input type="text" placeholder="ناوی کاڵا" value={name} onChange={(e) => setName(e.target.value)} style={{ backgroundColor: "#171717", border: "1px solid #404040", padding: "8px", borderRadius: "8px", color: "#fff" }} required />
                <input type="number" placeholder="نرخ (IQD)" value={price} onChange={(e) => setPrice(e.target.value)} style={{ backgroundColor: "#171717", border: "1px solid #404040", padding: "8px", borderRadius: "8px", color: "#fff" }} required />
                <input type="number" placeholder="عەدەد (Stock)" value={stock} onChange={(e) => setStock(e.target.value)} style={{ backgroundColor: "#171717", border: "1px solid #404040", padding: "8px", borderRadius: "8px", color: "#fff" }} required />
                
                <select
                  value={categorySelect}
                  onChange={(e) => setCategorySelect(e.target.value)}
                  style={{ backgroundColor: "#171717", border: "1px solid #3b82f6", padding: "8px", borderRadius: "8px", color: "#60a5fa", outline: "none" }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>#{cat}</option>
                  ))}
                </select>
                
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: "11px" }} />
                <button type="submit" style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>+ زیادکردن</button>
              </form>
            </section>
          </div>
        )}

        {/* مۆداڵی بەڕێوەبردنی کڕیارە تۆمارکراوەکان لە لایەن ئەدمینەوە */}
        {showVerifiedAdminModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "1px solid #3b82f6", borderRadius: "20px", padding: "22px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #404040", paddingBottom: "12px", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: "bold", color: "#60a5fa", margin: 0 }}>
                  👥 لیستی کڕیارە تۆمارکراوەکان ({registeredUsers.length})
                </h3>
                <button onClick={() => setShowVerifiedAdminModal(false)} style={{ backgroundColor: "#404040", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>داخستن</button>
              </div>

              {registeredUsers.length === 0 ? (
                <p style={{ textAlign: "center", color: "#a3a3a3", padding: "30px 0" }}>هیچ کڕیارێک خۆی تۆمار نەکردووە.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {registeredUsers.map((u, idx) => (
                    <div key={idx} style={{ backgroundColor: "#171717", border: "1px solid #333", padding: "14px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "14px", color: "#fff" }}>{u.name}</div>
                        <div style={{ fontSize: "13px", color: "#60a5fa", marginTop: "2px" }}>📞 {u.phone}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>📍 {u.city} - {u.street}</div>
                        {u.locationUrl && (
                          <a href={u.locationUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#4ade80", display: "inline-block", marginTop: "2px" }}>
                            🗺️ لۆکەیشنی GPS
                          </a>
                        )}
                        <div style={{ marginTop: "4px", fontSize: "11px", color: u.isVerified ? "#4ade80" : "#fbbf24" }}>
                          {u.isVerified ? "✓ ڤێریفای کراوە" : `⏳ کۆدی ڤێریفای: ${u.verificationCode} (پێویستی بە ناردن هەیە)`}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        {!u.isVerified && (
                          <button
                            onClick={() => handleAdminSendOtpWhatsApp(u)}
                            style={{ backgroundColor: "#25D366", color: "#000", border: "none", padding: "8px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                          >
                            💬 ناردنی کۆد بۆ واتسአپ
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRegisteredUser(u.phone)}
                          style={{ backgroundColor: "rgba(220,38,38,0.2)", color: "#f87171", border: "1px solid #dc2626", padding: "8px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          سڕینەوە ❌
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* سێرچ بار */}
        <div style={{ marginTop: "28px", maxWidth: "420px", margin: "28px auto 0" }}>
          <input
            type="text"
            placeholder="🔍 گەڕان بەپێی ناو یان هاشتاگ (وەک: #game)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", backgroundColor: "#262626", border: "1px solid #404040", borderRadius: "14px", padding: "12px 18px", color: "#fff", fontSize: "14px", outline: "none" }}
          />
        </div>

        {/* دوگمەکانی بەش و هاشتاگ */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginTop: "20px" }}>
          <button
            onClick={() => setSelectedCategory("all")}
            style={{ backgroundColor: selectedCategory === "all" ? "#2563eb" : "#262626", color: selectedCategory === "all" ? "#fff" : "#a3a3a3", border: "1px solid #404040", padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
          >
            هەموو کاڵاکان
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{ backgroundColor: selectedCategory === cat ? "#0284c7" : "#262626", color: selectedCategory === cat ? "#fff" : "#38bdf8", border: "1px solid #0284c7", padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
            >
              #{cat}
            </button>
          ))}

          {isAdmin && (
            <button
              onClick={handleAddNewHashtag}
              title="زیادکردنی هاشتاگی نوێ"
              style={{ backgroundColor: "#16a34a", color: "#fff", border: "none", width: "34px", height: "34px", borderRadius: "50%", fontSize: "18px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              +
            </button>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#d4d4d4", margin: 0 }}>
            {selectedCategory === "all" ? "هەموو کەلوپەلەکان" : `کەلوپەلەکانی #${selectedCategory}`}
          </h2>
          <span style={{ fontSize: "12px", color: "#737373" }}>{filteredProducts.length} بەرهەم</span>
        </div>

        {/* لیستی کاڵاکان */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
          {filteredProducts.map((item) => {
            const isOutOfStock = item.stock <= 0;
            return (
              <div key={item.id} style={{ backgroundColor: "#262626", border: "1px solid #404040", borderRadius: "16px", padding: "14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ width: "100%", height: "200px", borderRadius: "12px", overflow: "hidden", backgroundColor: "#000", marginBottom: "12px", position: "relative" }}>
                  <img
                    src={item.img}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", filter: isOutOfStock ? "grayscale(100%) opacity(40%)" : "none", display: "block" }}
                  />
                  {item.category && (
                    <span onClick={() => setSelectedCategory(item.category!)} style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "rgba(0,0,0,0.75)", color: "#60a5fa", fontSize: "11px", fontWeight: "bold", padding: "3px 8px", borderRadius: "6px", border: "1px solid #3b82f6", cursor: "pointer" }}>
                      #{item.category}
                    </span>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 6px 0", color: isOutOfStock ? "#a3a3a3" : "#fff" }}>{item.name}</h3>
                  <p style={{ fontSize: "18px", fontWeight: "800", color: "#4ade80", margin: 0 }}>{item.price.toLocaleString()} <span style={{ fontSize: "11px", color: "#a3a3a3" }}>IQD</span></p>

                  {isAdmin && (
                    <div style={{ marginTop: "10px", backgroundColor: "#171717", padding: "10px", borderRadius: "10px", border: "1px solid #404040", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "11px", color: "#60a5fa" }}>عەدەد:</span>
                        <input
                          type="number"
                          value={item.stock}
                          onChange={(e) => handleUpdateStock(item.id, Number(e.target.value))}
                          style={{ width: "60px", backgroundColor: "#262626", border: "1px solid #525252", borderRadius: "6px", color: "#fff", textAlign: "center", padding: "2px" }}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "11px", color: "#fbbf24" }}>هاشتاگ:</span>
                        <select
                          value={item.category || ""}
                          onChange={(e) => handleUpdateProductCategory(item.id, e.target.value)}
                          style={{ backgroundColor: "#262626", border: "1px solid #525252", borderRadius: "6px", color: "#38bdf8", fontSize: "11px", padding: "3px 6px" }}
                        >
                          {categories.map((c) => (<option key={c} value={c}>#{c}</option>))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={isOutOfStock}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "none", fontWeight: "bold", fontSize: "13px", cursor: isOutOfStock ? "not-allowed" : "pointer", backgroundColor: isOutOfStock ? "#404040" : "#2563eb", color: isOutOfStock ? "#a3a3a3" : "#fff" }}
                  >
                    {isOutOfStock ? "نەماوە (تەواو بووە)" : "خستنە ناو سەبەتە"}
                  </button>

                  {isAdmin && (
                    <button onClick={() => handleDeleteProduct(item.id)} style={{ width: "100%", padding: "6px", borderRadius: "8px", backgroundColor: "transparent", color: "#f87171", border: "1px solid #7f1d1d", fontSize: "11px", cursor: "pointer" }}>
                      سڕینەوەی کاڵا
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* سەبەتەی جێگیر */}
        {totalCartCount > 0 && (
          <div style={{ position: "fixed", bottom: "16px", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: "500px", backgroundColor: "rgba(38, 38, 38, 0.95)", backdropFilter: "blur(10px)", border: "1px solid #3b82f6", borderRadius: "16px", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 999 }}>
            <div>
              <div style={{ fontSize: "13px", color: "#a3a3a3" }}>🛒 سەبەتەکەت: <span style={{ color: "#fff", fontWeight: "bold" }}>{totalCartCount} دانە</span></div>
              <div style={{ fontSize: "16px", fontWeight: "900", color: "#4ade80" }}>{totalCartAmount.toLocaleString()} IQD</div>
            </div>

            <button
              onClick={handleOpenCheckout}
              style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
            >
              کڕین و تەواوکردن ⬅
            </button>
          </div>
        )}

        {/* سندوقی کڕین */}
        {showCheckout && currentUser && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "1px solid #404040", borderRadius: "20px", padding: "22px", width: "100%", maxWidth: "460px", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
              <h2 style={{ fontSize: "17px", fontWeight: "bold", color: "#60a5fa", margin: "0 0 12px 0", borderBottom: "1px solid #404040", paddingBottom: "10px" }}>
                🛒 تەواوکردنی داواکاری بۆ ({currentUser.name})
              </h2>

              <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid #3b82f6", padding: "10px 14px", borderRadius: "10px", fontSize: "12px", color: "#93c5fd", marginBottom: "14px", lineHeight: "1.5" }}>
                ✓ مۆبایل: <strong style={{ color: "#fff" }}>{currentUser.phone}</strong>
                <br />
                📍 ناونیشانی GPS ی تۆمارکراوت لێرە هەیە. ئەگەر شوێنەکەت گۆڕاوە دەتوانیت لە خوارەوە نوێی بکەیتەوە:
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", maxHeight: "150px", overflowY: "auto" }}>
                {cart.map((c) => (
                  <div key={c.product.id} style={{ backgroundColor: "#171717", padding: "8px 12px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span>{c.product.name} ({c.quantity}x)</span>
                    <span style={{ color: "#4ade80" }}>{(c.product.price * c.quantity).toLocaleString()} IQD</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleFinalSubmitOrder} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#a3a3a3", display: "block", marginBottom: "4px" }}>شار / پارێزگا:</label>
                  <select
                    value={orderCity}
                    onChange={(e) => setOrderCity(e.target.value)}
                    style={{ width: "100%", backgroundColor: "#171717", border: "1px solid #3b82f6", borderRadius: "10px", padding: "10px", color: "#60a5fa", fontWeight: "bold" }}
                  >
                    {IRAQ_CITIES.map((city) => (<option key={city} value={city}>{city}</option>))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="گەڕەک و کۆڵان"
                  value={orderStreet}
                  onChange={(e) => setOrderStreet(e.target.value)}
                  style={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px" }}
                  required
                />

                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
                    ناردنی داواکاری ✅
                  </button>
                  <button type="button" onClick={() => setShowCheckout(false)} style={{ flex: 1, backgroundColor: "#404040", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>
                    داخستن
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}