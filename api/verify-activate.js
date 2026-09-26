const IDT_BASE = "https://www.googleapis.com/identitytoolkit/v3/relyingparty";
const VFY_URL = "https://us-central1-alight-creative.cloudfunctions.net/verifyPurchase";
const API_KEY = process.env.AM_API_KEY || "AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0";
const INSTANCE_ID = process.env.AM_INSTANCE_ID || "cSDnCyp3T-uwp07z3tL86T:APA91bFkmvvsHw5nnqa1SBFci-99DRsKClLiETdRrVcJjS5yBx1v_FbCb1d8WhBuea_zmwnYBktyTIzcRhN4b6uNOUur9wPc0gKXmJDoZic0LhNq5V2s0xI";

function randIP() {
  return `${1 + Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`;
}

function spoofHeaders(h) {
  return {
    ...h,
    "x-forwarded-for": randIP(),
    "x-real-ip": randIP(),
    "client-ip": randIP(),
    "x-client-ip": randIP(),
    "x-originating-ip": randIP(),
    "x-cluster-client-ip": randIP()
  };
}

function extractCode(raw) {
  if (!raw) return null;
  let s = String(raw).replace(/&amp;/g, "&");
  try { s = decodeURIComponent(s); } catch (e) {}

  try {
    const u = new URL(s);
    const p = u.searchParams;
    let c = p.get("oobCode");
    if (!c) {
      const link = p.get("link") || p.get("q") || p.get("url");
      if (link) {
        try {
          const inner = new URL(link);
          c = inner.searchParams.get("oobCode");
        } catch (e) {}
      }
    }
    if (c) return c;
  } catch (e) {}

  const m = s.match(/oobCode=([a-zA-Z0-9_\-]+)/i);
  if (m) return m[1];

  const t = raw.trim();
  if (/^[a-zA-Z0-9_\-]{10,}$/.test(t) && !t.includes("://")) return t;
  return null;
}

const H1 = {
  "content-type": "application/json",
  "x-android-package": "com.alightcreative.motion",
  "x-android-cert": "ECA6BF91B8715A6F810ED0BBFC65B6CD578F52A8",
  "user-agent": "dalvik/2.1.0 (linux; u; android 15; 23127pn0oc build/bp1a.250505.005)"
};

const H2 = {
  "content-type": "application/json; charset=utf-8",
  "user-agent": "okhttp/3.12.1",
  "accept-encoding": "gzip"
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, why: "method not allowed" });
  }

  const { email, code: rawCode } = req.body || {};

  if (!email) {
    return res.status(400).json({ ok: false, why: "email kosong" });
  }

  const code = extractCode(rawCode);
  if (!code) {
    return res.status(200).json({ ok: false, why: "oobCode tidak ditemukan" });
  }

  // Step 1: emailLinkSignin
  let idToken, refreshToken, localId, isNew = false, userInfo = null;
  try {
    const r1 = await fetch(`${IDT_BASE}/emailLinkSignin?key=${API_KEY}`, {
      method: "POST",
      headers: spoofHeaders(H1),
      body: JSON.stringify({
        email,
        oobCode: code,
        clientType: "CLIENT_TYPE_ANDROID"
      })
    });
    const txt = await r1.text();
    if (!r1.ok) {
      return res.status(200).json({ ok: false, why: txt.slice(0, 300) });
    }
    const d = JSON.parse(txt);
    idToken = d.idToken;
    refreshToken = d.refreshToken;
    localId = d.localId;
    isNew = d.isNewUser || false;
    if (!idToken) {
      return res.status(200).json({ ok: false, why: "idToken tidak ditemukan" });
    }
  } catch (e) {
    return res.status(500).json({ ok: false, why: String(e) });
  }

  // Step 2: getAccountInfo
  try {
    const r2 = await fetch(`${IDT_BASE}/getAccountInfo?key=${API_KEY}`, {
      method: "POST",
      headers: spoofHeaders(H1),
      body: JSON.stringify({ idToken })
    });
    if (r2.ok) {
      const j = await r2.json();
      const users = j.users || [];
      if (users.length) userInfo = users[0];
    }
  } catch (e) {}

  // Step 3: verifyPurchase
  const orderId = "neo-" + Math.random().toString(16).slice(2, 14);
  const proPayload = {
    data: {
      productId: "am.full.sub.annual.19q4",
      token: "mmgaobamlahbbeccfplmbkbb.AO-J1OzqG0or_GJJIx-ms8GrTm-jaglCRfhQSRPUZKpl2YspYS-oN7_94uv8RC5vQbvd_Ios2pPDStZ2n7F0hLE3FiOU7HS3R6Fquulv5xLXFECSv4ctElW",
      skuType: "subs",
      orderId
    }
  };

  const proHeaders = spoofHeaders({
    ...H2,
    "authorization": `Bearer ${idToken}`,
    "firebase-instance-id-token": INSTANCE_ID
  });

  let premium = { ok: false, why: "tidak ada respon" };
  try {
    const r3 = await fetch(VFY_URL, {
      method: "POST",
      headers: proHeaders,
      body: JSON.stringify(proPayload)
    });
    const txt = await r3.text();
    try {
      premium = r3.ok ? JSON.parse(txt) : { ok: false, why: txt.slice(0, 300) };
    } catch (e) {
      premium = r3.ok ? { ok: true, raw: txt } : { ok: false, why: txt.slice(0, 300) };
    }
  } catch (e) {
    premium = { ok: false, why: String(e) };
  }

  return res.status(200).json({
    ok: true,
    email,
    uid: localId,
    new_user: isNew,
    user: userInfo,
    premium,
    orderId,
    id_token: idToken,
    refresh_token: refreshToken,
    saved_at: Date.now()
  });
}