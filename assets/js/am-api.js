async function postJson(path, body) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    return { ok: false, why: `HTTP ${r.status}: ${t.slice(0, 200)}` };
  }
  return await r.json();
}

export async function sendMagicLink(email) {
  return postJson("/api/send-magic-link", { email });
}

export async function verifyAndActivate(email, code) {
  return postJson("/api/verify-activate", { email, code });
}

export async function refreshToken(refresh_token) {
  return postJson("/api/refresh-token", { refresh_token });
}