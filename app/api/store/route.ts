import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "store_db.json");

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  img: string;
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

interface DB {
  products: Product[];
  orders: Order[];
}

const initialData: DB = {
  products: [
    {
      id: 1,
      name: "ماوسی گەیمینگ RGB",
      price: 35000,
      stock: 5,
      img: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600",
    },
    {
      id: 2,
      name: "کیبۆردی میکانیکی",
      price: 85000,
      stock: 0,
      img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    },
    {
      id: 3,
      name: "هێدفۆنی بێتەل",
      price: 55000,
      stock: 3,
      img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    },
  ],
  orders: [],
};

function readData(): DB {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return initialData;
  }
}

function writeData(data: DB) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {}
}

export async function GET() {
  const data = readData();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action, payload } = body;
  const db = readData();

  if (action === "ADD_PRODUCT") {
    const newProd = { ...payload, id: Date.now() };
    db.products.unshift(newProd);
    writeData(db);
    return NextResponse.json({ success: true, products: db.products });
  }

  if (action === "DELETE_PRODUCT") {
    db.products = db.products.filter((p) => p.id !== payload.id);
    writeData(db);
    return NextResponse.json({ success: true, products: db.products });
  }

  if (action === "UPDATE_STOCK") {
    db.products = db.products.map((p) =>
      p.id === payload.id ? { ...p, stock: Math.max(0, payload.stock) } : p
    );
    writeData(db);
    return NextResponse.json({ success: true, products: db.products });
  }

  if (action === "ADD_ORDER") {
    for (const item of payload.items) {
      const prod = db.products.find((p) => p.name === item.name);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    }
    const newOrder: Order = {
      ...payload,
      id: Date.now(),
      status: "pending",
      date: new Date().toLocaleTimeString("ku-IQ", { hour: "2-digit", minute: "2-digit" }),
    };
    db.orders.unshift(newOrder);
    writeData(db);
    return NextResponse.json({ success: true, orders: db.orders, products: db.products });
  }

  if (action === "DELIVER_ORDER") {
    db.orders = db.orders.map((o) =>
      o.id === payload.orderId ? { ...o, status: "delivered" as const } : o
    );
    writeData(db);
    return NextResponse.json({ success: true, orders: db.orders });
  }

  // هەڵوەشاندنەوەی داواکاری لەلایەن ئەدمین و گەڕاندنەوەی عەدەدی ستۆک
  if (action === "CANCEL_ORDER") {
    const targetOrder = db.orders.find((o) => o.id === payload.orderId);
    if (targetOrder) {
      for (const item of targetOrder.items) {
        const prod = db.products.find((p) => p.name === item.name);
        if (prod) {
          prod.stock += item.quantity;
        }
      }
      db.orders = db.orders.filter((o) => o.id !== payload.orderId);
      writeData(db);
    }
    return NextResponse.json({ success: true, orders: db.orders, products: db.products });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}