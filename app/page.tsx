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
  
  const [showLoginOtpModal, setShowLoginOtpModal] = useState(false);
  const [pendingLoginPhone, setPendingLoginPhone] = useState("");
  const [enteredLoginOtp, setEnteredLoginOtp] = useState("");

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

  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleScreenClick = (e: React.MouseEvent) => {
    const newRipple = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
    };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 800);
  };

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

    if (localStorage.getItem("auth_admin") === "true") {
      setIsAdmin(true);
      setIsStore(true);
      setIsDelivery(true);
    }
    if (localStorage.getItem("auth_store") === "true") setIsStore(true);
    if (localStorage.getItem("auth_delivery") === "true") setIsDelivery(true);

    return () => clearInterval(timer);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showLoginModal === "admin") {
      if (passwordInput === "harzaniawn987") {
        setIsAdmin(true);
        setIsStore(true);
        setIsDelivery(true);
        localStorage.setItem("auth_admin", "true");
        localStorage.setItem("auth_store", "true");
        localStorage.setItem("auth_delivery", "true");
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
      setIsStore(false);
      setIsDelivery(false);
      localStorage.removeItem("auth_admin");
      localStorage.removeItem("auth_store");
      localStorage.removeItem("auth_delivery");
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
    const newTag = prompt("ناوی پۆلێنی نوێ بنووسە:");
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
      alert("تکایە هەموو خانەکان پڕبکەرەوە و شوێنی GPS دیاری بکە.");
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
    if (!targetUser) {
      alert("هەڵە: بەکارهێنەر نەدۆزراوەتەوە!");
      return;
    }

    if (enteredOtpCode.trim() === String(targetUser.verificationCode).trim()) {
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
          alert("تۆمارکردن سەرکەوتوو بوو!");
        }
      } catch (e) {}
    } else {
      alert(`کۆدەکە هەڵەیە! (تۆ نووسیوتە: ${enteredOtpCode}، کۆدی ڕاستەقینە: ${targetUser.verificationCode})`);
    }
  };

  const handleLoginUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim()) return;

    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REQUEST_LOGIN", payload: { phone: loginPhone.trim() } }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingLoginPhone(loginPhone.trim());
        setShowLoginModalUser(false);
        setShowLoginOtpModal(true);
        setLoginPhone("");
      } else {
        alert(data.error || "ئەم ژمارەیە تۆمار نەکراوە!");
      }
    } catch (err) {
      alert("هەڵە ڕووی دا لە چوونەژوورەوە");
    }
  };

  const handleVerifyLoginCode = async () => {
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "VERIFY_REGISTER_CODE", 
          payload: { phone: pendingLoginPhone, code: enteredLoginOtp.trim() } 
        }),
      });
      const data = await res.json();
      if (data.success) {
        const loggedUser = data.registeredUsers.find((u: RegisteredUser) => u.phone === pendingLoginPhone);
        setCurrentUser(loggedUser);
        localStorage.setItem("current_logged_user", JSON.stringify(loggedUser));
        setShowLoginOtpModal(false);
        setEnteredLoginOtp("");
        alert("بە سەرکەوتوویی چوویە ژوورەوە!");
      } else {
        alert("کۆدەکە هەڵەیە!");
      }
    } catch (e) {
      alert("هەڵە لە پشکنین");
    }
  };

  const handleAdminSendOtpWhatsApp = (user: RegisteredUser) => {
    const msg = `سڵاو بەڕێز ${user.name}، کۆدی پشکنینی تۆ لە هەرزانی ئاون ئەمەیە: ${user.verificationCode}`;
    const cleanPhone = user.phone.startsWith("0") ? user.phone.substring(1) : user.phone;
    window.open(`https://wa.me/964${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDeleteRegisteredUser = async (phone: string) => {
    if (!confirm(`دڵنیایت لە سڕینەوەی ئەم هەژمارەیە؟`)) return;
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
      alert("تکایە سەرەتا خۆت تۆمار بکە یان لۆگین بە!");
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
    if (!confirm("ئایا دڵنیایت لە گەڕاندنەوەی ئەم داواکارییە؟")) return;
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
    if (!confirm("ئایا دڵنیایت لە هەڵوەشاندنەوەی داواکاری؟")) return;
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
        alert("ناتوانیت زیاتر لە بڕی بەردەست زیاد بکەیت!");
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

  const removeFromCart = (productId: number) => {
    const existing = cart.find((item) => item.product.id === productId);
    if (existing) {
      if (existing.quantity > 1) {
        setCart(
          cart.map((item) =>
            item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
          )
        );
      } else {
        setCart(cart.filter((item) => item.product.id !== productId));
      }
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
      <div style={{ backgroundColor: "#02040a", color: "#38bdf8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "16px" }}>
        جێبەجێکردنی سیستەم...
      </div>
    );

  return (
    <main 
      dir="rtl" 
      onClick={handleScreenClick}
      style={{ 
        backgroundColor: "#02040a", 
        color: "#ffffff", 
        minHeight: "100vh", 
        padding: "24px 16px 140px 16px", 
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflowX: "hidden"
      }}
    >
      <style jsx global>{`
        @keyframes floatLaser1 {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          33% { transform: translate(350px, 200px) scale(1.3) rotate(120deg); }
          66% { transform: translate(-200px, 300px) scale(0.9) rotate(240deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
        }
        @keyframes floatLaser2 {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          33% { transform: translate(-400px, -250px) scale(1.4) rotate(-120deg); }
          66% { transform: translate(250px, -300px) scale(1.1) rotate(-240deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(-360deg); }
        }
        @keyframes floatLaser3 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(300px, -350px) scale(1.5); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes gridScroll {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        @keyframes shockwaveExpand {
          0% { width: 0px; height: 0px; opacity: 1; border-color: rgba(56, 189, 248, 1); }
          100% { width: 700px; height: 700px; opacity: 0; border-color: rgba(168, 85, 247, 0); }
        }
        .moving-grid {
          background-image: linear-gradient(to right, rgba(56, 189, 248, 0.06) 1.5px, transparent 1.5px),
                            linear-gradient(to bottom, rgba(56, 189, 248, 0.06) 1.5px, transparent 1.5px);
          background-size: 50px 50px;
          animation: gridScroll 20s linear infinite;
        }
        .laser-glow-1 {
          position: absolute;
          top: 0%;
          left: 5%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.38) 0%, rgba(14, 165, 233, 0) 70%);
          border-radius: 50%;
          filter: blur(80px);
          animation: floatLaser1 12s infinite ease-in-out;
          pointer-events: none;
        }
        .laser-glow-2 {
          position: absolute;
          top: 30%;
          right: 5%;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.38) 0%, rgba(168, 85, 247, 0) 70%);
          border-radius: 50%;
          filter: blur(90px);
          animation: floatLaser2 15s infinite ease-in-out;
          pointer-events: none;
        }
        .laser-glow-3 {
          position: absolute;
          bottom: 0%;
          left: 30%;
          width: 650px;
          height: 650px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.32) 0%, rgba(236, 72, 153, 0) 70%);
          border-radius: 50%;
          filter: blur(100px);
          animation: floatLaser3 14s infinite ease-in-out;
          pointer-events: none;
        }
        .shockwave {
          position: fixed;
          border: 2px solid #38bdf8;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          animation: shockwaveExpand 0.7s cubic-bezier(0, 0.1, 0.3, 1) forwards;
          z-index: 99999;
        }
        .bento-card {
          background: rgba(10, 14, 28, 0.75);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(56, 189, 248, 0.2);
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.6);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .bento-card:hover {
          transform: translateY(-6px);
          border-color: rgba(56, 189, 248, 0.5);
          box-shadow: 0 20px 50px -10px rgba(56, 189, 248, 0.35);
        }
        .cyber-portal-box {
          background: radial-gradient(circle, #090d16 0%, #000000 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(56, 189, 248, 0.25);
          box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.9);
        }
        .cyber-portal-box img {
          width: 90%;
          height: 90%;
          object-fit: contain;
          filter: drop-shadow(0 10px 15px rgba(0,0,0,0.8));
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bento-card:hover .cyber-portal-box img {
          transform: scale(1.12);
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div className="absolute inset-0 moving-grid opacity-90"></div>
        <div className="laser-glow-1"></div>
        <div className="laser-glow-2"></div>
        <div className="laser-glow-3"></div>
      </div>

      {ripples.map((rip) => (
        <span key={rip.id} className="shockwave" style={{ left: rip.x, top: rip.y }}></span>
      ))}

      <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", letterSpacing: "-0.5px", color: "#ffffff", margin: 0 }}>
              هەرزانی ئاون
            </h1>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px", margin: 0 }}>فروشگای فەرمی ئۆنلاین</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {currentUser ? (
              <div style={{ backgroundColor: "rgba(10, 14, 28, 0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "6px 12px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span style={{ color: "#cbd5e1" }}>{currentUser.name}</span>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem("current_logged_user");
                  }}
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "none", padding: "3px 6px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}
                >
                  دەرچوون
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setShowSignupModal(true)}
                  style={{ backgroundColor: "#38bdf8", color: "#02040a", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                >
                  خۆتۆمارکردن
                </button>
                <button
                  onClick={() => setShowLoginModalUser(true)}
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", backdropFilter: "blur(5px)" }}
                >
                  چوونەژوورەوە
                </button>
              </div>
            )}

            {!isStore ? (
              <button onClick={() => setShowLoginModal("store")} style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#93c5fd", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(56,189,248,0.2)", fontSize: "12px", cursor: "pointer" }}>دوکان</button>
            ) : (
              <button onClick={() => handleLogoutStaff("store")} style={{ backgroundColor: "#0284c7", color: "#fff", padding: "8px 12px", borderRadius: "8px", border: "none", fontSize: "12px", cursor: "pointer" }}>داخستنی دوکان</button>
            )}

            {!isDelivery ? (
              <button onClick={() => setShowLoginModal("delivery")} style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#fde047", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(250,204,21,0.2)", fontSize: "12px", cursor: "pointer" }}>گەیاندن</button>
            ) : (
              <button onClick={() => handleLogoutStaff("delivery")} style={{ backgroundColor: "#b45309", color: "#fff", padding: "8px 12px", borderRadius: "8px", border: "none", fontSize: "12px", cursor: "pointer" }}>داخستنی گەیاندن</button>
            )}

            {!isAdmin ? (
              <button onClick={() => setShowLoginModal("admin")} style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#f43f5e", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(244,63,94,0.2)", fontSize: "12px", cursor: "pointer", position: "relative" }}>
                بەڕێوەبەر
                {unverifiedUsersCount > 0 && (
                  <span style={{ position: "absolute", top: "-5px", right: "-5px", backgroundColor: "#ef4444", color: "#fff", fontSize: "10px", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    {unverifiedUsersCount}
                  </span>
                )}
              </button>
            ) : (
              <button onClick={() => handleLogoutStaff("admin")} style={{ backgroundColor: "#dc2626", color: "#fff", padding: "8px 12px", borderRadius: "8px", border: "none", fontSize: "12px", cursor: "pointer" }}>داخستنی بەڕێوەبەر</button>
            )}
          </div>
        </header>

        {orderSuccess && (
          <div style={{ marginTop: "16px", backgroundColor: "rgba(6, 78, 59, 0.6)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#34d399", padding: "12px 16px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(10px)", fontSize: "13px" }}>
            <span>داواکارییەکەت بە سەرکەوتوویی تۆمار کرا.</span>
            <button onClick={() => setOrderSuccess(false)} style={{ backgroundColor: "transparent", color: "#34d399", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>باشە</button>
          </div>
        )}

        {showLoginModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2, 4, 10, 0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
            <div className="bento-card" style={{ borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "360px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", marginBottom: "12px", marginTop: 0 }}>
                {showLoginModal === "admin" && "چوونەژووری بەڕێوەبەر"}
                {showLoginModal === "store" && "چوونەژووری دوکان"}
                {showLoginModal === "delivery" && "چوونەژووری گەیاندن"}
              </h3>
              <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  type="password"
                  placeholder="وشەی نهێنی..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{ backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "8px", padding: "10px 12px", color: "#fff", outline: "none", fontSize: "13px" }}
                  required
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: "#38bdf8", color: "#02040a", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>پشتڕاستکردنەوە</button>
                  <button type="button" onClick={() => setShowLoginModal(null)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", color: "#cbd5e1", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>پاشگەزبوونەوە</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showSignupModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2, 4, 10, 0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div className="bento-card" style={{ borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "420px", maxHeight: "90vh", overflowY: "auto" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#f8fafc", margin: "0 0 14px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "10px" }}>
                دروستکردنی هەژماری نوێ
              </h2>
              <form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8" }}>ناوی تەواو:</label>
                  <input
                    type="text"
                    placeholder="ناو..."
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{ backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "8px", padding: "10px 12px", color: "#fff", fontSize: "13px", outline: "none" }}
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8" }}>ژمارەی مۆبایل:</label>
                  <input
                    type="tel"
                    placeholder="07501234567"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
                    style={{
                      backgroundColor: "rgba(2, 4, 10, 0.6)",
                      border: regPhone.length > 0 && !isIraqiPhoneValid(regPhone) ? "1px solid #ef4444" : "1px solid rgba(56, 189, 248, 0.2)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      color: "#fff",
                      fontSize: "13px",
                      outline: "none",
                      fontFamily: "monospace"
                    }}
                    required
                  />
                  {regPhone.length > 0 && !isIraqiPhoneValid(regPhone) && (
                    <span style={{ fontSize: "11px", color: "#f87171" }}>ژمارەی مۆبایل ناتەواوە (دەبێت عێراقی بێت).</span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>شار / ناوچە:</label>
                  <select
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    style={{ width: "100%", backgroundColor: "rgba(2, 4, 10, 0.8)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "8px", padding: "10px 12px", color: "#e2e8f0", fontSize: "13px", outline: "none" }}
                  >
                    {IRAQ_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8" }}>گەڕەک:</label>
                  <input
                    type="text"
                    placeholder="ناوی گەڕەک..."
                    value={regStreet}
                    onChange={(e) => setRegStreet(e.target.value)}
                    style={{ backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "8px", padding: "10px 12px", color: "#fff", fontSize: "13px", outline: "none" }}
                    required
                  />
                </div>

                <div style={{ backgroundColor: "rgba(2, 4, 10, 0.4)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <button
                    type="button"
                    onClick={handleRegGetLocation}
                    disabled={regLocLoading}
                    style={{ width: "100%", backgroundColor: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", padding: "8px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                  >
                    {regLocLoading ? "وەرگرتنی لۆکەیشن..." : regLocationUrl ? "✓ لۆکەیشن دیاری کرا" : "دیاریکردنی شوێن (GPS)"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: "#38bdf8", color: "#02040a", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                    تۆمارکردن
                  </button>
                  <button type="button" onClick={() => setShowSignupModal(false)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", color: "#cbd5e1", border: "none", padding: "10px", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
                    پاشگەزبوونەوە
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showLoginModalUser && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2, 4, 10, 0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div className="bento-card" style={{ borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "340px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", margin: "0 0 12px 0" }}>چوونەژوورەوە</h3>
              <form onSubmit={handleLoginUser} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  type="tel"
                  placeholder="ژمارەی مۆبایل (0750...)"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ""))}
                  style={{ backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "8px", padding: "10px 12px", color: "#fff", fontSize: "13px", outline: "none", fontFamily: "monospace" }}
                  required
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: "#38bdf8", color: "#02040a", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>ناردنی کۆد</button>
                  <button type="button" onClick={() => setShowLoginModalUser(false)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", color: "#cbd5e1", border: "none", padding: "10px", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>داخستن</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showOtpInputModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2, 4, 10, 0.9)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "16px" }}>
            <div className="bento-card" style={{ borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "340px", textAlign: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", margin: "0 0 8px 0" }}>پشکنینی کۆد</h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 16px 0" }}>کۆدی نێردراو بۆ واتسئەپ بنووسە:</p>
              <input
                type="text"
                maxLength={4}
                placeholder="٠٠٠٠"
                value={enteredOtpCode}
                onChange={(e) => setEnteredOtpCode(e.target.value.replace(/\D/g, ""))}
                style={{ width: "100%", boxSizing: "border-box", backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(34, 197, 94, 0.4)", borderRadius: "8px", padding: "10px", color: "#fff", textAlign: "center", fontSize: "18px", letterSpacing: "6px", outline: "none", fontFamily: "monospace", marginBottom: "16px" }}
              />
              <button
                onClick={handleVerifySignupCode}
                style={{ width: "100%", backgroundColor: "#22c55e", color: "#02040a", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
              >
                پشتڕاستکردنەوە
              </button>
            </div>
          </div>
        )}

        {showLoginOtpModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2, 4, 10, 0.9)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "16px" }}>
            <div className="bento-card" style={{ borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "340px", textAlign: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", margin: "0 0 8px 0" }}>چوونەژوورەوە</h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 16px 0" }}>کۆدی چوونەژوورەوە بنووسە:</p>
              <input
                type="text"
                maxLength={4}
                placeholder="٠٠٠٠"
                value={enteredLoginOtp}
                onChange={(e) => setEnteredLoginOtp(e.target.value.replace(/\D/g, ""))}
                style={{ width: "100%", boxSizing: "border-box", backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(34, 197, 94, 0.4)", borderRadius: "8px", padding: "10px", color: "#fff", textAlign: "center", fontSize: "18px", letterSpacing: "6px", outline: "none", fontFamily: "monospace", marginBottom: "16px" }}
              />
              <button
                onClick={handleVerifyLoginCode}
                style={{ width: "100%", backgroundColor: "#22c55e", color: "#02040a", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
              >
                چوونەژوورەوە
              </button>
            </div>
          </div>
        )}

        {isStore && (
          <div style={{ marginTop: "24px" }}>
            <div className="bento-card" style={{ borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#38bdf8", margin: "0 0 14px 0" }}>بەڕێوەبردنی دوکان (ئامادەکاری)</h2>
              {storeOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", backgroundColor: "rgba(2, 4, 10, 0.4)", borderRadius: "12px" }}>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>هیچ داواکارییەک نییە.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
                  {storeOrders.map((o) => (
                    <div key={o.id} style={{ backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px" }}>
                      <div style={{ fontSize: "13px", marginBottom: "8px" }}>کڕیار: <strong style={{ color: "#f8fafc" }}>{o.customerName}</strong></div>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>ناونیشان: {o.customerAddress}</div>
                      <div style={{ backgroundColor: "rgba(10, 14, 28, 0.8)", padding: "8px", borderRadius: "8px", marginBottom: "12px", fontSize: "12px" }}>
                        {o.items.map((it, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                            <span>{it.name}</span>
                            <span style={{ color: "#38bdf8" }}>{it.quantity} دانە</span>
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <button onClick={() => handleReadyForDelivery(o.id)} style={{ width: "100%", backgroundColor: "#fbbf24", color: "#02040a", border: "none", padding: "8px", borderRadius: "8px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
                          ئامادەیە بۆ گەیاندن
                        </button>
                        <button onClick={() => handleReturnToAdminFromStore(o.id)} style={{ width: "100%", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "none", padding: "6px", borderRadius: "8px", fontSize: "11px", cursor: "pointer" }}>
                          گەڕاندنەوە بۆ بەڕێوەبەر
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isDelivery && (
          <div style={{ marginTop: "24px" }}>
            <div className="bento-card" style={{ borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#fbbf24", margin: "0 0 14px 0" }}>تیمی گەیاندن</h2>
              {deliveryOrders.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#64748b", textAlign: "center", padding: "20px" }}>هیچ داواکارییەک بۆ گەیاندن نییە.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {deliveryOrders.map((o) => (
                    <div key={o.id} style={{ backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(255,255,255,0.06)", padding: "14px", borderRadius: "12px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>{o.customerName}</div>
                        <div style={{ fontSize: "12px", color: "#38bdf8", marginTop: "2px" }}><a href={`tel:${o.customerPhone}`} style={{ color: "inherit" }}>{o.customerPhone}</a></div>
                        <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{o.customerAddress}</div>
                        {o.locationUrl && (
                          <a href={o.locationUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "6px", color: "#34d399", fontSize: "11px", textDecoration: "none" }}>
                            بینین لە نەخشە (Maps) ↗
                          </a>
                        )}
                      </div>
                      <button onClick={() => handleMarkDelivered(o.id)} style={{ backgroundColor: "#22c55e", color: "#02040a", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
                        گەیەندرا
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isAdmin && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="bento-card" style={{ borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f43f5e", margin: 0 }}>بەڕێوەبردنی هەژمارەکان</h3>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "2px 0 0 0" }}>
                  چاوەڕوانکراو: <strong style={{ color: "#fbbf24" }}>{unverifiedUsersCount}</strong> | پەسەندکراو: <strong style={{ color: "#34d399" }}>{verifiedUsersList.length}</strong>
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setShowVerifiedAdminModal(true)} style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>
                  لیستی چاوەڕوانی ({unverifiedUsersCount})
                </button>
              </div>
            </div>

            <div className="bento-card" style={{ borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", marginBottom: "12px", marginTop: 0 }}>داواکارییە چاوەڕوانکراوەکان ({adminOrders.length})</h2>
              {adminOrders.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>هیچ داواکارییەکی نوێ نییە.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {adminOrders.map((o) => (
                    <div key={o.id} style={{ backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", borderRadius: "10px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>{o.customerName} - {o.customerPhone}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{o.customerAddress}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontWeight: "700", color: "#34d399", fontSize: "13px" }}>{o.total.toLocaleString()} IQD</div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleSendToStore(o.id)} style={{ backgroundColor: "#38bdf8", color: "#02040a", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>ناردن بۆ دوکان</button>
                          <button onClick={() => handleCancelOrder(o.id)} style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>سڕینەوە</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bento-card" style={{ borderRadius: "16px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", margin: 0 }}>زیادکردنی کاڵای نوێ</h2>
                <span style={{ fontSize: "11px", color: "#38bdf8", backgroundColor: "rgba(56, 189, 248, 0.15)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                  ✨ Cyber Portal Frame Active
                </span>
              </div>
              <form onSubmit={handleAddProduct} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                <input type="text" placeholder="ناوی کاڵا" value={name} onChange={(e) => setName(e.target.value)} style={{ backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 10px", borderRadius: "8px", color: "#fff", fontSize: "12px" }} required />
                <input type="number" placeholder="نرخ (IQD)" value={price} onChange={(e) => setPrice(e.target.value)} style={{ backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 10px", borderRadius: "8px", color: "#fff", fontSize: "12px" }} required />
                <input type="number" placeholder="دانە (Stock)" value={stock} onChange={(e) => setStock(e.target.value)} style={{ backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 10px", borderRadius: "8px", color: "#fff", fontSize: "12px" }} required />
                <select value={categorySelect} onChange={(e) => setCategorySelect(e.target.value)} style={{ backgroundColor: "rgba(2, 4, 10, 0.8)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 10px", borderRadius: "8px", color: "#e2e8f0", fontSize: "12px" }}>
                  {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: "11px", color: "#94a3b8" }} />
                <button type="submit" style={{ backgroundColor: "#38bdf8", color: "#02040a", border: "none", padding: "8px", borderRadius: "8px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>زیادکردن</button>
              </form>
            </div>
          </div>
        )}

        {showVerifiedAdminModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2, 4, 10, 0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div className="bento-card" style={{ borderRadius: "16px", padding: "20px", width: "100%", maxWidth: "550px", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "10px", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", margin: 0 }}>کڕیارە چاوەڕوانکراوەکان ({registeredUsers.length})</h3>
                <button onClick={() => setShowVerifiedAdminModal(false)} style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#cbd5e1", border: "none", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>داخستن</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {registeredUsers.map((u, idx) => (
                  <div key={idx} style={{ backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px" }}>{u.name}</div>
                      <div style={{ fontSize: "12px", color: "#38bdf8" }}>{u.phone}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{u.city} - {u.street}</div>
                      <div style={{ fontSize: "11px", color: u.isVerified ? "#34d399" : "#fbbf24", marginTop: "2px" }}>
                        {u.isVerified ? "پەسەندکراوە" : "چاوەڕێی کۆد"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {!u.isVerified && (
                        <button onClick={() => handleAdminSendOtpWhatsApp(u)} style={{ backgroundColor: "#22c55e", color: "#02040a", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
                          ناردنی نامە
                        </button>
                      )}
                      <button onClick={() => handleDeleteRegisteredUser(u.phone)} style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>
                        سڕینەوە
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: "28px", maxWidth: "400px", margin: "28px auto 0" }}>
          <input
            type="text"
            placeholder="گەڕان بەدوای کاڵاکاندا..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", backgroundColor: "rgba(10, 14, 28, 0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "12px", padding: "12px 16px", color: "#fff", fontSize: "13px", outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginTop: "16px" }}>
          <button onClick={() => setSelectedCategory("all")} style={{ backgroundColor: selectedCategory === "all" ? "#38bdf8" : "rgba(10, 14, 28, 0.6)", color: selectedCategory === "all" ? "#02040a" : "#cbd5e1", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>هەمووی</button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ backgroundColor: selectedCategory === cat ? "#38bdf8" : "rgba(10, 14, 28, 0.6)", color: selectedCategory === cat ? "#02040a" : "#cbd5e1", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>{cat}</button>
          ))}
          {isAdmin && (
            <button onClick={handleAddNewHashtag} style={{ backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.4)", width: "28px", height: "28px", borderRadius: "50%", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px", marginTop: "24px" }}>
          {filteredProducts.map((item) => {
            const isOutOfStock = item.stock <= 0;
            return (
              <div key={item.id} className="bento-card" style={{ borderRadius: "16px", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div className="cyber-portal-box" style={{ width: "100%", height: "180px", borderRadius: "12px", marginBottom: "12px" }}>
                  <img src={item.img} alt={item.name} style={{ filter: isOutOfStock ? "grayscale(100%) opacity(40%)" : undefined }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 4px 0", color: isOutOfStock ? "#64748b" : "#f8fafc" }}>{item.name}</h3>
                  <p style={{ fontSize: "15px", fontWeight: "700", color: "#34d399", margin: 0 }}>{item.price.toLocaleString()} <span style={{ fontSize: "10px", color: "#94a3b8" }}>IQD</span></p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDeleteProduct(item.id)} style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "none", padding: "4px", borderRadius: "6px", fontSize: "11px", marginTop: "8px", cursor: "pointer" }}>سڕینەوەی کاڵا</button>
                )}
                <button
                  onClick={() => addToCart(item)}
                  disabled={isOutOfStock}
                  style={{ width: "100%", marginTop: "10px", padding: "8px", borderRadius: "8px", border: "none", fontWeight: "600", fontSize: "12px", cursor: isOutOfStock ? "not-allowed" : "pointer", backgroundColor: isOutOfStock ? "rgba(255,255,255,0.04)" : "#38bdf8", color: isOutOfStock ? "#64748b" : "#02040a" }}
                >
                  {isOutOfStock ? "بەردەست نییە" : "زیادکردن بۆ سەبەتە"}
                </button>
              </div>
            );
          })}
        </div>

        {totalCartCount > 0 && (
          <div style={{ position: "fixed", bottom: "16px", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: "500px", backgroundColor: "rgba(10, 14, 28, 0.9)", backdropFilter: "blur(20px)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "16px", padding: "12px 16px", zIndex: 999, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            
            <div style={{ maxHeight: "130px", overflowY: "auto", marginBottom: "10px", paddingRight: "4px", display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
              {cart.map((item) => (
                <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <span style={{ color: "#e2e8f0" }}>{item.product.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#34d399", fontWeight: "600" }}>{(item.product.price * item.quantity).toLocaleString()}</span>
                    <div style={{ display: "flex", alignItems: "center", backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", overflow: "hidden" }}>
                      <button onClick={() => removeFromCart(item.product.id)} style={{ backgroundColor: "transparent", color: "#f87171", border: "none", padding: "2px 6px", cursor: "pointer", fontWeight: "bold" }}>-</button>
                      <span style={{ padding: "0 6px", color: "#fff", fontSize: "11px" }}>{item.quantity}</span>
                      <button onClick={() => addToCart(item.product)} style={{ backgroundColor: "transparent", color: "#38bdf8", border: "none", padding: "2px 6px", cursor: "pointer", fontWeight: "bold" }}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>سەبەتە ({totalCartCount} دانە)</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#34d399" }}>{totalCartAmount.toLocaleString()} IQD</div>
              </div>
              <button onClick={handleOpenCheckout} style={{ backgroundColor: "#38bdf8", color: "#02040a", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>تەواوکردنی کڕین</button>
            </div>
          </div>
        )}

        {showCheckout && currentUser && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2, 4, 10, 0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div className="bento-card" style={{ borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "400px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", margin: "0 0 12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "10px" }}>تەواوکردنی داواکاری</h2>
              <form onSubmit={handleFinalSubmitOrder} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>شار:</label>
                  <select value={orderCity} onChange={(e) => setOrderCity(e.target.value)} style={{ width: "100%", backgroundColor: "rgba(2, 4, 10, 0.8)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "8px", padding: "10px", color: "#e2e8f0", fontSize: "12px", outline: "none" }}>
                    {IRAQ_CITIES.map((city) => (<option key={city} value={city}>{city}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>گەڕەک:</label>
                  <input type="text" placeholder="گەڕەک..." value={orderStreet} onChange={(e) => setOrderStreet(e.target.value)} style={{ width: "100%", boxSizing: "border-box", backgroundColor: "rgba(2, 4, 10, 0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px", color: "#fff", fontSize: "12px" }} required />
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: "#22c55e", color: "#02040a", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>ناردنی داواکاری</button>
                  <button type="button" onClick={() => setShowCheckout(false)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", color: "#cbd5e1", border: "none", padding: "10px", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>پاشگەزبوونەوە</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}