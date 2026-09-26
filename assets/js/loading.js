import { $ } from "./ui.js";

export function runLoadingScreen(onDone) {
  const screen = $("loadingScreen");
  if (!screen) { onDone && onDone(); return; }

  const bar = $("loadBar");
  const pct = $("loadPct");
  const steps = [14, 30, 48, 66, 82, 94, 100];
  let i = 0;

  const intv = setInterval(() => {
    if (bar) bar.style.width = steps[i] + "%";
    if (pct) pct.textContent = steps[i] + "%";
    i++;
    if (i >= steps.length) {
      clearInterval(intv);
      setTimeout(() => {
        screen.classList.add("hide");
        onDone && onDone();
      }, 400);
    }
  }, 380);
}