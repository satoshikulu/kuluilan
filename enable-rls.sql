-- RLS politikalarını tekrar etkinleştirme
-- Bu işlem test sonrasında yapılmalıdır

-- İlanlar tablosu için RLS'yi etkinleştir
ALTER TABLE public.ilanlar ENABLE ROW LEVEL SECURITY;

-- İlan resimleri tablosu için RLS'yi etkinleştir
ALTER TABLE public.ilan_resimleri ENABLE ROW LEVEL SECURITY;

-- Kullanıcı profilleri tablosu için RLS'yi etkinleştir
ALTER TABLE public.kullanici_profilleri ENABLE ROW LEVEL SECURITY;

-- İlan favorileri tablosu için RLS'yi etkinleştir
ALTER TABLE public.ilan_favorileri ENABLE ROW LEVEL SECURITY;

-- İlan görüntülenmeleri tablosu için RLS'yi etkinleştir
ALTER TABLE public.ilan_goruntulenmeleri ENABLE ROW LEVEL SECURITY;

-- Admin onay geçmişi tablosu için RLS'yi etkinleştir
ALTER TABLE public.admin_onay_gecmisi ENABLE ROW LEVEL SECURITY;

-- Sistem ayarları tablosu için RLS'yi etkinleştir
ALTER TABLE public.sistem_ayarlari ENABLE ROW LEVEL SECURITY;

-- Üyelik başvuruları tablosu için RLS'yi etkinleştir
ALTER TABLE public.uyelik_basvurulari ENABLE ROW LEVEL SECURITY;