# 🌾 Juragan AI (DirectRoute AI)

> **3rd Place Winner at "CODE THE FUTURE: AI for a Better Indonesia" Hackathon 2026** 🏆
>
> *Organized by GenDigital Academy, Skystar Capital, and Hacktiv8*

**Juragan AI** adalah B2B AI-Marketplace inovatif yang dirancang untuk memutus rantai panjang tengkulak dan memberdayakan kemandirian finansial petani serta UMKM di Indonesia melalui distribusi logistik bertenaga AI.

---

## 🛑 Permasalahan (The Problem)
Di Indonesia, jutaan petani dan pelaku UMKM masih terjebak dalam rantai pasokan yang panjang. 
1. **Asimetri Harga:** Petani buta terhadap harga pasar asli dan terpaksa tunduk pada harga murah yang didikte tengkulak.
2. **Akses Pasar Tertutup:** Kesulitan mencari pembeli berskala besar (B2B) seperti restoran, hotel, atau katering.
3. **Logistik Mahal:** Biaya operasional pengiriman mandiri sangat mahal dan tidak efisien.

## 💡 Solusi (The Solution)
Juragan AI menyederhanakan proses distribusi dengan menghubungkan pembuat produk langsung dengan pembeli institusional didukung oleh **Sistem Multi-Agent AI**:

- 🤖 **Price Strategist (Ethical Pricing):** AI secara *real-time* menarik data komoditas publik dari **BPS** dan **PIHPS Bank Indonesia** untuk merekomendasikan harga wajar (*Fair Price*), mengamankan margin maksimal petani tanpa menipu pembeli.
- 💬 **Outreach Agent (Safe Communication):** Memanfaatkan NLP untuk menyusun draf pesan penawaran otomatis ke WhatsApp pembeli potensial (telah memiliki *security clearance* / aman dari spam).
- 🚚 **Logistics Orchestrator (Route Optimizer):** Memecahkan *Travelling Salesperson Problem* (TSP) melalui integrasi Google Maps untuk mengatur rute pengiriman *multi-drop* paling efisien dengan kapasitas beban optimal (max 500kg).

---

## 🛠️ Daftar Dependensi & Teknologi

Proyek ini dibangun menggunakan arsitektur modern berbasis microservices & serverless:

* **Frontend:** React 18, Vite, TypeScript, TailwindCSS (UI Glassmorphism), Mapbox-gl / react-map-gl, Lucide-react.
* **Backend:** Node.js, Express.js (AI Proxy, Scraping Cache, dan Serper API Handler).
* **Database & Auth:** Supabase (PostgreSQL, Row Level Security/RLS, Database Triggers).
* **AI & API Eksternal:**
  * **Google Maps API:** Untuk geocoding dan kalkulasi rute logistik (*distance matrix*).
  * **Serper API:** Untuk *market research* (BPS/PIHPS fallback).
  * **LLM API (OpenRouter / Ollama):** Untuk otak dari Agentic Workflow (Price Strategist & Outreach Agent).

---

## 🚀 Panduan Singkat Cara Menjalankan Aplikasi Secara Lokal

Proyek ini terbagi menjadi dua direktori utama: `/frontend` dan `/backend`. Keduanya harus dijalankan secara bersamaan.

### Prasyarat (Prerequisites)
Pastikan Anda sudah menginstal:
- Node.js (v18+)
- Akun Supabase (untuk Database & Auth)
- API Keys: Google Maps, Serper.dev, dan penyedia LLM (OpenRouter/OpenAI)

### 1. Setup Database (Supabase)
Migrasi SQL dan Triggers untuk project ini sudah otomatis tersedia.
1. Buat proyek baru di [Supabase](https://supabase.com/).
2. Buka fitur **SQL Editor** pada Supabase.
3. Jalankan file SQL di folder `backend/supabase/sql/` secara berurutan (dari `00_core_schema.sql` hingga `42_soft_delete_orders.sql`).

### 2. Menjalankan Backend (Express API)
```bash
cd backend
npm install

# Buat file .env dan isi dengan:
# PORT=3000
# SECRET_KEY=kunci_rahasia_jwt
# SERPER_API_KEY=kunci_api_serper
# GOOGLE_MAPS_API_KEY=kunci_api_gmaps
# OPENROUTER_API_KEY=kunci_api_openrouter

npm start
# (Atau jika di OS Windows bisa klik ./run-server.ps1)
```

### 3. Menjalankan Frontend (React/Vite)
Buka terminal baru:
```bash
cd frontend
npm install

# Buat file .env.local dan isi dengan:
# VITE_SUPABASE_URL=url_project_supabase_anda
# VITE_SUPABASE_ANON_KEY=anon_key_project_supabase_anda
# VITE_API_BASE_URL=http://localhost:3000

npm run dev
```
Aplikasi frontend akan berjalan di `http://localhost:5173`.

---

## 🌟 Cara Menjalankan Fitur Utama

Setelah aplikasi berjalan dan Anda sudah mendaftar/login sebagai **Seller (Petani/UMKM)**, ikuti langkah berikut untuk menguji *Agentic Workflow* dari Juragan AI:

1. **Masuk ke Seller Dashboard**
   Navigasikan ke menu **Dashboard Seller**. Di sini Anda akan melihat form untuk memasukkan penawaran produk baru.
2. **Setup Komoditas (Input Data Panen)**
   Isi nama komoditas (Contoh: "Cabai Merah"), pilih lokasi panen Anda, dan tentukan stok kuantitas dalam kilogram (misal: 150 kg).
3. **Trigger AI Workflow (Tombol "Gunakan AI")**
   Klik tombol pengoptimalan AI. Sistem secara otomatis akan menjalankan *pipeline* berikut tanpa campur tangan manual:
   * **Tahap 1 (Price Strategist):** AI menarik tren harga dari BPS/PIHPS di background dan memunculkan rekomendasi harga pasaran (*Fair Price*) di UI.
   * **Tahap 2 (Outreach Agent):** Setelah harga disetujui AI, sistem memunculkan "Dynamic Outreach AI" di bawah layar, berisi draf penawaran formal/kasual yang siap disalin atau dikirim langsung ke WhatsApp target B2B (misal restoran).
4. **Logistics Orchestrator (Bila ada orderan)**
   Saat pembeli melakukan pesanan (*checkout* via fitur Escrow/Keranjang di Buyer Dashboard), order akan masuk kembali ke Seller. Centang orderan tersebut dan klik **Cari Rute Optimal**. Peta Google Maps akan muncul untuk mengarahkan pengiriman *multi-drop* paling hemat bensin dengan muatan hingga 500kg.

---

## 📈 Impact & Vision
Sistem ini diproyeksikan mampu **meningkatkan margin keuntungan petani hingga +40%** dan **mengurangi biaya inefisiensi logistik sebesar 20%**. 

Masa depan logistik pangan bukan tentang membangun rute baru, tetapi menciptakan **rute langsung** (*Direct Route*) yang adil untuk semua. 

*Saatnya petani jadi Juragan di negerinya sendiri.* 🇮🇩