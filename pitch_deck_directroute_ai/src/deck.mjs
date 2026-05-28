/** @jsxRuntime automatic */
/** @jsxImportSource @oai/artifact-tool/presentation-jsx */

const {
  Presentation,
  PresentationFile,
  row,
  column,
  grid,
  layers,
  panel,
  text,
  shape,
  rule,
  fill,
  hug,
  fixed,
  wrap,
  fr,
  auto,
} = await import("@oai/artifact-tool");

const SLIDE = { width: 1920, height: 1080 };

const palette = {
  bg: "#071A14",
  bg2: "#0B2B21",
  card: "#0B3A2B",
  card2: "#0D4634",
  text: "#ECFDF5",
  muted: "#B7E4D1",
  soft: "#86EFAC",
  accent: "#10B981",
  accent2: "#34D399",
  warn: "#F59E0B",
  ink: "#052019",
};

const baseFrame = { frame: { left: 0, top: 0, width: SLIDE.width, height: SLIDE.height }, baseUnit: 8 };

const titleStyle = { fontSize: 68, bold: true, color: palette.text, letterSpacing: -0.5 };
const subtitleStyle = { fontSize: 30, color: palette.muted, lineHeight: 1.25 };
const h2Style = { fontSize: 44, bold: true, color: palette.text, letterSpacing: -0.3 };
const bodyStyle = { fontSize: 26, color: palette.text, lineHeight: 1.25 };
const smallStyle = { fontSize: 18, color: palette.muted, lineHeight: 1.2 };

function slideBg() {
  return layers(
    { name: "bg", width: fill, height: fill },
    [
      shape({
        name: "bg-solid",
        width: fill,
        height: fill,
        fill: palette.bg,
      }),
      shape({
        name: "bg-glow-1",
        width: 980,
        height: 980,
        x: 1100,
        y: -280,
        fill: "rgba(16,185,129,0.22)",
        borderRadius: 9999,
      }),
      shape({
        name: "bg-glow-2",
        width: 860,
        height: 860,
        x: -240,
        y: 520,
        fill: "rgba(52,211,153,0.16)",
        borderRadius: 9999,
      }),
    ],
  );
}

function pill(label, tone = "accent") {
  const bg = tone === "warn" ? palette.warn : palette.accent;
  const fg = tone === "warn" ? "#1B1304" : palette.ink;
  return panel(
    {
      name: `pill-${label}`,
      padding: { x: 16, y: 10 },
      borderRadius: 999,
      fill: bg,
    },
    text(label, { width: hug, height: hug, style: { fontSize: 16, bold: true, color: fg } }),
  );
}

function bulletList(items) {
  return column(
    { name: "bullets", width: fill, height: hug, gap: 14 },
    items.map((v, idx) =>
      row(
        { name: `b-${idx}`, width: fill, height: hug, gap: 16, align: "start" },
        [
          shape({
            name: `dot-${idx}`,
            width: 10,
            height: 10,
            fill: palette.accent2,
            borderRadius: 99,
            y: 10,
          }),
          text(v, { name: `bt-${idx}`, width: fill, height: hug, style: bodyStyle }),
        ],
      ),
    ),
  );
}

function addTitleSlide(presentation) {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { name: "root", width: fill, height: fill },
      [
        slideBg(),
        grid(
          {
            name: "content",
            width: fill,
            height: fill,
            padding: { x: 96, y: 92 },
            columns: [fr(1.2), fr(0.8)],
            rows: [auto, fr(1), auto],
            columnGap: 48,
            rowGap: 28,
          },
          [
            column(
              { name: "title-stack", width: fill, height: hug, gap: 16, columnSpan: 2 },
              [
                pill("Agentic Supply Chain • UMKM", "accent"),
                text("DirectRoute AI", { name: "title", width: fill, height: hug, style: { ...titleStyle, fontSize: 78 } }),
                text(
                  "Marketplace UMKM yang membantu seller menentukan harga pasar, rute pengiriman, dan outreach secara otomatis.",
                  { name: "subtitle", width: wrap(1320), height: hug, style: subtitleStyle },
                ),
              ],
            ),
            panel(
              {
                name: "value-card",
                width: fill,
                height: fill,
                padding: { x: 34, y: 30 },
                borderRadius: 28,
                fill: palette.card,
              },
              column(
                { name: "value-stack", width: fill, height: fill, gap: 20 },
                [
                  text("3 nilai utama", { width: fill, height: hug, style: { fontSize: 24, bold: true, color: palette.soft } }),
                  bulletList([
                    "Harga rekomendasi berbasis referensi tepercaya (PIHPS BI / fallback).",
                    "Rute multi-drop → divisualisasikan jadi rute jalan asli (Google Maps).",
                    "Draft penawaran WhatsApp + tips packing untuk UMKM.",
                  ]),
                  rule({ width: fill, stroke: "rgba(255,255,255,0.12)", weight: 2 }),
                  text("Target demo: 2–5 menit", { width: fill, height: hug, style: smallStyle }),
                ],
              ),
            ),
            column(
              { name: "meta", width: fill, height: hug, gap: 10, columnSpan: 2 },
              [
                rule({ width: fixed(260), stroke: palette.accent2, weight: 5 }),
                text("Gendigital Academy Hackathon • 2026", { width: fill, height: hug, style: smallStyle }),
              ],
            ),
          ],
        ),
      ],
    ),
    baseFrame,
  );
}

function addProblemSlide(presentation) {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { name: "root", width: fill, height: fill },
      [
        slideBg(),
        grid(
          { name: "grid", width: fill, height: fill, padding: { x: 96, y: 88 }, columns: [fr(1), fr(1)], rows: [auto, fr(1)], columnGap: 40, rowGap: 26 },
          [
            column({ name: "header", width: fill, height: hug, gap: 10, columnSpan: 2 }, [
              pill("Masalah yang diangkat", "warn"),
              text("UMKM butuh keputusan cepat: harga, logistik, dan komunikasi", { width: fill, height: hug, style: h2Style }),
              text("Tanpa tooling, seller menghabiskan waktu untuk riset harga + mengatur pengiriman + menulis penawaran.", { width: wrap(1500), height: hug, style: subtitleStyle }),
            ]),
            panel(
              { name: "seller", width: fill, height: fill, padding: { x: 28, y: 26 }, borderRadius: 26, fill: palette.card2 },
              column({ name: "seller-stack", width: fill, height: fill, gap: 16 }, [
                text("Pain Seller", { width: fill, height: hug, style: { fontSize: 26, bold: true, color: palette.soft } }),
                bulletList([
                  "Harga sering “ngira-ngira” → risiko kalah saing / rugi.",
                  "Rute multi-drop tidak optimal → biaya & waktu membengkak.",
                  "Outreach tidak konsisten → peluang buyer hilang.",
                ]),
              ]),
            ),
            panel(
              { name: "buyer", width: fill, height: fill, padding: { x: 28, y: 26 }, borderRadius: 26, fill: "rgba(255,255,255,0.06)" },
              column({ name: "buyer-stack", width: fill, height: fill, gap: 16 }, [
                text("Pain Buyer & Admin", { width: fill, height: hug, style: { fontSize: 26, bold: true, color: palette.soft } }),
                bulletList([
                  "Buyer butuh flow belanja jelas: cart → checkout → status.",
                  "Admin butuh moderasi, dispute, verifikasi, audit, anomaly.",
                ]),
              ]),
            ),
          ],
        ),
      ],
    ),
    baseFrame,
  );
}

function addSolutionSlide(presentation) {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { name: "root", width: fill, height: fill },
      [
        slideBg(),
        grid(
          { name: "grid", width: fill, height: fill, padding: { x: 96, y: 88 }, columns: [fr(1.15), fr(0.85)], rows: [auto, fr(1)], columnGap: 44, rowGap: 26 },
          [
            column({ name: "header", width: fill, height: hug, gap: 12, columnSpan: 2 }, [
              pill("Solusi", "accent"),
              text("Satu platform: Marketplace + Agentic Workflow", { width: fill, height: hug, style: h2Style }),
              text("AI dipakai sebagai alat untuk menghasilkan keputusan & tindakan, bukan sekadar chat.", { width: wrap(1480), height: hug, style: subtitleStyle }),
            ]),
            panel(
              { name: "agent", width: fill, height: fill, padding: { x: 30, y: 26 }, borderRadius: 28, fill: palette.card2 },
              column({ name: "agent-stack", width: fill, height: fill, gap: 18 }, [
                text("Agentic Workflow (Seller)", { width: fill, height: hug, style: { fontSize: 30, bold: true, color: palette.soft } }),
                bulletList([
                  "Step 0: ambil referensi harga tepercaya (PIHPS BI / fallback).",
                  "Step 1: rekomendasi harga + rasional (strict JSON).",
                  "Step 2: susun urutan rute → peta rute jalan asli.",
                  "Step 3: draft WhatsApp + tips packing.",
                ]),
              ]),
            ),
            panel(
              { name: "modules", width: fill, height: fill, padding: { x: 30, y: 26 }, borderRadius: 28, fill: "rgba(255,255,255,0.06)" },
              column({ name: "modules-stack", width: fill, height: fill, gap: 16 }, [
                text("Modul Platform", { width: fill, height: hug, style: { fontSize: 30, bold: true, color: palette.soft } }),
                bulletList([
                  "Buyer: marketplace, cart, checkout, orders, chat.",
                  "Seller: inventory, orders, shipments, payments, analytics.",
                  "Admin: CMS, moderation, disputes, verification, audit, anomalies.",
                ]),
              ]),
            ),
          ],
        ),
      ],
    ),
    baseFrame,
  );
}

function addArchitectureSlide(presentation) {
  const slide = presentation.slides.add();

  const node = (label, tone = "card") =>
    panel(
      {
        name: `node-${label}`,
        width: fill,
        height: fill,
        padding: { x: 22, y: 18 },
        borderRadius: 22,
        fill: tone === "card" ? palette.card2 : "rgba(255,255,255,0.06)",
      },
      column({ width: fill, height: fill, gap: 10 }, [
        text(label, { width: fill, height: hug, style: { fontSize: 22, bold: true, color: palette.text } }),
      ]),
    );

  slide.compose(
    layers(
      { name: "root", width: fill, height: fill },
      [
        slideBg(),
        grid(
          { name: "grid", width: fill, height: fill, padding: { x: 96, y: 88 }, columns: [fr(1), fr(1), fr(1)], rows: [auto, fr(1)], columnGap: 26, rowGap: 26 },
          [
            column({ name: "header", width: fill, height: hug, gap: 10, columnSpan: 3 }, [
              pill("Arsitektur", "accent"),
              text("Frontend + Backend Proxy + Supabase + Integrasi Eksternal", { width: fill, height: hug, style: h2Style }),
              text("Proxy backend dipakai untuk keamanan API key dan konsistensi respons.", { width: wrap(1480), height: hug, style: subtitleStyle }),
            ]),
            // Row of nodes
            column({ name: "col1", width: fill, height: fill, gap: 18 }, [
              node("User (Browser)", "soft"),
              node("Frontend\nReact + TS + Vite + Tailwind", "card"),
            ]),
            column({ name: "col2", width: fill, height: fill, gap: 18 }, [
              node("Backend Proxy\nNode.js + Express", "card"),
              node("Supabase\nAuth + DB + Realtime + RLS", "soft"),
            ]),
            column({ name: "col3", width: fill, height: fill, gap: 18 }, [
              node("Ollama Local LLM\nqwen2.5-coder:1.5b", "card"),
              node("PIHPS BI + Serper + Google Maps", "soft"),
            ]),
          ],
        ),
        // Connectors (simple arrows)
        shape({
          name: "arrow-1",
          x: 590,
          y: 520,
          width: 740,
          height: 8,
          fill: "rgba(52,211,153,0.7)",
        }),
        shape({
          name: "arrow-2",
          x: 1230,
          y: 520,
          width: 40,
          height: 40,
          fill: "rgba(52,211,153,0.7)",
          rotation: 45,
        }),
        text("API calls (VITE_API_BASE_URL)", {
          name: "arrow-label",
          x: 620,
          y: 470,
          width: 700,
          height: hug,
          style: { ...smallStyle, color: palette.muted },
        }),
      ],
    ),
    baseFrame,
  );
}

function addTechSlide(presentation) {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { name: "root", width: fill, height: fill },
      [
        slideBg(),
        grid(
          { name: "grid", width: fill, height: fill, padding: { x: 96, y: 88 }, columns: [fr(1), fr(1)], rows: [auto, fr(1)], columnGap: 34, rowGap: 26 },
          [
            column({ name: "header", width: fill, height: hug, gap: 10, columnSpan: 2 }, [
              pill("Teknologi", "accent"),
              text("Stack & Komponen Kunci", { width: fill, height: hug, style: h2Style }),
              text("Fokus: responsif, aman (proxy), dan output AI terstruktur.", { width: wrap(1500), height: hug, style: subtitleStyle }),
            ]),
            panel(
              { name: "front", width: fill, height: fill, padding: { x: 28, y: 26 }, borderRadius: 26, fill: palette.card2 },
              column({ width: fill, height: fill, gap: 14 }, [
                text("Frontend", { width: fill, height: hug, style: { fontSize: 28, bold: true, color: palette.soft } }),
                bulletList([
                  "React + TypeScript + Vite",
                  "Tailwind CSS (responsive UI)",
                  "React Router (role-based routes)",
                  "Google Maps JS (Directions)",
                ]),
              ]),
            ),
            panel(
              { name: "back", width: fill, height: fill, padding: { x: 28, y: 26 }, borderRadius: 26, fill: "rgba(255,255,255,0.06)" },
              column({ width: fill, height: fill, gap: 14 }, [
                text("Backend & Data", { width: fill, height: hug, style: { fontSize: 28, bold: true, color: palette.soft } }),
                bulletList([
                  "Express proxy: /api/ai/chat, /api/search, /api/market/pihps",
                  "Supabase: Auth + DB + Realtime + RLS",
                  "Ollama local LLM (hemat biaya & privasi)",
                ]),
              ]),
            ),
          ],
        ),
      ],
    ),
    baseFrame,
  );
}

function addAPISlide(presentation) {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { name: "root", width: fill, height: fill },
      [
        slideBg(),
        grid(
          { name: "grid", width: fill, height: fill, padding: { x: 96, y: 88 }, columns: [fr(1.1), fr(0.9)], rows: [auto, fr(1)], columnGap: 40, rowGap: 26 },
          [
            column({ name: "header", width: fill, height: hug, gap: 10, columnSpan: 2 }, [
              pill("API", "accent"),
              text("Endpoint Utama (Backend Proxy)", { width: fill, height: hug, style: h2Style }),
              text("Backend menjaga kunci API tetap di server & menormalkan respons.", { width: wrap(1500), height: hug, style: subtitleStyle }),
            ]),
            panel(
              { name: "endpoints", width: fill, height: fill, padding: { x: 28, y: 26 }, borderRadius: 26, fill: palette.card2 },
              column({ width: fill, height: fill, gap: 14 }, [
                text("Core", { width: fill, height: hug, style: { fontSize: 28, bold: true, color: palette.soft } }),
                bulletList([
                  "GET /api/ping (health check)",
                  "POST /api/ai/chat (LLM: Ollama/OpenRouter)",
                  "GET /api/market/pihps?q=... (harga PIHPS BI)",
                ]),
                rule({ width: fill, stroke: "rgba(255,255,255,0.12)", weight: 2 }),
                text("Support", { width: fill, height: hug, style: { fontSize: 24, bold: true, color: palette.soft } }),
                bulletList([
                  "POST /api/search, /api/search/images (Serper)",
                  "GET /api/geocode?q=... (Google Geocode)",
                ]),
              ]),
            ),
            panel(
              { name: "notes", width: fill, height: fill, padding: { x: 28, y: 26 }, borderRadius: 26, fill: "rgba(255,255,255,0.06)" },
              column({ width: fill, height: fill, gap: 12 }, [
                text("Catatan Stabilitas", { width: fill, height: hug, style: { fontSize: 28, bold: true, color: palette.soft } }),
                bulletList([
                  "Strict JSON mode + JSON repair untuk output LLM.",
                  "Domain trust scoring untuk memilih sumber harga.",
                  "Fallback berlapis: PIHPS → Serper → LLM.",
                ]),
                text("Target: demo 2–5 menit tanpa crash/blank screen.", { width: fill, height: hug, style: smallStyle }),
              ]),
            ),
          ],
        ),
      ],
    ),
    baseFrame,
  );
}

function addDemoSlide(presentation) {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { name: "root", width: fill, height: fill },
      [
        slideBg(),
        grid(
          { name: "grid", width: fill, height: fill, padding: { x: 96, y: 88 }, columns: [fr(1), fr(1)], rows: [auto, fr(1)], columnGap: 34, rowGap: 26 },
          [
            column({ name: "header", width: fill, height: hug, gap: 10, columnSpan: 2 }, [
              pill("Demo", "accent"),
              text("Alur Demo (2–5 Menit)", { width: fill, height: hug, style: h2Style }),
              text("Tunjukkan seller → publish → buyer → admin.", { width: wrap(1500), height: hug, style: subtitleStyle }),
            ]),
            panel(
              { name: "script", width: fill, height: fill, padding: { x: 28, y: 26 }, borderRadius: 26, fill: palette.card2 },
              column({ width: fill, height: fill, gap: 14 }, [
                text("Script singkat", { width: fill, height: hug, style: { fontSize: 28, bold: true, color: palette.soft } }),
                bulletList([
                  "Seller: isi komoditas → klik ANALISIS → tunjukkan harga + rute + outreach.",
                  "Publish ke marketplace.",
                  "Buyer: lihat produk muncul → cart/checkout singkat.",
                  "Admin: buka /admin → tunjukkan tab + logout.",
                ]),
              ]),
            ),
            panel(
              { name: "deliverables", width: fill, height: fill, padding: { x: 28, y: 26 }, borderRadius: 26, fill: "rgba(255,255,255,0.06)" },
              column({ width: fill, height: fill, gap: 14 }, [
                text("Output submission", { width: fill, height: hug, style: { fontSize: 28, bold: true, color: palette.soft } }),
                bulletList([
                  "Source code + screenshot (arsitektur, UI, proof integration).",
                  "Pitching deck (PDF) + video demo 2–5 menit.",
                ]),
              ]),
            ),
          ],
        ),
      ],
    ),
    baseFrame,
  );
}

function addClosingSlide(presentation) {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { name: "root", width: fill, height: fill },
      [
        slideBg(),
        column(
          { name: "content", width: fill, height: fill, padding: { x: 120, y: 140 }, gap: 22, align: "center", justify: "center" },
          [
            pill("Terima kasih", "accent"),
            text("DirectRoute AI", { width: fill, height: hug, style: { ...titleStyle, textAlign: "center" } }),
            text("Agentic workflow untuk mempercepat keputusan UMKM: harga • rute • outreach.", {
              width: wrap(1400),
              height: hug,
              style: { ...subtitleStyle, textAlign: "center" },
            }),
            rule({ width: fixed(420), stroke: palette.accent2, weight: 5 }),
            text("Demo siap: Seller → Buyer → Admin", { width: fill, height: hug, style: { ...smallStyle, textAlign: "center" } }),
          ],
        ),
      ],
    ),
    baseFrame,
  );
}

const presentation = Presentation.create({ slideSize: SLIDE });

addTitleSlide(presentation);
addProblemSlide(presentation);
addSolutionSlide(presentation);
addArchitectureSlide(presentation);
addTechSlide(presentation);
addAPISlide(presentation);
addDemoSlide(presentation);
addClosingSlide(presentation);

const pptxBlob = await PresentationFile.exportPptx(presentation);
await pptxBlob.save("output/DirectRouteAI_PitchDeck.pptx");
