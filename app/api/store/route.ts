import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  img: string;
  category?: string;
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

interface DBData {
  products: Product[];
  categories: string[];
  orders: Order[];
  registeredUsers: RegisteredUser[];
}

const dbFilePath = path.join(process.cwd(), "store_db.json");

function readDB(): DBData {
  try {
    if (fs.existsSync(dbFilePath)) {
      const fileData = fs.readFileSync(dbFilePath, "utf8");
      const parsed = JSON.parse(fileData);
      return {
        products: parsed.products || [],
        categories: parsed.categories || ["پاککەرەوە", "game"],
        orders: parsed.orders || [],
        registeredUsers: parsed.registeredUsers || [],
      };
    }
  } catch (err) {
    console.log("هەڵە لە خوێندنەوەی داتابەیس:", err);
  }

  return {
    products: [
      {
        id: 1,
        name: "زاهی",
        price: 1000,
        stock: 10,
        img: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600",
        category: "پاککەرەوە",
      },
    ],
    categories: ["پاککەرەوە", "game"],
    orders: [],
    registeredUsers: [],
  };
}

function writeDB(data: DBData) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.log("هەڵە لە پاشەکەوتکردنی داتابەیس:", err);
  }
}

export async function GET() {
  const db = readDB();
  return NextResponse.json({
    products: db.products,
    categories: db.categories,
    orders: db.orders,
    registeredUsers: db.registeredUsers,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    let db = readDB();

    switch (action) {
      case "ADD_PRODUCT": {
        const newProduct: Product = {
          id: Date.now(),
          name: payload.name,
          price: payload.price,
          stock: payload.stock,
          img: payload.img,
          category: payload.category || "گشتی",
        };
        db.products.unshift(newProduct);
        writeDB(db);
        return NextResponse.json({ success: true, products: db.products });
      }

      case "ADD_CATEGORY": {
        const cat = payload.category.trim().replace(/^#/, "");
        if (cat && !db.categories.includes(cat)) {
          db.categories.push(cat);
          writeDB(db);
        }
        return NextResponse.json({ success: true, categories: db.categories });
      }

      case "UPDATE_PRODUCT_CATEGORY": {
        db.products = db.products.map((p) =>
          p.id === payload.id ? { ...p, category: payload.category } : p
        );
        writeDB(db);
        return NextResponse.json({ success: true, products: db.products });
      }

      case "DELETE_PRODUCT": {
        db.products = db.products.filter((p) => p.id !== payload.id);
        writeDB(db);
        return NextResponse.json({ success: true, products: db.products });
      }

      case "UPDATE_STOCK": {
        db.products = db.products.map((p) =>
          p.id === payload.id ? { ...p, stock: payload.stock } : p
        );
        writeDB(db);
        return NextResponse.json({ success: true, products: db.products });
      }

      case "REGISTER_USER": {
        const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const existingIndex = db.registeredUsers.findIndex((u) => u.phone === payload.phone);

        const newUser: RegisteredUser = {
          phone: payload.phone,
          name: payload.name,
          city: payload.city,
          street: payload.street,
          locationUrl: payload.locationUrl,
          verificationCode: randomOtp,
          isVerified: false,
        };

        if (existingIndex >= 0) {
          db.registeredUsers[existingIndex] = newUser;
        } else {
          db.registeredUsers.push(newUser);
        }
        writeDB(db);

        try {
          const cleanPhone = payload.phone.startsWith("0") ? payload.phone.substring(1) : payload.phone;
          const whatsappMessage = `سڵاو بەڕێز ${payload.name}، کۆدی پشکنینی تۆ لە هەرزانی ئاون ئەمەیە: ${randomOtp}`;
          
          await fetch("http://localhost:3001/send-whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: `964${cleanPhone}`,
              message: whatsappMessage,
            }),
          });
        } catch (err) {
          console.log("هەڵە لە ناردنی وەتسአپ:", err);
        }

        return NextResponse.json({ success: true, registeredUsers: db.registeredUsers });
      }

      // 👇 چوونەژوورەوە: هەر جارێک داوا بکرێت، کۆدی نوێ دەنێرێت و دەبێت کۆدەکە بنووسێت تا بچێتە ژوورەوە
      case "REQUEST_LOGIN": {
        const user = db.registeredUsers.find((u) => u.phone === payload.phone);
        if (!user) {
          return NextResponse.json({ success: false, error: "ئەم ژمارە تەلەفۆنە تۆمار نەکراوە!" }, { status: 400 });
        }

        const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
        user.verificationCode = randomOtp;
        user.isVerified = false; // دەبێت دووبارە پشکنین بکاتەوە
        writeDB(db);

        try {
          const cleanPhone = payload.phone.startsWith("0") ? payload.phone.substring(1) : payload.phone;
          const whatsappMessage = `سڵاو بەڕێز ${user.name}، کۆدی چوونەژوورەوەت بۆ هەرزانی ئاون ئەمەیە: ${randomOtp}`;
          
          await fetch("http://localhost:3001/send-whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: `964${cleanPhone}`,
              message: whatsappMessage,
            }),
          });
        } catch (err) {
          console.log("هەڵە لە ناردنی وەتسአپ بۆ چوونەژوورەوە:", err);
        }

        return NextResponse.json({ success: true, message: "کۆدی چوونەژوورەوە نێردرا" });
      }

      case "VERIFY_REGISTER_CODE": {
        const user = db.registeredUsers.find((u) => u.phone === payload.phone);
        if (user && user.verificationCode === payload.code) {
          user.isVerified = true;
          writeDB(db);
          return NextResponse.json({ success: true, registeredUsers: db.registeredUsers });
        }
        return NextResponse.json({ success: false, error: "کۆد هەڵەیە" }, { status: 400 });
      }

      case "DELETE_REGISTERED_USER": {
        db.registeredUsers = db.registeredUsers.filter((u) => u.phone !== payload.phone);
        writeDB(db);
        return NextResponse.json({ success: true, registeredUsers: db.registeredUsers });
      }

      case "ADD_ORDER": {
        const now = new Date();
        const dateStr = `${now.toLocaleDateString("en-GB")} - ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

        const newOrder: Order = {
          id: Date.now(),
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          customerAddress: payload.customerAddress,
          locationUrl: payload.locationUrl,
          items: payload.items,
          total: payload.total,
          status: "admin_review",
          date: dateStr,
        };

        payload.items.forEach((item: any) => {
          const prod = db.products.find((p) => p.name === item.name);
          if (prod) {
            prod.stock = Math.max(0, prod.stock - item.quantity);
          }
        });

        db.orders.unshift(newOrder);
        writeDB(db);
        return NextResponse.json({ success: true, orders: db.orders });
      }

      case "SEND_TO_STORE": {
        db.orders = db.orders.map((o) =>
          o.id === payload.orderId ? { ...o, status: "store_preparing" } : o
        );
        writeDB(db);
        return NextResponse.json({ success: true, orders: db.orders });
      }

      case "READY_FOR_DELIVERY": {
        db.orders = db.orders.map((o) =>
          o.id === payload.orderId ? { ...o, status: "ready_for_delivery" } : o
        );
        writeDB(db);
        return NextResponse.json({ success: true, orders: db.orders });
      }

      case "DELIVER_ORDER": {
        const deliverTime = new Date();
        const deliveredStr = `${deliverTime.toLocaleDateString("en-GB")} | ${deliverTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
        db.orders = db.orders.map((o) =>
          o.id === payload.orderId ? { ...o, status: "delivered", deliveredAt: deliveredStr } : o
        );
        writeDB(db);
        return NextResponse.json({ success: true, orders: db.orders });
      }

      case "CANCEL_ORDER": {
        const targetOrder = db.orders.find((o) => o.id === payload.orderId);
        if (targetOrder) {
          targetOrder.items.forEach((it) => {
            const prod = db.products.find((p) => p.name === it.name);
            if (prod) prod.stock += it.quantity;
          });
          db.orders = db.orders.filter((o) => o.id !== payload.orderId);
          writeDB(db);
        }
        return NextResponse.json({ success: true, orders: db.orders, products: db.products });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}