# Kulu Emlak Pazarı — Frontend (Supabase + Vite)

## Kurulum
1. Node 18+ kurulu olmalı.
2. Bağımlılıkları yükleyin:
   `ash
   npm ci
   `
3. .env dosyasını doldurun (rontend/.env):
   `ash
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_ADMIN_EMAIL=
   `

## Geliştirme
`ash
npm run dev
`

## Build
`ash
npm run build
`
Çıktı: rontend/dist

## Netlify Deploy
- Site Settings → Build & Deploy
  - Base directory: rontend
  - Build command: 
pm run build
  - Publish directory: rontend/dist
- Environment Variables (Site settings → Environment → Variables)
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
- SPA yönlendirme 
etlify.toml ile hazır.

## Notlar
- Admin/service role işlemleri için client yerine Netlify Functions kullanın ve SUPABASE_SERVICE_ROLE_KEY değerini sadece function ortam değişkeni olarak tutun.