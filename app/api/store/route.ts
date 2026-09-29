import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false }
});

// دروستکردنی خشتەکان (Tables) ئەگەر بوونیان نەبوو
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_data (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL
      );
    `);
    
    // پشکنین ئەگەر مێزەکە خاڵی بوو، داتای سەرەتایی تێبکە
    const res = await pool.query(`SELECT COUNT(*) FROM store_data;`);
    if (parseInt(res.rows[0].count) === 0) {
      const initialData = {
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
      await pool.query(`INSERT INTO store_data (data) VALUES ($1);`, [JSON.stringify(initialData)]);
    }
  } catch (err) {
    console.log("هەڵە لە دروستکردنی داتابەیس:", err);
  }
}

initDB();

async function readDB() {
  try {
    const res = await pool.query(`SELECT data FROM store_data LIMIT 1;`);
    if (res.rows.length > 0) {
      return res.rows[0].data;
    }
  } catch (err) {
    console.log("هەڵە لە خوێندنەوەی داتابەیس:", err);
  }
  return {
    products: [],
    categories: ["پاککەرەوە", "game"],
    orders: [],
    registeredUsers: [],
  };
}

async function writeDB(data: any) {
  try {
    await pool.query(`UPDATE store_data SET data = $1;`, [JSON.stringify(data)]);
  } catch (err) {
    console.log("هەڵە لە پاشەکەوتکردنی داتابەیس:", err);
  }
}

export async function GET() {
  const db = await readDB();
  return NextResponse.json({
    products: db.products || [],
    categories: db.categories || ["پاککەرەوە", "game"],
    orders: db.orders || [],
    registeredUsers: db.registeredUsers || [],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    let db = await readDB();

    switch (action) {
      case "ADD_PRODUCT": {
        const newProduct = {
          id: Date.now(),
          name: payload.name,
          price: payload.price,
          stock: payload.stock,
          img: payload.img,
          category: payload.category || "گشتی",
        };
        db.products.unshift(newProduct);
        await writeDB(db);
        return NextResponse.json({ success: true, products: db.products });
      }

      case "ADD_CATEGORY": {
        const cat = payload.category.trim().replace(/^#/, "");
        if (cat && !db.categories.includes(cat)) {
          db.categories.push(cat);
          await writeDB(db);
        }
        return NextResponse.json({ success: true, categories: db.categories });
      }

      case "UPDATE_PRODUCT_CATEGORY": {
        db.products = db.products.map((p: any) =>
          p.id === payload.id ? { ...p, category: payload.category } : p
        );
        await writeDB(db);
        return NextResponse.json({ success: true, products: db.products });
      }

      case "DELETE_PRODUCT": {
        db.products = db.products.filter((p: any) => p.id !== payload.id);
        await writeDB(db);
        return NextResponse.json({ success: true, products: db.products });
      }

      case "UPDATE_STOCK": {
        db.products = db.products.map((p: any) =>
          p.id === payload.id ? { ...p, stock: payload.stock } : p
        );
        await writeDB(db);
        return NextResponse.json({ success: true, products: db.products });
      }

      case "REGISTER_USER": {
        const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const existingIndex = db.registeredUsers.findIndex((u: any) => u.phone === payload.phone);

        const newUser = {
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
        await writeDB(db);

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

      case "REQUEST_LOGIN": {
        const user = db.registeredUsers.find((u: any) => u.phone === payload.phone);
        if (!user) {
          return NextResponse.json({ success: false, error: "ئەم ژمارە تەلەفۆنە تۆمار نەکراوە!" }, { status: 400 });
        }

        const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
        user.verificationCode = randomOtp;
        user.isVerified = false;
        await writeDB(db);

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
        const user = db.registeredUsers.find((u: any) => u.phone === payload.phone);
        if (user && user.verificationCode === payload.code) {
          user.isVerified = true;
          await writeDB(db);
          return NextResponse.json({ success: true, registeredUsers: db.registeredUsers });
        }
        return NextResponse.json({ success: false, error: "کۆد هەڵەیە" }, { status: 400 });
      }

      case "DELETE_REGISTERED_USER": {
        db.registeredUsers = db.registeredUsers.filter((u: any) => u.phone !== payload.phone);
        await writeDB(db);
        return NextResponse.json({ success: true, registeredUsers: db.registeredUsers });
      }

      case "ADD_ORDER": {
        const now = new Date();
        const dateStr = `${now.toLocaleDateString("en-GB")} - ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

        const newOrder = {
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
          const prod = db.products.find((p: any) => p.name === item.name);
          if (prod) {
            prod.stock = Math.max(0, prod.stock - item.quantity);
          }
        });

        db.orders.unshift(newOrder);
        await writeDB(db);
        return NextResponse.json({ success: true, orders: db.orders });
      }

      case "SEND_TO_STORE": {
        db.orders = db.orders.map((o: any) =>
          o.id === payload.orderId ? { ...o, status: "store_preparing" } : o
        );
        await writeDB(db);
        return NextResponse.json({ success: true, orders: db.orders });
      }

      case "READY_FOR_DELIVERY": {
        db.orders = db.orders.map((o: any) =>
          o.id === payload.orderId ? { ...o, status: "ready_for_delivery" } : o
        );
        await writeDB(db);
        return NextResponse.json({ success: true, orders: db.orders });
      }

      case "DELIVER_ORDER": {
        const deliverTime = new Date();
        const deliveredStr = `${deliverTime.toLocaleDateString("en-GB")} | ${deliverTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
        db.orders = db.orders.map((o: any) =>
          o.id === payload.orderId ? { ...o, status: "delivered", deliveredAt: deliveredStr } : o
        );
        await writeDB(db);
        return NextResponse.json({ success: true, orders: db.orders });
      }

      case "CANCEL_ORDER": {
        const targetOrder = db.orders.find((o: any) => o.id === payload.orderId);
        if (targetOrder) {
          targetOrder.items.forEach((it: any) => {
            const prod = db.products.find((p: any) => p.name === it.name);
            if (prod) prod.stock += it.quantity;
          });
          db.orders = db.orders.filter((o: any) => o.id !== payload.orderId);
          await writeDB(db);
        }
        return NextResponse.json({ success: true, orders: db.orders, products: db.products });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.log("Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}