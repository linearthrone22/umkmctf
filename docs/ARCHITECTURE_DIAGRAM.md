# Diagram Arsitektur — DirectRoute AI

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

