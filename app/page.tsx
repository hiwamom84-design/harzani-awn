"use client";
import { useState, useEffect, useRef } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  img: string;
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
  status: "pending" | "delivered";
  date: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Checkout inputs
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("0750");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [gpsGuideMessage, setGpsGuideMessage] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Add Product states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [selectedImage, setSelectedImage] = useState<string>("");

  const prevOrdersCount = useRef<number>(0);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  };

  const fetchLiveData = async () => {
    try {
      const res = await fetch("/api/store", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.products) setProducts(data.products);
        if (data.orders) {
          if (data.orders.length > prevOrdersCount.current && prevOrdersCount.current !== 0) {
            playNotificationSound();
          }
          prevOrdersCount.current = data.orders.length;
          setOrders(data.orders);
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
    return () => clearInterval(timer);
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "harzaniawn987") {
      setIsAdmin(true);
      setShowLoginModal(false);
      setPasswordInput("");
    } else {
      alert("وشەی نهێنی هەڵەیە!");
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

  const handleMarkDelivered = async (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "delivered" as const } : o))
    );
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELIVER_ORDER", payload: { orderId } }),
      });
    } catch (err) {}
  };

  // هەڵوەشاندنەوەی داواکاری تەنها لەلایەن ئەدمینەوە
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

  const totalCartAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleGetLocation = () => {
    setGpsGuideMessage("");
    if (!navigator.geolocation) {
      setGpsGuideMessage("مۆبایلەکەت پشتیوانی GPS ناکات.");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationUrl(`https://www.google.com/maps?q=${lat},${lng}`);
        setLocLoading(false);
        setGpsGuideMessage("");
      },
      () => {
        setLocLoading(false);
        setGpsGuideMessage(
          "⚠️ تکایە GPS (شوێن)ی ناو مۆبایلەکەت پێبکە و مۆڵەتەکە پەسەند بکە، دواتر دیسان کلیک لەم دوگمەیە بکەرەوە."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFinalOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || phoneNumber.length < 7 || !customerAddress.trim()) {
      alert("تکایە ناوی سیانی، ناونیشان و ژمارەی مۆبایلەکە بە دروستی بنووسە.");
      return;
    }

    const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;

    const payload = {
      customerName: customerName.trim(),
      customerPhone: fullPhoneNumber,
      customerAddress: customerAddress.trim(),
      locationUrl,
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
        setCustomerName("");
        setPhoneNumber("");
        setCustomerAddress("");
        setLocationUrl("");
        setGpsGuideMessage("");
        fetchLiveData();
      }
    } catch (err) {}
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const outOfStockItems = products.filter((p) => p.stock <= 0);

  if (!isLoaded) return <div className="min-h-screen bg-neutral-900 text-white p-8">داگرتنی زانیارییەکان لە سێرڤەر...</div>;

  return (
    <main dir="rtl" className="min-h-screen bg-neutral-900 text-white p-4 md:p-8 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-center pb-6 border-b border-neutral-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-500 tracking-wide">
            هەرزانی ئاون
          </h1>
          <p className="text-xs text-neutral-400 mt-1">فرۆشگای فەرمی هەرزانی ئاون بە نرخی دیناری عێراقی (IQD)</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (cart.length === 0) alert("سەبەتەکەت بەتاڵە!");
              else setShowCheckout(true);
            }}
            className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2.5 rounded-xl border border-neutral-700 text-sm flex items-center gap-2"
          >
            🛒 سەبەتە: <span className="font-bold text-blue-400">{cart.reduce((s, i) => s + i.quantity, 0)}</span> دانە
          </button>

          {!isAdmin ? (
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-neutral-800 hover:bg-neutral-700 text-xs px-3 py-2.5 rounded-xl border border-neutral-700 text-neutral-400"
            >
              🔒 لۆگینی ئەدمین
            </button>
          ) : (
            <button
              onClick={() => setIsAdmin(false)}
              className="bg-red-600/80 hover:bg-red-600 text-xs px-3 py-2.5 rounded-xl"
            >
              دەرچوون لە ئەدمین
            </button>
          )}
        </div>
      </header>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-3">چوونەژوورەوەی ئەدمین</h3>
            <p className="text-xs text-neutral-400 mb-4">وشەی نهێنی تایبەت بنووسە:</p>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="password"
                placeholder="وشەی نهێنی..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-xl text-sm font-semibold">
                  چوونەژوورەوە
                </button>
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 bg-neutral-700 hover:bg-neutral-600 py-2 rounded-xl text-sm">
                  داخستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div className="mt-4 bg-green-950/60 border border-green-500 text-green-300 p-4 rounded-2xl flex justify-between items-center">
          <div>
            <p className="font-bold">داواکارییەکەت بە سەرکەوتوویی نێردرا! 🎉</p>
            <p className="text-xs mt-1">ئەدمین ئاگادار کرایەوە و بە زووترین کات پەیوەندیت پێوە دەکەین.</p>
          </div>
          <button onClick={() => setOrderSuccess(false)} className="text-sm bg-green-900 hover:bg-green-800 px-3 py-1 rounded-xl">
            باشە
          </button>
        </div>
      )}

      {/* بەشی ئەدمین */}
      {isAdmin && (
        <div className="space-y-6 mt-6">
          <section className="bg-neutral-800/90 border border-amber-500/60 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              🔔 داواکارییە نوێیەکان بۆ گەیاندن ({pendingOrders.length})
            </h2>

            {pendingOrders.length === 0 ? (
              <p className="text-xs text-neutral-400">هیچ داواکارییەکی نوێ نییە کە چاوەڕوانی گەیاندن بێت.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {pendingOrders.map((o) => (
                  <div key={o.id} className="bg-neutral-900 border border-amber-500/40 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white text-base">کڕیار: {o.customerName}</span>
                        <span className="text-xs bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded">
                          کات: {o.date}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-300 mt-1">
                        📞 مۆبایل: <a href={`tel:${o.customerPhone}`} className="text-blue-400 font-bold underline">{o.customerPhone}</a>
                      </p>
                      <p className="text-sm text-neutral-300 mt-1">📍 ناونیشان: {o.customerAddress}</p>
                      {o.locationUrl && (
                        <p className="mt-2">
                          <a href={o.locationUrl} target="_blank" rel="noreferrer" className="inline-block bg-green-700/80 hover:bg-green-600 text-xs px-3 py-1.5 rounded-lg text-white font-medium">
                            🗺️ کردنەوە لە Google Maps
                          </a>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col justify-between items-end gap-3 bg-neutral-800 p-3 rounded-xl border border-neutral-700 min-w-[220px]">
                      <div className="w-full">
                        <p className="text-xs text-neutral-400 mb-1 font-bold">کەلوپەلەکان:</p>
                        <ul className="text-xs space-y-1">
                          {o.items.map((it, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>{it.name} × {it.quantity}</span>
                              <span className="text-green-400 font-bold">{(it.price * it.quantity).toLocaleString()} IQD</span>
                            </li>
                          ))}
                        </ul>
                        <div className="border-t border-neutral-700 mt-2 pt-1 flex justify-between font-bold text-sm">
                          <span>کۆی گشتی:</span>
                          <span className="text-green-400">{o.total.toLocaleString()} IQD</span>
                        </div>
                      </div>

                      <div className="w-full space-y-2">
                        <button
                          onClick={() => handleMarkDelivered(o.id)}
                          className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold text-xs active:scale-95 transition"
                        >
                          گەیەندرا و تەواو بوو ✅
                        </button>
                        {/* دوگمەی تایبەت بە ئەدمین بۆ هەڵوەشاندنەوەی داواکاری */}
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          className="w-full bg-red-900/40 hover:bg-red-900/80 text-red-300 border border-red-800/50 py-1.5 rounded-lg font-medium text-xs active:scale-95 transition"
                        >
                          هەڵوەشاندنەوەی داواکاری ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ئەرشیفی داواکارییە گەیەندراوەکان */}
          <section className="bg-neutral-800/90 border border-neutral-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-neutral-200 mb-3 flex items-center gap-2">
              📁 ئەرشیفی هەموو فرۆشراوەکان (Order History) - {deliveredOrders.length} داواکاری
            </h3>
            {deliveredOrders.length === 0 ? (
              <p className="text-xs text-neutral-400">تا ئێستا هیچ داواکارییەکی گەیەندراو لە ئەرشیفدا نییە.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {deliveredOrders.map((d) => (
                  <div key={d.id} className="bg-neutral-900/90 p-4 rounded-xl flex justify-between items-center text-sm border border-neutral-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{d.customerName}</span>
                        <span className="text-xs text-neutral-400">({d.customerPhone})</span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">📍 {d.customerAddress}</p>
                      <p className="text-xs text-neutral-300 mt-1">
                        کڕدراوە: {d.items.map((i) => `${i.name} (${i.quantity} دانە)`).join("، ")}
                      </p>
                    </div>
                    <div className="text-left">
                      <span className="text-green-400 font-extrabold text-base block">{d.total.toLocaleString()} IQD</span>
                      <span className="inline-block bg-green-950/60 border border-green-700/60 text-green-300 text-[11px] px-2 py-0.5 rounded-md mt-1">
                        گەیەندراوە ✓
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* زیادکردنی کاڵای نوێ */}
          <section className="bg-neutral-800/90 border border-blue-500/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-blue-400 mb-4">⚡ زیادکردنی کاڵای نوێ بۆ فرۆشگا</h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <input
                type="text"
                placeholder="ناوی کاڵا"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="number"
                placeholder="نرخ بە دینار (IQD)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="number"
                placeholder="عەدەد (Stock)"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-xs text-neutral-400 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-700 file:text-white cursor-pointer"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95"
              >
                + زیادکردن
              </button>
            </form>
          </section>

          <section className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-neutral-300 mb-2">کەلوپەلە نەماوەکان (عەدەد = 0)</h2>
            {outOfStockItems.length === 0 ? (
              <p className="text-xs text-neutral-400">هیچ کاڵایەک نەبڕاوەتەوە.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {outOfStockItems.map((item) => (
                  <div key={item.id} className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-200">{item.name}</p>
                      <p className="text-xs text-neutral-400">{item.price.toLocaleString()} IQD</p>
                    </div>
                    <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded">0 دانە</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* گەڕان */}
      <div className="mt-8 max-w-md mx-auto">
        <input
          type="text"
          placeholder="🔍 گەڕان بەدوای کەلوپەل..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
        />
      </div>

      {/* لیستی بەرهەمەکان */}
      <div className="flex justify-between items-center mt-10 mb-4">
        <h2 className="text-xl font-bold text-neutral-300">هەموو کەلوپەلەکان</h2>
        <span className="text-xs text-neutral-500">{filteredProducts.length} بەرهەم</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((item) => {
          const isOutOfStock = item.stock <= 0;
          return (
            <div key={item.id} className="bg-neutral-800 border border-neutral-700 rounded-2xl overflow-hidden p-4 flex flex-col justify-between transition duration-200 hover:border-neutral-600">
              <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 bg-neutral-900 border border-neutral-700/50">
                <img
                  src={item.img}
                  alt={item.name}
                  className={`w-full h-full object-cover ${isOutOfStock ? "grayscale opacity-50" : ""}`}
                />
              </div>

              <div>
                <h3 className={`font-bold text-lg ${isOutOfStock ? "text-neutral-400" : "text-white"}`}>{item.name}</h3>
                <p className="text-xl font-extrabold text-green-400 mt-1">{item.price.toLocaleString()} <span className="text-xs text-neutral-400">IQD</span></p>
                {isAdmin && (
                  <div className="mt-3 bg-neutral-900 p-2.5 rounded-xl border border-neutral-700">
                    <label className="text-xs text-blue-400 block mb-1">دەستکاری عەدەد (ستۆک):</label>
                    <div className="flex items-center gap-2">
                      <input type="number" value={item.stock} onChange={(e) => handleUpdateStock(item.id, Number(e.target.value))} className="bg-neutral-800 border border-neutral-600 w-20 px-2 py-1 rounded text-sm text-center" />
                      <span className="text-xs text-neutral-400">دانە</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <button onClick={() => addToCart(item)} disabled={isOutOfStock} className={`w-full py-2.5 rounded-xl font-medium text-sm ${isOutOfStock ? "bg-neutral-700 text-neutral-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
                  {isOutOfStock ? "نەماوە (تەواو بووە)" : "خستنە ناو سەبەتە"}
                </button>
                {isAdmin && (
                  <button onClick={() => handleDeleteProduct(item.id)} className="w-full bg-neutral-700 hover:bg-neutral-600 text-neutral-300 border border-neutral-600 py-1.5 rounded-xl text-xs">
                    سڕینەوەی ئەم کاڵایە
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* مۆداڵی کڕین و سەبەتە */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-neutral-800 border border-neutral-700 rounded-3xl p-6 w-full max-w-lg my-8">
            <h2 className="text-xl font-bold mb-4 text-blue-400 border-b border-neutral-700 pb-3">
              🛒 پێداچوونەوە و پەسەندکردنی داواکاری
            </h2>
            <div className="space-y-3 mb-6 max-h-52 overflow-y-auto pr-1">
              {cart.map((c) => (
                <div key={c.product.id} className="bg-neutral-900 p-3 rounded-2xl border border-neutral-700/60 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-sm">{c.product.name}</h4>
                    <p className="text-xs text-green-400 mt-0.5">{c.product.price.toLocaleString()} IQD</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-neutral-800 rounded-xl border border-neutral-700">
                      <button onClick={() => updateCartQuantity(c.product.id, 1)} className="px-2.5 py-1 text-sm hover:text-blue-400">+</button>
                      <span className="px-2 text-xs font-bold">{c.quantity}</span>
                      <button onClick={() => updateCartQuantity(c.product.id, -1)} className="px-2.5 py-1 text-sm hover:text-neutral-400">-</button>
                    </div>
                    <button onClick={() => removeFromCart(c.product.id)} className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-800 border border-neutral-700">سڕینەوە</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-lg font-bold bg-neutral-900 p-3.5 rounded-2xl mb-6 border border-neutral-700">
              <span>کۆی گشتی بۆ کڕین:</span>
              <span className="text-green-400">{totalCartAmount.toLocaleString()} IQD</span>
            </div>
            <form onSubmit={handleFinalOrder} className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-300">زانیاری کڕیار بۆ گەیاندن:</h3>
              <input type="text" placeholder="ناوی سیانی تەواو" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" required />

              <div>
                <label className="text-xs text-neutral-400 block mb-1">هێڵی مۆبایل هەڵبژێرە:</label>
                <div className="flex gap-2" dir="ltr">
                  <select
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-blue-400 font-bold"
                  >
                    <optgroup label="کۆڕەک تیلیکۆم">
                      <option value="0750">0750 (Korek)</option>
                      <option value="0751">0751 (Korek)</option>
                    </optgroup>
                    <optgroup label="ئاسیاسێڵ">
                      <option value="0770">0770 (Asiacell)</option>
                      <option value="0771">0771 (Asiacell)</option>
                      <option value="0772">0772 (Asiacell)</option>
                    </optgroup>
                    <optgroup label="زەین عێراق">
                      <option value="0780">0780 (Zain)</option>
                      <option value="0781">0781 (Zain)</option>
                      <option value="0782">0782 (Zain)</option>
                    </optgroup>
                  </select>

                  <input
                    type="tel"
                    maxLength={7}
                    placeholder="xxxxxxx (۷ ژمارەکەی تر)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-left font-mono"
                    required
                  />
                </div>
              </div>

              <input type="text" placeholder="شار و گەڕەک و ناونیشانی نزیک" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" required />
              
              <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-700 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locLoading}
                  className={`border text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 font-medium transition ${
                    locLoading
                      ? "bg-neutral-800 border-neutral-600 text-blue-300 cursor-wait"
                      : "bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-white"
                  }`}
                >
                  {locLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin text-sm">⏳</span> تکایە کەمێک چاوەڕێ بکە... شوێنەکەت دەدۆزرێتەوە
                    </span>
                  ) : (
                    <span>📍 دیاریکردنی شوێن بە شێوەی خودکار (GPS)</span>
                  )}
                </button>

                {gpsGuideMessage && (
                  <div className="bg-neutral-800 border border-neutral-600 text-neutral-300 p-2.5 rounded-lg text-xs leading-relaxed text-center">
                    {gpsGuideMessage}
                  </div>
                )}

                {locationUrl && !locLoading && (
                  <p className="text-xs text-green-400 text-center font-bold">✓ شوێنەکەت بە سەرکەوتوویی وەرگیرا</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold text-sm">
                  پەسەندکردن و کڕین (Agree) ✅
                </button>
                <button type="button" onClick={() => setShowCheckout(false)} className="flex-1 bg-neutral-700 hover:bg-neutral-600 py-3 rounded-xl text-sm">
                  دەستکاریکردن (Change)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}