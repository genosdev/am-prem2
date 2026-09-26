import { $, toast } from "./ui.js";

const WA_CHANNEL_URL = "https://whatsapp.com/channel/0029VbDGXt2KwqSUTTtDjP3w";
const GATE_KEY = "genos_wa";

export function initWaGate() {
  const popup = $("waPopup");
  if (!popup) return;

  if (sessionStorage.getItem(GATE_KEY) === "1") {
    popup.classList.remove("show");
    return;
  }

  setTimeout(() => popup.classList.add("show"), 500);

  window.verifyWa = function () {
    if (!$("waConfirm")?.checked) {
      toast("Centang dulu konfirmasi join channel!", "err");
      return;
    }
    sessionStorage.setItem(GATE_KEY, "1");
    popup.classList.remove("show");
    toast("Verifikasi berhasil. Selamat datang!", "ok");
  };
}