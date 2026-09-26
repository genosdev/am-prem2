const SECURE_TOKEN_URL = "https://securetoken.googleapis.com/v1/token";
const API_KEY = process.env.AM_API_KEY || "AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, why: "method not allowed" });
  }

  const { refresh_token } = req.body || {};

  if (!refresh_token) {
    return res.status(400).json({ ok: false, why: "refresh_token kosong" });
  }

  try {
    const r = await fetch(`${SECURE_TOKEN_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ grant_type: "refresh_token", refresh_token })
    });
    const txt = await r.text();
    if (!r.ok) {
      return res.status(200).json({ ok: false, why: txt.slice(0, 300) });
    }
    const d = JSON.parse(txt);
    return res.status(200).json({
      ok: true,
      id_token: d.id_token,
      refresh_token: d.refresh_token
    });
  } catch (e) {
    return res.status(500).json({ ok: false, why: String(e) });
  }
}