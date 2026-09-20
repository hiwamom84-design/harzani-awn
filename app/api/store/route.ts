import { NextResponse } from "next/server";

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

let globalProducts: Product[] = [
  {
    id: 1,
    name: "زاهی",
    price: 1000,
    stock: 10,
    img: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600",
    category: "پاککەرەوە",
  },
];

let globalCategories: string[] = ["پاککەرەوە", "game"];
let globalOrders: Order[] = [];
let globalRegisteredUsers: RegisteredUser[] = [];

export async function GET() {
  return NextResponse.json({
    products: globalProducts,
    categories: globalCategories,
    orders: globalOrders,
    registeredUsers: globalRegisteredUsers,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

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
        globalProducts.unshift(newProduct);
        return NextResponse.json({ success: true, products: globalProducts });
      }

      case "ADD_CATEGORY": {
        const cat = payload.category.trim().replace(/^#/, "");
        if (cat && !globalCategories.includes(cat)) {
          globalCategories.push(cat);
        }
        return NextResponse.json({ success: true, categories: globalCategories });
      }

      case "UPDATE_PRODUCT_CATEGORY": {
        globalProducts = globalProducts.map((p) =>
          p.id === payload.id ? { ...p, category: payload.category } : p
        );
        return NextResponse.json({ success: true, products: globalProducts });
      }

      case "DELETE_PRODUCT": {
        globalProducts = globalProducts.filter((p) => p.id !== payload.id);
        return NextResponse.json({ success: true, products: globalProducts });
      }

      case "UPDATE_STOCK": {
        globalProducts = globalProducts.map((p) =>
          p.id === payload.id ? { ...p, stock: payload.stock } : p
        );
        return NextResponse.json({ success: true, products: globalProducts });
      }

      case "REGISTER_USER": {
        const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const existingIndex = globalRegisteredUsers.findIndex((u) => u.phone === payload.phone);

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
          globalRegisteredUsers[existingIndex] = newUser;
        } else {
          globalRegisteredUsers.push(newUser);
        }

        // 🚀 ناردنی خودکاری کۆد بۆ وەتسአپ بە بێ بەرانبەر
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

        return NextResponse.json({ success: true, registeredUsers: globalRegisteredUsers });
      }

      case "VERIFY_REGISTER_CODE": {
        const user = globalRegisteredUsers.find((u) => u.phone === payload.phone);
        if (user && user.verificationCode === payload.code) {
          user.isVerified = true;
          return NextResponse.json({ success: true, registeredUsers: globalRegisteredUsers });
        }
        return NextResponse.json({ success: false, error: "کۆد هەڵەیە" }, { status: 400 });
      }

      case "DELETE_REGISTERED_USER": {
        globalRegisteredUsers = globalRegisteredUsers.filter((u) => u.phone !== payload.phone);
        return NextResponse.json({ success: true, registeredUsers: globalRegisteredUsers });
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
          const prod = globalProducts.find((p) => p.name === item.name);
          if (prod) {
            prod.stock = Math.max(0, prod.stock - item.quantity);
          }
        });

        globalOrders.unshift(newOrder);
        return NextResponse.json({ success: true, orders: globalOrders });
      }

      case "SEND_TO_STORE": {
        globalOrders = globalOrders.map((o) =>
          o.id === payload.orderId ? { ...o, status: "store_preparing" } : o
        );
        return NextResponse.json({ success: true, orders: globalOrders });
      }

      case "READY_FOR_DELIVERY": {
        globalOrders = globalOrders.map((o) =>
          o.id === payload.orderId ? { ...o, status: "ready_for_delivery" } : o
        );
        return NextResponse.json({ success: true, orders: globalOrders });
      }

      case "DELIVER_ORDER": {
        const deliverTime = new Date();
        const deliveredStr = `${deliverTime.toLocaleDateString("en-GB")} | ${deliverTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
        globalOrders = globalOrders.map((o) =>
          o.id === payload.orderId ? { ...o, status: "delivered", deliveredAt: deliveredStr } : o
        );
        return NextResponse.json({ success: true, orders: globalOrders });
      }

      case "CANCEL_ORDER": {
        const targetOrder = globalOrders.find((o) => o.id === payload.orderId);
        if (targetOrder) {
          targetOrder.items.forEach((it) => {
            const prod = globalProducts.find((p) => p.name === it.name);
            if (prod) prod.stock += it.quantity;
          });
          globalOrders = globalOrders.filter((o) => o.id !== payload.orderId);
        }
        return NextResponse.json({ success: true, orders: globalOrders, products: globalProducts });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}