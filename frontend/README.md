# React + TypeScript + Vite

## Secure AI proxy (recommended)

Untuk menghindari API key OpenRouter/Serper terekspos di frontend, jalankan backend proxy:

- Copy `backend/.env.example` → `backend/.env` lalu isi `OPENROUTER_API_KEY` dan `SERPER_API_KEY`
- Jalankan backend: `cd backend && node server.js`
- Set `VITE_API_BASE_URL=http://localhost:5001` di `frontend/.env`

Kalau `VITE_API_BASE_URL` tidak diset, frontend akan fallback memakai `VITE_OPENROUTER_API_KEY` dan `VITE_SERPER_API_KEY` (mode dev, tidak aman).

### Hybrid: OpenRouter + Ollama (local)

Backend mendukung model prefix `ollama:` untuk menjalankan LLM lokal via Ollama (contoh: `ollama:qwen2.5-coder:1.5b`).

- Jalankan Ollama: `ollama serve`
- (Opsional) set `OLLAMA_BASE_URL=http://127.0.0.1:11434` di `backend/.env`
- Pastikan frontend pakai backend proxy (`VITE_API_BASE_URL` diset)
- (Opsional) set model default: `VITE_LLM_MODEL=ollama:qwen2.5-coder:1.5b`
- (Ollama-only) set `DISABLE_OPENROUTER=1` di `backend/.env` supaya server menolak request ke OpenRouter

## Trust & Safety (MVP)

- Dispute center (buyer komplain → seller respon → admin keputusan)
  - UI: buyer/seller di tab Orders (modal detail), admin di `/admin` → tab `Disputes`
  - SQL: `backend/supabase/sql/33_disputes.sql`
- Verifikasi seller (dokumen/KYC ringan) + badge
  - UI: seller di Dashboard → Settings → `SellerVerificationCard`, admin di `/admin` → tab `Verification`
  - SQL: `backend/supabase/sql/34_seller_verification.sql`
- Anti-spam chat + rate limit per user
  - UI: chat buyer/seller (realtime), error rate-limit muncul dari Supabase bila limit kena
  - SQL: `backend/supabase/sql/35_chat_anti_spam.sql`
- Audit log perubahan penting (harga/stok/status order)
  - UI: admin di `/admin` → tab `Audit Logs`
  - SQL: `backend/supabase/sql/30_admin_audit.sql` + `backend/supabase/sql/36_audit_logs_triggers.sql`

## Admin / Operasional (MVP)

- CMS kategori/komoditas + banner promo homepage
  - UI: `/admin` → tab `CMS` (kategori & promo banners), homepage baca banners via `PromoBannersStrip`
  - SQL: `backend/supabase/sql/37_admin_cms.sql`
- Moderasi listing (approve/reject) + reason template
  - UI: `/admin` → tab `Moderation`
  - SQL: `backend/supabase/sql/38_listing_moderation.sql`
- Dashboard “anomaly” (stok negatif, order gagal, seller inactive)
  - UI: `/admin` → tab `Anomalies`
  - SQL: `backend/supabase/sql/39_admin_anomalies.sql`

Catatan akses admin:
- Pastikan `profiles.role = 'admin'` untuk akun kamu supaya bisa akses route `/admin`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
