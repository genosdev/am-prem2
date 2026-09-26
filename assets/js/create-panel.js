import { requireAuth, doLogout } from "./auth.js";
import { sendMagicLink, verifyAndActivate } from "./am-api.js";
import { saveLog, getHistory } from "./firestore.js";
import {
  $,
  toast,
  setBtnLoading,
  esc,
  trunc,
  fmtTime,
  isValidEmail,
  updateUserUI
} from "./ui.js";

let currentUser = null;
let lastResult = null;
let step2Phase = "send"; // "send" | "activate"

export function initCreatePanel() {
  requireAuth((user) => {
    currentUser = user;
    updateUserUI(user.displayName || "user");

    bindEvents();
    loadHistory();
  });
}

function bindEvents() {
  window.doLogout = doLogout;

  window.validateEmail = function () {
    const v = $("targetEmail").value.trim();
    const s = $("status1");
    const step = $("stepCard1");
    if (isValidEmail(v)) {
      s.className = "status done";
      s.innerHTML = '<span class="dot"></span> EMAIL VALID';
      step.classList.add("done");
    } else {
      s.className = "status idle";
      s.innerHTML = '<span class="dot"></span> MENUNGGU INPUT';
      step.classList.remove("done");
    }
  };

  window.handleStep2 = async function () {
    if (step2Phase === "send") {
      await handleSendLink();
    } else {
      await handleActivate();
    }
  };

  window.loadHistory = loadHistory;
  window.copyJson = copyJson;
  window.openDetail = openDetail;
}

/* ============ STEP 2A: SEND LINK ============ */
async function handleSendLink() {
  const email = $("targetEmail").value.trim();
  if (!isValidEmail(email)) {
    toast("Masukkan email target yang valid dulu!", "err");
    return;
  }

  const btn = $("btnStep2");
  const s = $("status2");

  setBtnLoading(btn, true, "MENGIRIM...");
  s.className = "status proc";
  s.innerHTML = '<span class="dot"></span> MENGIRIM LINK...';

  try {
    const r = await sendMagicLink(email);

    setBtnLoading(btn, false);

    if (r.ok) {
      s.className = "status wait";
      s.innerHTML = '<span class="dot"></span> LINK TERKIRIM — MENUNGGU KODE';

      step2Phase = "activate";
      $("codeWrap").style.display = "block";
      $("step2Desc").textContent = "Link sudah dikirim ke " + email + ". Buka email target, copy link verifikasi / oobCode, lalu tempel di bawah dan klik tombol aktifkan.";

      btn.classList.remove("btn-primary");
      btn.classList.add("btn-success");
      btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        AKTIFKAN PREMIUM
      `;

      setTimeout(() => $("verifyCode").focus(), 100);

      toast("Link verifikasi berhasil dikirim!", "ok");
      saveLog(currentUser.uid, { action: "send_magic_link", email, status: "ok" });
    } else {
      s.className = "status err";
      s.innerHTML = '<span class="dot"></span> GAGAL MENGIRIM';
      toast("Gagal: " + (r.why || "unknown"), "err");
      saveLog(currentUser.uid, { action: "send_magic_link", email, status: "fail", error: r.why });
    }
  } catch (e) {
    setBtnLoading(btn, false);
    s.className = "status err";
    s.innerHTML = '<span class="dot"></span> ERROR';
    toast("Error: " + e.message, "err");
  }
}

/* ============ STEP 2B: ACTIVATE ============ */
async function handleActivate() {
  const email = $("targetEmail").value.trim();
  const code = $("verifyCode").value.trim();

  if (!code) {
    toast("Tempel link / oobCode dari email target dulu!", "err");
    $("verifyCode").focus();
    return;
  }

  const btn = $("btnStep2");
  const s2 = $("status2");
  const s3 = $("status3");

  setBtnLoading(btn, true, "MENGAKTIFKAN...");
  s2.className = "status proc";
  s2.innerHTML = '<span class="dot"></span> SCRAPING...';

  try {
    const r = await verifyAndActivate(email, code);

    setBtnLoading(btn, false);

    if (r.ok) {
      s2.className = "status done";
      s2.innerHTML = '<span class="dot"></span> BERHASIL DIAKTIFKAN';
      s3.className = "status done";
      s3.innerHTML = '<span class="dot"></span> PREMIUM AKTIF';
      $("stepCard3").classList.add("done");

      lastResult = r;
      renderResult(r);
      toast("Premium berhasil diaktifkan untuk " + email, "ok");

      saveLog(currentUser.uid, {
        action: "verify_activate",
        email,
        status: "ok",
        uid_target: r.uid,
        premium: r.premium,
        orderId: r.orderId,
        id_token: r.id_token,
        refresh_token: r.refresh_token,
        user_info: r.user || null,
        saved_at: r.saved_at
      });

      loadHistory();
    } else {
      s2.className = "status err";
      s2.innerHTML = '<span class="dot"></span> GAGAL: ' + esc((r.why || "").slice(0, 40).toUpperCase());
      toast("Gagal: " + (r.why || "unknown"), "err");
      saveLog(currentUser.uid, { action: "verify_activate", email, status: "fail", error: r.why });
    }
  } catch (e) {
    setBtnLoading(btn, false);
    s2.className = "status err";
    s2.innerHTML = '<span class="dot"></span> ERROR';
    toast("Error: " + e.message, "err");
  }
}

/* ============ RENDER RESULT ============ */
function renderResult(r) {
  const card = $("resultCard");
  const body = $("resultBody");

  const premiumOk = !!(r.premium && (
    r.premium.success === true ||
    r.premium.ok === true ||
    r.premium.status === "ok"
  ));
  const premiumBadge = premiumOk
    ? '<span class="badge ok">AKTIF</span>'
    : '<span class="badge bad">GAGAL</span>';

  const u = r.user || {};

  body.innerHTML = `
    <div class="r-grid">
      <div class="r-section">
        <h5>AKUN TARGET</h5>
        <div class="r-row"><span class="k">Email</span><span class="v">${esc(r.email || "-")}</span></div>
        <div class="r-row"><span class="k">UID</span><span class="v mono">${esc(trunc(r.uid, 24))}</span></div>
        <div class="r-row"><span class="k">New User</span><span class="v ${r.new_user ? "ok" : ""}">${r.new_user ? "YA" : "TIDAK"}</span></div>
        <div class="r-row"><span class="k">Verified</span><span class="v ${u.emailVerified ? "ok" : "bad"}">${u.emailVerified ? "YA" : "BELUM"}</span></div>
      </div>
      <div class="r-section">
        <h5>STATUS PREMIUM</h5>
        <div class="r-row"><span class="k">Status</span><span class="v">${premiumBadge}</span></div>
        <div class="r-row"><span class="k">Product</span><span class="v mono">${esc(r.premium?.productId || "am.full.sub.annual.19q4")}</span></div>
        <div class="r-row"><span class="k">SKU</span><span class="v">${esc(r.premium?.skuType || "subs")}</span></div>
        <div class="r-row"><span class="k">Order ID</span><span class="v mono">${esc(r.orderId || "-")}</span></div>
      </div>
      <div class="r-section">
        <h5>TOKEN</h5>
        <div class="r-row"><span class="k">ID Token</span><span class="v mono">${esc(trunc(r.id_token, 22))}</span></div>
        <div class="r-row"><span class="k">Refresh</span><span class="v mono">${esc(trunc(r.refresh_token, 22))}</span></div>
        <div class="r-row"><span class="k">Waktu</span><span class="v">${esc(fmtTime(r.saved_at))}</span></div>
      </div>
    </div>
    <div class="result-actions">
      <button class="btn btn-primary" onclick="copyJson()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        COPY JSON
      </button>
      <button class="btn" onclick="openDetail()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        LIHAT DETAIL
      </button>
    </div>
  `;

  card.classList.add("show");
}

function copyJson() {
  if (!lastResult) return;
  navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2))
    .then(() => toast("JSON dicopy ke clipboard!", "ok"))
    .catch(() => toast("Gagal copy JSON", "err"));
}

function openDetail() {
  if (!lastResult) return;
  $("detailJson").textContent = JSON.stringify(lastResult, null, 2);
  $("detailModal").classList.add("show");
}

/* ============ RIWAYAT ============ */
async function loadHistory() {
  const list = $("riwayatList");
  if (!list) return;

  if (!currentUser) {
    list.innerHTML = '<div class="empty-state">Login dulu untuk melihat riwayat.</div>';
    return;
  }

  list.innerHTML = '<div class="empty-state">Memuat riwayat...</div>';

  const items = await getHistory(currentUser.uid, 20);

  if (!items.length) {
    list.innerHTML = '<div class="empty-state">Belum ada riwayat generate.</div>';
    return;
  }

  list.innerHTML = items.map(it => {
    const ts = it.createdAt?.seconds ? it.createdAt.seconds * 1000 : (it.saved_at || 0);
    const ok = it.status === "ok";
    const badge = ok
      ? '<span class="badge ok">SUKSES</span>'
      : '<span class="badge bad">GAGAL</span>';
    return `
      <div class="riwayat-item">
        <div>
          <div class="r-email">${esc(it.email || "-")}</div>
          <div class="r-meta">${esc(it.action || "-")} &bull; ${esc(fmtTime(ts))}${it.orderId ? " &bull; " + esc(it.orderId) : ""}</div>
        </div>
        ${badge}
      </div>
    `;
  }).join("");
}