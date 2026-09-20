import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import express from "express";

const app = express();
app.use(express.json());

let sock;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // QR کۆدی گەورە ناڕوخێنێت
  });

  sock.ev.on("creds.update", saveCreds);

  // لێرەدا کۆدی بەستنەوە (Pairing Code) بەکاردەهێنین بە بێ پێویستی بە QR
  if (!sock.authState.creds.registered) {
    const phoneNumber = "9647501701136"; // 👈 ژمارەی وەتسአپەکەی خۆت لێرە بنوسە (بە نموونە 9647501234567)
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log("========================================");
        console.log(`📌 کۆدی بەستنەوەی وەتسአپی تۆ ئەمەیە: ${code}`);
        console.log("========================================");
      } catch (err) {
        console.log("هەڵە لە داواکردنی کۆد:", err);
      }
    }, 3000);
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      console.log("✅ وەتسአپ بۆت بە سەرکەوتوویی بەستراوەتەوە!");
    } else if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) connectToWhatsApp();
    }
  });
}

app.post("/send-whatsapp", async (req, res) => {
  const { phone, message } = req.body;
  try {
    const jid = `${phone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3001, () => {
  console.log("🚀 بۆتی وەتسአپ لە پۆرت ٣٠٠١ کار دەکات");
  connectToWhatsApp();
});