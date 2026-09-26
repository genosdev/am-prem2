import {
  auth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { saveUserProfile } from "./firestore.js";
import {
  $,
  showAlert,
  setBtnLoading,
  toast,
  usernameToEmail,
  updateUserUI
} from "./ui.js";

export async function doRegister() {
  const u = $("regUser").value.trim();
  const p = $("regPass").value;
  const p2 = $("regPass2").value;
  const rem = $("regRemember").checked;
  const al = $("regAlert");
  const btn = $("btnDoRegister");

  al.classList.remove("show");

  if (u.length < 4) return showAlert(al, "Username minimal 4 karakter.");
  if (!/^[a-zA-Z0-9_.-]+$/.test(u)) return showAlert(al, "Username hanya boleh huruf, angka, titik, strip, dan underscore.");
  if (p.length < 6) return showAlert(al, "Password minimal 6 karakter.");
  if (p !== p2) return showAlert(al, "Verifikasi password tidak cocok.");

  setBtnLoading(btn, true, "MENDAFTAR...");

  try {
    await setPersistence(auth, rem ? browserLocalPersistence : browserSessionPersistence);
    const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(u), p);
    await updateProfile(cred.user, { displayName: u });
    await saveUserProfile(cred.user.uid, {
      username: u,
      email: usernameToEmail(u),
      createdAt: new Date().toISOString()
    });
    toast("Registrasi berhasil.", "ok");
    updateUserUI(u);
    setTimeout(() => {
      window.location.href = "create.html";
    }, 500);
  } catch (e) {
    showAlert(al, mapAuthError(e.code) || e.message);
  } finally {
    setBtnLoading(btn, false);
  }
}

export async function doLogin() {
  const u = $("loginUser").value.trim();
  const p = $("loginPass").value;
  const rem = $("loginRemember").checked;
  const al = $("loginAlert");
  const btn = $("btnDoLogin");

  al.classList.remove("show");

  if (!u || !p) return showAlert(al, "Username dan password wajib diisi.");

  setBtnLoading(btn, true, "MASUK...");

  try {
    await setPersistence(auth, rem ? browserLocalPersistence : browserSessionPersistence);
    const cred = await signInWithEmailAndPassword(auth, usernameToEmail(u), p);
    toast("Login berhasil. Selamat datang " + (cred.user.displayName || u), "ok");
    updateUserUI(cred.user.displayName || u);
    setTimeout(() => {
      window.location.href = "create.html";
    }, 500);
  } catch (e) {
    showAlert(al, mapAuthError(e.code) || e.message);
  } finally {
    setBtnLoading(btn, false);
  }
}

export async function doLogout() {
  try { await signOut(auth); } catch (e) {}
  toast("Berhasil keluar.", "ok");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 400);
}

export function requireAuth(cb) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    cb(user);
  });
}

export function redirectIfLoggedIn(target = "create.html") {
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = target;
  });
}

function mapAuthError(code) {
  const m = {
    "auth/email-already-in-use": "Username sudah terdaftar, gunakan yang lain.",
    "auth/invalid-email": "Username tidak valid.",
    "auth/weak-password": "Password terlalu lemah (minimal 6 karakter).",
    "auth/user-not-found": "Username belum terdaftar.",
    "auth/wrong-password": "Password salah.",
    "auth/invalid-credential": "Username atau password salah.",
    "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi nanti.",
    "auth/network-request-failed": "Koneksi gagal. Periksa internet Anda."
  };
  return m[code] || null;
}