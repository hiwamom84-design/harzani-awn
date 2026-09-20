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

  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCity, setRegCity] = useState(IRAQ_CITIES[0]);
  const [regStreet, setRegStreet] = useState("");
  const [regLocationUrl, setRegLocationUrl] = useState("");
  const [regLocLoading, setRegLocLoading] = useState(false);
  const [pendingOtpPhone, setPendingOtpPhone] = useState("");
  const [enteredOtpCode, setEnteredOtpCode] = useState("");

  const [loginPhone, setLoginPhone] = useState("");

  const [showCheckout, setShowCheckout] = useState(false);
  const [orderStreet, setOrderStreet] = useState("");
  const [orderCity, setOrderCity] = useState("");
  const [orderLocationUrl, setOrderLocationUrl] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoaded, setIsLoaded] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isStore, setIsStore] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);

  const [passwordInput, setPasswordInput] = useState("");
  const [showLoginModal, setShowLoginModal] = useState<"admin" | "store" | "delivery" | null>(null);

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

    if (localStorage.getItem("auth_admin") === "true") setIsAdmin(true);
    if (localStorage.getItem("auth_store") === "true") setIsStore(true);
    if (localStorage.getItem("auth_delivery") === "true") setIsDelivery(true);

    return () => clearInterval(timer);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showLoginModal === "admin") {
      if (passwordInput === "harzaniawn987") {
        setIsAdmin(true);
        localStorage.setItem("auth_admin", "true");
        setShowLoginModal(null);
        setPasswordInput("");
      } else {
        alert("وشەی نهێنی ئەدمین هەڵەیە!");
      }
    } else if (showLoginModal === "store") {
      if (passwordInput === "store123") {
        setIsStore(true);
        localStorage.setItem("auth_store", "true");
        setShowLoginModal(null);
        setPasswordInput("");
      } else {
        alert("وشەی نهێنی دوکان هەڵەیە!");
      }
    } else if (showLoginModal === "delivery") {
      if (passwordInput === "del123") {
        setIsDelivery(true);
        localStorage.setItem("auth_delivery", "true");
        setShowLoginModal(null);
        setPasswordInput("");
      } else {
        alert("وشەی نهێنی دلیڤەری هەڵەیە!");
      }
    }
  };

  const handleLogoutStaff = (role: "admin" | "store" | "delivery") => {
    if (role === "admin") {
      setIsAdmin(false);
      localStorage.removeItem("auth_admin");
    } else if (role === "store") {
      setIsStore(false);
      localStorage.removeItem("auth_store");
    } else if (role === "delivery") {
      setIsDelivery(false);
      localStorage.removeItem("auth_delivery");
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

  const isIraqiPhoneValid = (phone: string) => {
    return /^(0750|0751|0770|0771|0772|0773|0774|0780|0781|0782|0783)\d{7}$/.test(phone);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isIraqiPhoneValid(regPhone)) {
      alert("⚠️ تکایە ژمارەیەکی دروستی عێراقی بنووسە (بۆ نموونە 0750xxxxxxx).");
      return;
    }

    if (!regName.trim() || !regStreet.trim() || !regLocationUrl) {
      alert("تکایە هەموو خانەکان پربکەرەوە و لۆکەیشنی GPS دیاری بکە.");
      return;
    }

    const payload = {
      phone: regPhone,
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
        setPendingOtpPhone(regPhone);
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
      alert("کۆدەکە هەڵەیە! سەیری واتسአپ بکە.");
    }
  };

  const handleLoginUser = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = registeredUsers.find((u) => u.phone === loginPhone && u.isVerified);

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
    const msg = `سڵاو بەڕێز ${user.name}، کۆدی پشکنینی تۆ لە هەرزانی ئاون ئەمەیە: ${user.verificationCode}`;
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

    const fullAddress = `${orderCity} - گەڕەکی ${orderStreet.trim()}`;
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

  const handleReturnToAdminFromStore = async (orderId: number) => {
    if (!confirm("ئایا دڵنیایت لە گەڕاندنەوەی ئەم داواکارییە بۆ ئەدمین (کاڵا نەماوە / Out of stock)؟")) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "admin_review" as const } : o))
    );
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL_ORDER", payload: { orderId } }),
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
    if (!confirm("ئایا دڵنیایت لە هەڵوەشاندنەوەی ئەم داواکارییە؟")) return;
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
  const unverifiedUsersCount = registeredUsers.filter((u) => !u.isVerified).length;
  const verifiedUsersList = registeredUsers.filter((u) => u.isVerified);

  if (!isLoaded)
    return (
      <div style={{ backgroundColor: "#171717", color: "#fff", minHeight: "100vh", padding: "30px", textAlign: "center" }}>
        داگرتنی زانیارییەکان...
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
            <p style={{ fontSize: "12px", color: "#a3a3a3", marginTop: "4px", margin: 0 }}>فرۆشگای فەرمی هەرزانی ئاون</p>
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
              <button onClick={() => setShowLoginModal("store")} style={{ backgroundColor: "#262626", color: "#38bdf8", padding: "9px 12px", borderRadius: "10px", border: "1px solid #0284c7", fontSize: "12px", cursor: "pointer" }}>🏪 دوکان</button>
            ) : (
              <button onClick={() => handleLogoutStaff("store")} style={{ backgroundColor: "#0284c7", color: "#fff", padding: "9px 12px", borderRadius: "10px", border: "none", fontSize: "12px", cursor: "pointer" }}>دەرچوون لە دوکان</button>
            )}

            {!isDelivery ? (
              <button onClick={() => setShowLoginModal("delivery")} style={{ backgroundColor: "#262626", color: "#fbbf24", padding: "9px 12px", borderRadius: "10px", border: "1px solid #d97706", fontSize: "12px", cursor: "pointer" }}>🛵 دلیڤەری</button>
            ) : (
              <button onClick={() => handleLogoutStaff("delivery")} style={{ backgroundColor: "#b45309", color: "#fff", padding: "9px 12px", borderRadius: "10px", border: "none", fontSize: "12px", cursor: "pointer" }}>دەرچوون لە دلیڤەری</button>
            )}

            {!isAdmin ? (
              <button onClick={() => setShowLoginModal("admin")} style={{ backgroundColor: "#262626", color: "#a3a3a3", padding: "9px 12px", borderRadius: "10px", border: "1px solid #404040", fontSize: "12px", cursor: "pointer", position: "relative" }}>
                🔒 ئەدمین
                {unverifiedUsersCount > 0 && (
                  <span style={{ position: "absolute", top: "-6px", right: "-6px", backgroundColor: "#ef4444", color: "#fff", fontSize: "10px", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    {unverifiedUsersCount}
                  </span>
                )}
              </button>
            ) : (
              <button onClick={() => handleLogoutStaff("admin")} style={{ backgroundColor: "#dc2626", color: "#fff", padding: "9px 12px", borderRadius: "10px", border: "none", fontSize: "12px", cursor: "pointer" }}>دەرچوون لە ئەدمین</button>
            )}
          </div>
        </header>

        {orderSuccess && (
          <div style={{ marginTop: "16px", backgroundColor: "#064e3b", border: "1px solid #10b981", color: "#6ee7b7", padding: "14px", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>داواکارییەکەت بە سەرکەوتوویی نێردرا! 🎉</span>
            <button onClick={() => setOrderSuccess(false)} style={{ backgroundColor: "#047857", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer" }}>باشە</button>
          </div>
        )}

        {/* مۆداڵی چوونەژوورەوەی ستۆف */}
        {showLoginModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "1px solid #404040", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "380px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", marginTop: 0 }}>
                {showLoginModal === "admin" && "🔒 چوونەژوورەوەی ئەدمین"}
                {showLoginModal === "store" && "🏪 چوونەژوورەوەی دوکان"}
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
                  <button type="submit" style={{ flex: 1, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>چوونەژوورەوە</button>
                  <button type="button" onClick={() => setShowLoginModal(null)} style={{ flex: 1, backgroundColor: "#404040", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer" }}>داخستن</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 👤 مۆداڵی خۆتۆمارکردن */}
        {showSignupModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "2px solid #2563eb", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "440px", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#60a5fa", margin: "0 0 14px 0", borderBottom: "1px solid #404040", paddingBottom: "10px" }}>
                📝 خۆتۆمارکردن لە هەرزانی ئاون
              </h2>
              <form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", color: "#a3a3a3" }}>ناوی خۆت:</label>
                  <input
                    type="text"
                    placeholder="بۆ نموونە: ئەحمەد یان نووح"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none" }}
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", color: "#a3a3a3" }}>ژمارەی مۆبایل (عێراقی):</label>
                  <input
                    type="tel"
                    placeholder="07501234567"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
                    style={{
                      backgroundColor: "#171717",
                      border: regPhone.length > 0 && !isIraqiPhoneValid(regPhone) ? "2px solid #ef4444" : "1px solid #404040",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      color: "#fff",
                      fontSize: "13px",
                      outline: "none",
                      fontFamily: "monospace"
                    }}
                    required
                  />
                  {regPhone.length > 0 && !isIraqiPhoneValid(regPhone) && (
                    <span style={{ fontSize: "11px", color: "#f87171" }}>
                      ⚠️ ژمارەی مۆبایل هەڵەیە (دەبێت هی عێراق بێت و بە 07 دەست پێبکات).
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: "#a3a3a3", display: "block", marginBottom: "4px" }}>شار / پارێزگا:</label>
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

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", color: "#a3a3a3" }}>ناوی گەڕەک (تەنها گەڕەک):</label>
                  <input
                    type="text"
                    placeholder="بۆ نموونە: رۆشنبیری، سەورە، شۆڕش..."
                    value={regStreet}
                    onChange={(e) => setRegStreet(e.target.value)}
                    style={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none" }}
                    required
                  />
                </div>

                <div style={{ backgroundColor: "#171717", padding: "10px", borderRadius: "10px", border: "1px solid #404040", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={handleRegGetLocation}
                    disabled={regLocLoading}
                    style={{ backgroundColor: "#262626", border: "1px solid #3b82f6", color: "#fff", padding: "10px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    {regLocLoading ? "وەرگرتنی GPS..." : regLocationUrl ? "✓ لۆکەیشنی GPS وەرگیرا" : "📍 دیاریکردنی شوێن بە خودکار (GPS)"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
                    خۆتۆمارکردن و ناردنی کۆد 🚀
                  </button>
                  <button type="button" onClick={() => setShowSignupModal(false)} style={{ flex: 1, backgroundColor: "#404040", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>
                    داخستن
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 🔑 مۆداڵی چوونەژوورەوەی کڕیار */}
        {showLoginModalUser && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "1px solid #404040", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "360px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#60a5fa", margin: "0 0 12px 0" }}>چوونەژوورەوە بە ژمارەی مۆبایل</h3>
              <form onSubmit={handleLoginUser} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="tel"
                  placeholder="ژمارەی مۆبایل بنووسە (0750...)"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ""))}
                  style={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none", fontFamily: "monospace" }}
                  required
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>چوونەژوورەوە ✅</button>
                  <button type="button" onClick={() => setShowLoginModalUser(false)} style={{ flex: 1, backgroundColor: "#404040", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer" }}>داخستن</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 💬 مۆداڵی OTP */}
        {showOtpInputModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "2px solid #25D366", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "380px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>⏳</div>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#25D366", margin: "0 0 10px 0" }}>چاوەڕێی کۆدی پشکنین بە</h3>
              <p style={{ fontSize: "13px", color: "#d4d4d4", lineHeight: "1.6", margin: "0 0 16px 0" }}>
                کۆدی ڤێریفای بە شێوەیەکی خودکار نێردرا بۆ واتسአپەکەت.
                <br />
                <span style={{ fontSize: "12px", color: "#fbbf24" }}>کۆدەکە لێرە بنووسە:</span>
              </p>
              <input
                type="text"
                maxLength={4}
                placeholder="٠٠٠٠"
                value={enteredOtpCode}
                onChange={(e) => setEnteredOtpCode(e.target.value.replace(/\D/g, ""))}
                style={{ width: "100%", boxSizing: "border-box", backgroundColor: "#171717", border: "1px solid #25D366", borderRadius: "10px", padding: "12px", color: "#fff", textAlign: "center", fontSize: "20px", letterSpacing: "6px", outline: "none", fontFamily: "monospace", marginBottom: "16px" }}
              />
              <button
                onClick={handleVerifySignupCode}
                style={{ width: "100%", backgroundColor: "#25D366", color: "#000", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
              >
                پشتڕاستکردنەوە ✅
              </button>
            </div>
          </div>
        )}

        {/* پۆستەری دوکان */}
        {isStore && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <section style={{ backgroundColor: "#1e293b", border: "2px solid #38bdf8", borderRadius: "20px", padding: "24px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#38bdf8", margin: "0 0 14px 0" }}>🏪 پۆستەری دوکان</h2>
              {storeOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#0f172a", borderRadius: "16px" }}>
                  <p style={{ fontSize: "16px", color: "#94a3b8", margin: 0 }}>هیچ داواکارییەک نییە 😴</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
                  {storeOrders.map((o) => (
                    <div key={o.id} style={{ backgroundColor: "#0f172a", border: "2px solid #38bdf8", borderRadius: "16px", padding: "18px" }}>
                      <div style={{ marginBottom: "10px" }}>👤 کڕیار: <strong>{o.customerName}</strong></div>
                      <div style={{ marginBottom: "10px" }}>📍 ناونیشان: {o.customerAddress}</div>
                      <div style={{ backgroundColor: "#1e293b", padding: "10px", borderRadius: "10px", marginBottom: "14px" }}>
                        {o.items.map((it, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                            <span>{it.name}</span>
                            <span style={{ color: "#f59e0b", fontWeight: "bold" }}>{it.quantity} دانە</span>
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <button onClick={() => handleReadyForDelivery(o.id)} style={{ width: "100%", backgroundColor: "#f59e0b", color: "#000", border: "none", padding: "10px", borderRadius: "10px", fontWeight: "900", cursor: "pointer" }}>
                          ئامادەکرا ⬅ ناردن بۆ دلیڤەری 🛵
                        </button>
                        <button onClick={() => handleReturnToAdminFromStore(o.id)} style={{ width: "100%", backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #dc2626", padding: "8px", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                          گەڕاندنەوە بۆ ئەدمین (کاڵا نییە / Out of stock) ↩️
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* دلیڤەری */}
        {isDelivery && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <section style={{ backgroundColor: "#262626", border: "2px solid #f59e0b", borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#fbbf24", margin: "0 0 16px 0" }}>🛵 دلیڤەری</h2>
              {deliveryOrders.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#a3a3a3", textAlign: "center", padding: "20px" }}>هیچ داواکارییەک نییە</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {deliveryOrders.map((o) => (
                    <div key={o.id} style={{ backgroundColor: "#171717", border: "1px solid #f59e0b", padding: "16px", borderRadius: "14px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "16px" }}>کڕیار: {o.customerName}</div>
                        <div style={{ fontSize: "14px", marginTop: "4px" }}>📞 <a href={`tel:${o.customerPhone}`} style={{ color: "#60a5fa" }}>{o.customerPhone}</a></div>
                        <div style={{ fontSize: "13px", color: "#d4d4d4", marginTop: "4px" }}>📍 {o.customerAddress}</div>
                        {o.locationUrl && (
                          <a href={o.locationUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "8px", backgroundColor: "#15803d", color: "#fff", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", textDecoration: "none" }}>
                            🗺️ Google Maps
                          </a>
                        )}
                      </div>
                      <button onClick={() => handleMarkDelivered(o.id)} style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
                        گەیەندرا ✅
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ئەدمین */}
        {isAdmin && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* پانێڵی بەڕێوەبردنی کڕیارەکان (چاڕوچۆنی داواکارییەکان و ڤێریفای) */}
            <div style={{ backgroundColor: "#262626", border: "1px solid #3b82f6", borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#60a5fa", margin: 0 }}>👥 بەڕێوەبردنی کڕیارە تۆمارکراوەکان</h3>
                <p style={{ fontSize: "12px", color: "#a3a3a3", margin: "2px 0 0 0" }}>
                  چاوەڕێی ڤێریفای: <strong style={{ color: "#fbbf24" }}>{unverifiedUsersCount} کەس</strong>
                  <span style={{ margin: "0 8px", color: "#666" }}>|</span>
                  ڤێریفای کراوەکان: <strong style={{ color: "#4ade80" }}>{verifiedUsersList.length} کەس</strong>
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {/* دوگمەی بینینی چاوەڕوانییەکان */}
                <button onClick={() => setShowVerifiedAdminModal(true)} style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "10px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", position: "relative" }}>
                  بینینی چاوەڕوانکراوەکان 📋
                  {unverifiedUsersCount > 0 && (
                    <span style={{ position: "absolute", top: "-6px", right: "-6px", backgroundColor: "#ef4444", color: "#fff", fontSize: "10px", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                      {unverifiedUsersCount}
                    </span>
                  )}
                </button>

                {/* دوگمەی نوێ بۆ بینینی تەواوی کڕیارە ڤێریفای کراوەکان (کە خۆیان تۆمارکردووە) */}
                <button onClick={() => {
                  const verifiedNames = verifiedUsersList.map(u => `👤 ناوی: ${u.name} | 📞 ژمارە: ${u.phone} | 📍 ${u.city}`).join("\n\n");
                  alert(verifiedNames ? `📋 لیستی کڕیارە ڤێریفای کراوەکان:\n\n${verifiedNames}` : "هیچ کڕیارێکی ڤێریفای کراو نییە!");
                }} style={{ backgroundColor: "#15803d", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "10px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
                  لیستی کڕیارە تۆمارکراوەکان ✅
                </button>
              </div>
            </div>

            <section style={{ backgroundColor: "#262626", border: "1px solid #ef4444", borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#f87171", marginBottom: "16px", marginTop: 0 }}>🔔 داواکارییە نوێیەکان ({adminOrders.length})</h2>
              {adminOrders.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#a3a3a3", margin: 0 }}>هیچ داواکارییەک نییە.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {adminOrders.map((o) => (
                    <div key={o.id} style={{ backgroundColor: "#171717", border: "1px solid rgba(239,68,68,0.4)", padding: "16px", borderRadius: "14px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "15px" }}>کڕیار: {o.customerName}</div>
                        <div style={{ fontSize: "13px", marginTop: "4px" }}>📞 {o.customerPhone}</div>
                        <div style={{ fontSize: "13px", color: "#d4d4d4", marginTop: "2px" }}>📍 {o.customerAddress}</div>
                      </div>
                      <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ fontWeight: "bold", color: "#4ade80", fontSize: "16px" }}>{o.total.toLocaleString()} IQD</div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleSendToStore(o.id)} style={{ backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>ناردن بۆ دوکان 🏪</button>
                          <button onClick={() => handleCancelOrder(o.id)} style={{ backgroundColor: "rgba(220,38,38,0.3)", color: "#f87171", border: "1px solid #dc2626", padding: "6px 10px", borderRadius: "8px", fontSize: "11px", cursor: "pointer" }}>سڕینەوە</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* زیادکردنی کاڵا */}
            <section style={{ backgroundColor: "#262626", border: "1px solid rgba(59,130,246,0.4)", borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#60a5fa", marginBottom: "14px", marginTop: 0 }}>⚡ زیادکردنی کاڵای نوێ</h2>
              <form onSubmit={handleAddProduct} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                <input type="text" placeholder="ناوی کاڵا" value={name} onChange={(e) => setName(e.target.value)} style={{ backgroundColor: "#171717", border: "1px solid #404040", padding: "8px", borderRadius: "8px", color: "#fff" }} required />
                <input type="number" placeholder="نرخ (IQD)" value={price} onChange={(e) => setPrice(e.target.value)} style={{ backgroundColor: "#171717", border: "1px solid #404040", padding: "8px", borderRadius: "8px", color: "#fff" }} required />
                <input type="number" placeholder="عەدەد" value={stock} onChange={(e) => setStock(e.target.value)} style={{ backgroundColor: "#171717", border: "1px solid #404040", padding: "8px", borderRadius: "8px", color: "#fff" }} required />
                <select value={categorySelect} onChange={(e) => setCategorySelect(e.target.value)} style={{ backgroundColor: "#171717", border: "1px solid #3b82f6", padding: "8px", borderRadius: "8px", color: "#60a5fa" }}>
                  {categories.map((cat) => (<option key={cat} value={cat}>#{cat}</option>))}
                </select>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: "11px" }} />
                <button type="submit" style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>+ زیادکردن</button>
              </form>
            </section>
          </div>
        )}

        {/* مۆداڵی بەڕێوەبردنی کڕیارە چاوەڕوانکراوەکان */}
        {showVerifiedAdminModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "1px solid #3b82f6", borderRadius: "20px", padding: "22px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #404040", paddingBottom: "12px", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: "bold", color: "#60a5fa", margin: 0 }}>👥 کڕیارە چاوەڕوانکراوەکان بۆ ڤێریفای ({registeredUsers.length})</h3>
                <button onClick={() => setShowVerifiedAdminModal(false)} style={{ backgroundColor: "#404040", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>داخستن</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {registeredUsers.map((u, idx) => (
                  <div key={idx} style={{ backgroundColor: "#171717", border: "1px solid #333", padding: "14px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "14px", color: "#fff" }}>{u.name}</div>
                      <div style={{ fontSize: "13px", color: "#60a5fa" }}>📞 {u.phone}</div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>📍 {u.city} - گەڕەکی {u.street}</div>
                      <div style={{ fontSize: "11px", color: u.isVerified ? "#4ade80" : "#fbbf24", marginTop: "4px" }}>
                        {u.isVerified ? "✓ ڤێریفای کراوە" : `⏳ چاوەڕێی ڤێریفای`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {!u.isVerified && (
                        <button onClick={() => handleAdminSendOtpWhatsApp(u)} style={{ backgroundColor: "#25D366", color: "#000", border: "none", padding: "8px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>
                          💬 ناردنی نامەی وەتسአپ
                        </button>
                      )}
                      <button onClick={() => handleDeleteRegisteredUser(u.phone)} style={{ backgroundColor: "rgba(220,38,38,0.2)", color: "#f87171", border: "1px solid #dc2626", padding: "8px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>
                        سڕینەوە ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* سێرچ بار */}
        <div style={{ marginTop: "28px", maxWidth: "420px", margin: "28px auto 0" }}>
          <input
            type="text"
            placeholder="🔍 گەڕان بەپێی ناو یان هاشتاگ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", backgroundColor: "#262626", border: "1px solid #404040", borderRadius: "14px", padding: "12px 18px", color: "#fff", fontSize: "14px", outline: "none" }}
          />
        </div>

        {/* هاشتاگەکان */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginTop: "20px" }}>
          <button onClick={() => setSelectedCategory("all")} style={{ backgroundColor: selectedCategory === "all" ? "#2563eb" : "#262626", color: selectedCategory === "all" ? "#fff" : "#a3a3a3", border: "1px solid #404040", padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>هەموو کاڵاکان</button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ backgroundColor: selectedCategory === cat ? "#0284c7" : "#262626", color: selectedCategory === cat ? "#fff" : "#38bdf8", border: "1px solid #0284c7", padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>#{cat}</button>
          ))}
          {isAdmin && (
            <button onClick={handleAddNewHashtag} style={{ backgroundColor: "#16a34a", color: "#fff", border: "none", width: "34px", height: "34px", borderRadius: "50%", fontSize: "18px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          )}
        </div>

        {/* لیستی کاڵاکان */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px", marginTop: "24px" }}>
          {filteredProducts.map((item) => {
            const isOutOfStock = item.stock <= 0;
            return (
              <div key={item.id} style={{ backgroundColor: "#262626", border: "1px solid #404040", borderRadius: "16px", padding: "14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ width: "100%", height: "200px", borderRadius: "12px", overflow: "hidden", backgroundColor: "#000", marginBottom: "12px", position: "relative" }}>
                  <img src={item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: isOutOfStock ? "grayscale(100%) opacity(40%)" : "none" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 6px 0", color: isOutOfStock ? "#a3a3a3" : "#fff" }}>{item.name}</h3>
                  <p style={{ fontSize: "18px", fontWeight: "800", color: "#4ade80", margin: 0 }}>{item.price.toLocaleString()} <span style={{ fontSize: "11px", color: "#a3a3a3" }}>IQD</span></p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDeleteProduct(item.id)} style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #dc2626", padding: "6px", borderRadius: "8px", fontSize: "12px", marginTop: "8px", cursor: "pointer" }}>سڕینەوەی کاڵا ❌</button>
                )}
                <button
                  onClick={() => addToCart(item)}
                  disabled={isOutOfStock}
                  style={{ width: "100%", marginTop: "10px", padding: "10px", borderRadius: "10px", border: "none", fontWeight: "bold", fontSize: "13px", cursor: isOutOfStock ? "not-allowed" : "pointer", backgroundColor: isOutOfStock ? "#404040" : "#2563eb", color: isOutOfStock ? "#a3a3a3" : "#fff" }}
                >
                  {isOutOfStock ? "تەواو بووە" : "خستنە ناو سەبەتە"}
                </button>
              </div>
            );
          })}
        </div>

        {/* سەبەتەی خوارەوە */}
        {totalCartCount > 0 && (
          <div style={{ position: "fixed", bottom: "16px", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: "500px", backgroundColor: "rgba(38, 38, 38, 0.95)", backdropFilter: "blur(10px)", border: "1px solid #3b82f6", borderRadius: "16px", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 999 }}>
            <div>
              <div style={{ fontSize: "13px", color: "#a3a3a3" }}>🛒 سەبەتەکەت: <span style={{ color: "#fff", fontWeight: "bold" }}>{totalCartCount} دانە</span></div>
              <div style={{ fontSize: "16px", fontWeight: "900", color: "#4ade80" }}>{totalCartAmount.toLocaleString()} IQD</div>
            </div>
            <button onClick={handleOpenCheckout} style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>کڕین و تەواوکردن ⬅</button>
          </div>
        )}

        {/* سندوقی کڕین */}
        {showCheckout && currentUser && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div style={{ backgroundColor: "#262626", border: "1px solid #404040", borderRadius: "20px", padding: "22px", width: "100%", maxWidth: "460px", boxSizing: "border-box" }}>
              <h2 style={{ fontSize: "17px", fontWeight: "bold", color: "#60a5fa", margin: "0 0 12px 0", borderBottom: "1px solid #404040", paddingBottom: "10px" }}>🛒 تەواوکردنی داواکاری</h2>
              <form onSubmit={handleFinalSubmitOrder} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#a3a3a3", display: "block", marginBottom: "4px" }}>شار / پارێزگا:</label>
                  <select value={orderCity} onChange={(e) => setOrderCity(e.target.value)} style={{ width: "100%", backgroundColor: "#171717", border: "1px solid #3b82f6", borderRadius: "10px", padding: "10px", color: "#60a5fa", fontWeight: "bold" }}>
                    {IRAQ_CITIES.map((city) => (<option key={city} value={city}>{city}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#a3a3a3", display: "block", marginBottom: "4px" }}>ناوی گەڕەک:</label>
                  <input type="text" placeholder="گەڕەک" value={orderStreet} onChange={(e) => setOrderStreet(e.target.value)} style={{ width: "100%", boxSizing: "border-box", backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px" }} required />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>ناردنی داواکاری ✅</button>
                  <button type="button" onClick={() => setShowCheckout(false)} style={{ flex: 1, backgroundColor: "#404040", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>داخستن</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}