-- RLS politikalarını geçici olarak devre dışı bırakma
-- Bu işlem sadece test amaçlıdır ve üretim ortamında kullanılmamalıdır

-- İlanlar tablosu için RLS'yi devre dışı bırak
ALTER TABLE public.ilanlar DISABLE ROW LEVEL SECURITY;

-- İlan resimleri tablosu için RLS'yi devre dışı bırak
ALTER TABLE public.ilan_resimleri DISABLE ROW LEVEL SECURITY;

-- Kullanıcı profilleri tablosu için RLS'yi devre dışı bırak
ALTER TABLE public.kullanici_profilleri DISABLE ROW LEVEL SECURITY;

-- İlan favorileri tablosu için RLS'yi devre dışı bırak
ALTER TABLE public.ilan_favorileri DISABLE ROW LEVEL SECURITY;

-- İlan görüntülenmeleri tablosu için RLS'yi devre dışı bırak
ALTER TABLE public.ilan_goruntulenmeleri DISABLE ROW LEVEL SECURITY;

-- Admin onay geçmişi tablosu için RLS'yi devre dışı bırak
ALTER TABLE public.admin_onay_gecmisi DISABLE ROW LEVEL SECURITY;

-- Sistem ayarları tablosu için RLS'yi devre dışı bırak
ALTER TABLE public.sistem_ayarlari DISABLE ROW LEVEL SECURITY;

-- Üyelik başvuruları tablosu için RLS'yi devre dışı bırak
ALTER TABLE public.uyelik_basvurulari DISABLE ROW LEVEL SECURITY;

-- Storage RLS politikalarını devre dışı bırakmak için özel işlem gerekir
-- Bu işlem Supabase Dashboard üzerinden yapılmalıdır