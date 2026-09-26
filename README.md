# GENERATOR AM PREMIUM GENOS

Web generator premium dengan Firebase Auth + Firestore + Netlify Function proxy.

## Struktur
- `index.html` — landing + popup WA
- `login.html` / `register.html` — auth
- `create.html` — panel generator
- `assets/` — css & js modular
- `netlify/functions/` — proxy ke Google API (hindari CORS)

## Cara Deploy ke Netlify

### Opsi A — Drag & Drop (paling cepat)
1. Buka https://app.netlify.com/drop
2. Drag folder `generator-am-premium-genos/` ke halaman itu
3. **CATATAN**: Opsi ini TIDAK build Netlify Functions. Kalau mau function jalan, pakai Opsi B.

### Opsi B — Deploy via Netlify CLI (rekomendasi, support Functions)
```bash
npm i -g netlify-cli
cd generator-am-premium-genos
netlify login
netlify init
netlify deploy --prod