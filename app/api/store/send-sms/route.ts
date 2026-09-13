import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "ژمارەی مۆبایل یان کۆد نەدۆزرایەوە" }, { status: 400 });
    }

    // لێرەدا دەبەسترێتەوە بە SMS Provider (وەک Twilio یان FastSMS عێراق)
    // بەکارهێنانی API ی SMS:
    /*
    await fetch("https://api.twilio.com/...", {
      method: "POST",
      body: JSON.stringify({
        to: phone,
        message: `کۆدی پشتڕاستکردنەوەی هەرزانی ئاون: ${code}`
      })
    });
    */

    console.log(`[SMS Gateway] Sending code ${code} to ${phone}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "کێشەیەک لە ناردنی SMS هەیە" }, { status: 500 });
  }
}