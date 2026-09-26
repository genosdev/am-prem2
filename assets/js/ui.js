export const $ = (id) => document.getElementById(id);

export function toast(msg, type = "info") {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast" + (type === "err" ? " err" : type === "ok" ? " ok" : "");
  el.classList.add("show");
  clearTimeout(el._tm);
  el._tm = setTimeout(() => el.classList.remove("show"), 2600);
}

export function showAlert(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 5000);
}

export function setBtnLoading(btn, loading, txt = "MEMPROSES...") {
  if (!btn) return;
  if (loading) {
    btn._orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spin"></span> ${txt}`;
  } else {
    btn.disabled = false;
    if (btn._orig) btn.innerHTML = btn._orig;
  }
}

export const esc = (s) => s == null ? "" : String(s)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

export const trunc = (s, n = 20) => {
  if (!s) return "-";
  s = String(s);
  return s.length <= n ? s : s.slice(0, n) + "..." + s.slice(-6);
};

export const fmtTime = (ts) => {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const usernameToEmail = (u) =>
  u.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "") + "@genos-am.local";

export function updateUserUI(name) {
  const label = $("userLabel");
  const avatar = $("userAvatar");
  if (label) label.textContent = name;
  if (avatar) avatar.textContent = (name || "G").charAt(0).toUpperCase();
}