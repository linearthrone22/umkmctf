# Dokumentasi Teknis — DirectRoute AI (UMKM Supply Chain Marketplace)

Dokumen ini disiapkan untuk kebutuhan submission hackathon: menjelaskan **apa yang dibangun**, **fitur**, **arsitektur**, **tool/model**, **API**, dan **cara menjalankan**.

## 1) Ringkasan Produk

**DirectRoute AI** adalah aplikasi web marketplace UMKM (buyer–seller) dengan panel admin, yang membantu seller mengotomasi:

- **Riset harga pasar** (prioritas sumber tepercaya).
- **Rekomendasi harga jual** yang kompetitif & wajar.
- **Orkestrasi rute pengiriman** (multi-drop) + visual rute jalan asli (Google Maps).
- **Draft outreach WhatsApp** + tips pengemasan.

### Persona & Modul

- **Seller**
  - Dashboard agentic workflow (harga → rute → outreach).
  - Inventory, pesanan, pengiriman, pembayaran, chat, analytics, settings.
- **Buyer**
  - Browse marketplace, cart, checkout, orders, wishlist, chat, settings.
- **Admin**
  - `/admin`: CMS, moderasi listing, dispute center, verifikasi seller, audit logs, anomaly dashboard + logout.

## 2) Fitur AI yang Diimplementasikan

### (A) AI Price Discovery (Seller)

Pipeline harga:
1. Ambil referensi harga pasar dari sumber tepercaya.
2. LLM menyusun JSON output (harga rekomendasi, estimasi tengkulak, rasional, sumber).
3. Guardrails: strict JSON + auto-repair JSON + normalisasi angka.

Sumber referensi harga (prioritas):
- **PIHPS Nasional (Bank Indonesia)**: `https://www.bi.go.id/hargapangan` (komoditas strategis).
- Fallback: crawling via Serper (BPS/BI/Bapanas/Kemendag/portal lain) bila PIHPS tidak tersedia.

### (B) Real-Route Orchestrator (Seller)

- LLM mengusulkan urutan rute (sequence).
- Frontend memanggil **Google Maps Directions API** untuk menggambar rute jalan asli + menghitung jarak & durasi.

### (C) Dynamic Outreach AI (Seller)

- LLM membuat draft pesan WA (formal + casual) + tips packing.
- Output distandarkan JSON agar UI stabil.

## 3) Tool List (Tools/Models/Platforms)

### AI / LLM
- **Ollama Local LLM** (default): `ollama:qwen2.5-coder:1.5b`
  - dipanggil via backend proxy `/api/ai/chat`
- (Opsional) **OpenRouter** (bisa dimatikan)

### Data & Backend Services
- **Supabase**: Auth, database, realtime chat, RLS/policies, admin ops.

### Market Data / Search
- **PIHPS (Bank Indonesia)**: dipanggil via backend endpoint `/api/market/pihps`
- **Serper API**: search & images (proxy backend)

### Maps
- **Google Maps API**: Geocoding (backend proxy) + Directions (frontend)

### Web Stack
- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Node.js + Express

## 4) Arsitektur Sistem

### Diagram (Mermaid)

```mermaid
flowchart LR
  U[User] -->|Browser| FE[Frontend (React/Vite)]

  FE -->|Auth + DB + Realtime| SB[(Supabase)]

  FE -->|API calls| BE[Backend (Express)]

  BE -->|LLM Proxy /api/ai/chat| OL[Ollama (Local)]
  BE -->|Optional| OR[OpenRouter]

  BE -->|Serper Proxy /api/search| SER[Serper Search/Images]
  BE -->|Harga referensi /api/market/pihps| PIHPS[PIHPS BI]
  BE -->|Geocode /api/geocode| GM[Google Geocoding API]

  FE -->|Directions| GMD[Google Maps JS Directions]
```

### Inti Keputusan Arsitektur
- **Proxy di backend** untuk mencegah API key bocor ke frontend.
- LLM output distandarkan JSON untuk **stabilitas UI**.
- Menggunakan sumber harga tepercaya (PIHPS/BI) agar harga tidak “ngaco”.

## 5) Daftar Endpoint Backend

Base URL default: `http://localhost:5001`

- `GET /api/ping` — health check
- `POST /api/ai/chat` — proxy LLM (Ollama/OpenRouter)
- `POST /api/search` — proxy Serper search
- `POST /api/search/images` — proxy Serper images
- `GET /api/market/pihps?q=<komoditas>&days=<n>` — harga PIHPS BI (jika komoditas tersedia)
- `GET /api/geocode?q=<query>` — geocode (Google)

Catatan: aplikasi juga memakai Supabase langsung dari frontend untuk data utama (items/orders/chat/profiles).

## 6) Konfigurasi ENV

### Backend (`backend/.env`)
- `PORT=5001`
- `DISABLE_OPENROUTER=1` (mode Ollama-only)
- `OLLAMA_BASE_URL=http://127.0.0.1:11434`
- `SERPER_API_KEY=` (opsional untuk mode proxy Serper)
- `GOOGLE_MAPS_API_KEY=` (opsional untuk endpoint geocode backend)

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL=http://localhost:5001`
- `VITE_LLM_MODEL=ollama:qwen2.5-coder:1.5b`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`
- `VITE_GOOGLE_MAPS_API_KEY=...`

## 7) Cara Menjalankan (Local)

1) Jalankan Ollama
```powershell
ollama serve
```

2) Jalankan backend
```powershell
cd backend
.\run-server.ps1
```

3) Jalankan frontend
```powershell
cd frontend
npm install
npm run dev
```

## 8) Bukti Integrasi (Proof of Integration)

### (A) Tes PIHPS (BI)
```powershell
irm "http://localhost:5001/api/market/pihps?q=Cabai%20Merah%20Besar&days=10"
```

### (B) Tes LLM (Ollama via backend)
```powershell
irm -Method Post "http://localhost:5001/api/ai/chat" -ContentType "application/json" -Body (@{
  model = "ollama:qwen2.5-coder:1.5b"
  messages = @(@{ role="user"; content="Balas hanya JSON: {\"ok\": true}" })
  format = "json"
} | ConvertTo-Json -Depth 6)
```

## 9) Checklist Screenshot untuk Submission

- Halaman seller: output **AI Price Discovery** + sumber link
- Halaman seller: **Real-Route Orchestrator** (rute terlihat)
- Halaman seller: **Dynamic Outreach AI** (draft WA)
- Halaman buyer: produk hasil publish muncul di marketplace
- Halaman admin: tampilan tab + tombol logout
- Console/log: bukti endpoint `/api/market/pihps` berhasil

