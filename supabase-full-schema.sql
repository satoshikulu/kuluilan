-- ====================================================================
-- SUPABASE COMPLETE SCHEMA - SIMPLE & CLEAN VERSION
-- ====================================================================
-- Execute this file once in Supabase Dashboard > SQL Editor

-- ====================================================================
-- 1. CLEANUP EXISTING STRUCTURES
-- ====================================================================

-- Drop policies first
DROP POLICY IF EXISTS "Herkes onaylı ilanları görebilir" ON public.ilanlar;
DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını görebilir" ON public.ilanlar;
DROP POLICY IF EXISTS "Kullanıcılar ilan ekleyebilir" ON public.ilanlar;
DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını güncelleyebilir" ON public.ilanlar;
DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını silebilir" ON public.ilanlar;
DROP POLICY IF EXISTS "Admin tüm ilanları yönetebilir" ON public.ilanlar;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_ilanlar_updated_at ON public.ilanlar CASCADE;
DROP TRIGGER IF EXISTS update_kullanici_profilleri_updated_at ON public.kullanici_profilleri CASCADE;
DROP TRIGGER IF EXISTS update_sistem_ayarlari_updated_at ON public.sistem_ayarlari CASCADE;
DROP TRIGGER IF EXISTS generate_ilan_slug ON public.ilanlar CASCADE;
DROP TRIGGER IF EXISTS update_favori_statistics ON public.ilan_favorileri CASCADE;

-- Drop tables in correct order
DROP TABLE IF EXISTS public.admin_onay_gecmisi CASCADE;
DROP TABLE IF EXISTS public.ilan_goruntulenmeleri CASCADE;
DROP TABLE IF EXISTS public.ilan_favorileri CASCADE;
DROP TABLE IF EXISTS public.ilan_resimleri CASCADE;
DROP TABLE IF EXISTS public.sistem_ayarlari CASCADE;
DROP TABLE IF EXISTS public.kullanici_profilleri CASCADE;
DROP TABLE IF EXISTS public.ilanlar CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_ilan_statistics() CASCADE;
DROP FUNCTION IF EXISTS generate_slug() CASCADE;
DROP FUNCTION IF EXISTS create_admin_user(text, text) CASCADE;
DROP FUNCTION IF EXISTS approve_ilan(bigint, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS reject_ilan(bigint, uuid, text) CASCADE;

-- ====================================================================
-- 2. HELPER FUNCTIONS (Before tables)
-- ====================================================================

-- Auto update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.kullanici_profilleri (id, created_at)
    VALUES (NEW.id, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 3. MAIN TABLES
-- ====================================================================

-- Ana İlanlar Tablosu
CREATE TABLE public.ilanlar (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Temel İlan Bilgileri (JavaScript ile uyumlu)
    baslik TEXT NOT NULL,
    aciklama TEXT,
    fiyat INTEGER NOT NULL,
    telefon TEXT NOT NULL,
    mahalle TEXT,
    kategori TEXT NOT NULL,
    alt_kategori TEXT NOT NULL,
    konum TEXT,
    
    -- Özellikler (opsiyonel)
    metrekare INTEGER,
    oda_sayisi TEXT,
    isitma_tipi TEXT,
    bina_yasi INTEGER,
    kat TEXT,
    aidat INTEGER,
    depozito INTEGER,
    esya_durumu TEXT,
    imar_durumu TEXT,
    tapu_durumu TEXT,
    kaks DECIMAL(5,2),
    yaklasma_mesafesi INTEGER,
    yol_genisligi INTEGER,
    arsa_ozellikleri TEXT[],
    
    -- Admin ve Sistem
    onayli BOOLEAN DEFAULT FALSE,
    durum TEXT DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'yayınlandı', 'reddedildi', 'pasif')),
    admin_notu TEXT,
    onay_tarihi TIMESTAMP WITH TIME ZONE,
    onay_veren_admin UUID REFERENCES auth.users(id),
    
    -- İstatistikler
    goruntulenme_sayisi INTEGER DEFAULT 0,
    favori_sayisi INTEGER DEFAULT 0,
    
    -- Sistem
    slug TEXT,
    aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcı Profilleri
CREATE TABLE public.kullanici_profilleri (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ad_soyad TEXT,
    telefon TEXT,
    adres TEXT,
    sehir TEXT DEFAULT 'Konya',
    ilce TEXT DEFAULT 'Kulu',
    is_admin BOOLEAN DEFAULT FALSE,
    aktif BOOLEAN DEFAULT TRUE,
    toplam_ilan_sayisi INTEGER DEFAULT 0,
    aktif_ilan_sayisi INTEGER DEFAULT 0,
    profil_resmi_url TEXT,
    email_bildirimleri BOOLEAN DEFAULT TRUE,
    sms_bildirimleri BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- İlan Resimleri
CREATE TABLE public.ilan_resimleri (
    id BIGSERIAL PRIMARY KEY,
    ilan_id BIGINT REFERENCES public.ilanlar(id) ON DELETE CASCADE,
    resim_url TEXT NOT NULL,
    resim_adi TEXT,
    resim_boyutu INTEGER,
    resim_genisligi INTEGER,
    resim_yuksekligi INTEGER,
    sira_no INTEGER DEFAULT 1,
    ana_resim BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İlan Favorileri
CREATE TABLE public.ilan_favorileri (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ilan_id BIGINT REFERENCES public.ilanlar(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ilan_id)
);

-- İlan Görüntülenmeleri
CREATE TABLE public.ilan_goruntulenmeleri (
    id BIGSERIAL PRIMARY KEY,
    ilan_id BIGINT REFERENCES public.ilanlar(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_adresi INET,
    user_agent TEXT,
    referer TEXT,
    goruntulenme_suresi INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Onay Geçmişi
CREATE TABLE public.admin_onay_gecmisi (
    id BIGSERIAL PRIMARY KEY,
    ilan_id BIGINT REFERENCES public.ilanlar(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES auth.users(id),
    onay_durumu BOOLEAN NOT NULL,
    onay_notu TEXT,
    eski_durum TEXT,
    yeni_durum TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sistem Ayarları
CREATE TABLE public.sistem_ayarlari (
    id BIGSERIAL PRIMARY KEY,
    anahtar TEXT UNIQUE NOT NULL,
    deger TEXT,
    aciklama TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan sistem ayarları
INSERT INTO public.sistem_ayarlari (anahtar, deger, aciklama) VALUES 
('site_adı', 'Kulu Emlak', 'Site başlığı'),
('maksimum_resim_sayisi', '10', 'İlan başına maksimum resim sayısı'),
('maksimum_resim_boyutu', '5242880', 'Maksimum resim boyutu (5MB)'),
('otomatik_onay', 'false', 'İlanların otomatik onaylanması'),
('admin_email', 'satoshinakamototokyo42@gmail.com', 'Ana admin email adresi')
ON CONFLICT (anahtar) DO NOTHING;

-- ====================================================================
-- 4. İNDEKSLER (Performans için)
-- ====================================================================

-- İlanlar tablosu indeksleri
CREATE INDEX idx_ilanlar_user_id ON public.ilanlar(user_id);
CREATE INDEX idx_ilanlar_kategori ON public.ilanlar(kategori);
CREATE INDEX idx_ilanlar_alt_kategori ON public.ilanlar(alt_kategori);
CREATE INDEX idx_ilanlar_onayli ON public.ilanlar(onayli);
CREATE INDEX idx_ilanlar_durum ON public.ilanlar(durum);
CREATE INDEX idx_ilanlar_created_at ON public.ilanlar(created_at);
CREATE INDEX idx_ilanlar_mahalle ON public.ilanlar(mahalle);
CREATE INDEX idx_ilanlar_fiyat ON public.ilanlar(fiyat);
CREATE INDEX idx_ilanlar_aktif ON public.ilanlar(aktif);

-- Diğer tabloların indeksleri
CREATE INDEX idx_ilan_resimleri_ilan_id ON public.ilan_resimleri(ilan_id);
CREATE INDEX idx_ilan_favorileri_user_id ON public.ilan_favorileri(user_id);
CREATE INDEX idx_ilan_favorileri_ilan_id ON public.ilan_favorileri(ilan_id);
CREATE INDEX idx_ilan_goruntulenmeleri_ilan_id ON public.ilan_goruntulenmeleri(ilan_id);
CREATE INDEX idx_kullanici_profilleri_aktif ON public.kullanici_profilleri(aktif);
CREATE INDEX idx_kullanici_profilleri_is_admin ON public.kullanici_profilleri(is_admin);

-- ====================================================================
-- 5. TRİGGER'LAR (Tablolar oluştuktan sonra)
-- ====================================================================

-- Updated_at trigger'ları
CREATE TRIGGER update_ilanlar_updated_at 
    BEFORE UPDATE ON public.ilanlar 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kullanici_profilleri_updated_at 
    BEFORE UPDATE ON public.kullanici_profilleri 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sistem_ayarlari_updated_at 
    BEFORE UPDATE ON public.sistem_ayarlari 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Yeni kullanıcı profili oluşturma
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- İlan slug oluşturma
CREATE TRIGGER generate_ilan_slug
    BEFORE INSERT OR UPDATE ON public.ilanlar
    FOR EACH ROW EXECUTE FUNCTION generate_slug();

-- ====================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- RLS'yi etkinleştir
ALTER TABLE public.ilanlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilan_resimleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kullanici_profilleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilan_favorileri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilan_goruntulenmeleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_onay_gecmisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sistem_ayarlari ENABLE ROW LEVEL SECURITY;

-- İlanlar için RLS politikaları
CREATE POLICY "Herkes onaylı ilanları görebilir" ON public.ilanlar
    FOR SELECT USING (onayli = true AND aktif = true);

CREATE POLICY "Kullanıcılar kendi ilanlarını görebilir" ON public.ilanlar
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar ilan ekleyebilir" ON public.ilanlar
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi ilanlarını güncelleyebilir" ON public.ilanlar
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi ilanlarını silebilir" ON public.ilanlar
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admin tüm ilanları yönetebilir" ON public.ilanlar
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.kullanici_profilleri 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- İlan resimleri için RLS politikaları
CREATE POLICY "Herkes onaylı ilan resimlerini görebilir" ON public.ilan_resimleri
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ilanlar 
            WHERE id = ilan_id AND onayli = true AND aktif = true
        )
    );

CREATE POLICY "Kullanıcılar kendi ilan resimlerini yönetebilir" ON public.ilan_resimleri
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.ilanlar 
            WHERE id = ilan_id AND user_id = auth.uid()
        )
    );

-- Kullanıcı profilleri için RLS politikaları
CREATE POLICY "Kullanıcılar kendi profillerini görebilir" ON public.kullanici_profilleri
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir" ON public.kullanici_profilleri
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin tüm kullanıcı profillerini yönetebilir" ON public.kullanici_profilleri
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.kullanici_profilleri 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Favoriler için RLS politikaları
CREATE POLICY "Kullanıcılar kendi favorilerini yönetebilir" ON public.ilan_favorileri
    FOR ALL USING (auth.uid() = user_id);

-- Görüntülenmeler için RLS politikaları
CREATE POLICY "Herkes görüntülenme ekleyebilir" ON public.ilan_goruntulenmeleri
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Kullanıcılar kendi görüntülenmelerini görebilir" ON public.ilan_goruntulenmeleri
    FOR SELECT USING (auth.uid() = user_id);

-- Admin onay geçmişi için RLS politikaları
CREATE POLICY "Admin onay geçmişini yönetebilir" ON public.admin_onay_gecmisi
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.kullanici_profilleri 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Sistem ayarları için RLS politikaları
CREATE POLICY "Admin sistem ayarlarını yönetebilir" ON public.sistem_ayarlari
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.kullanici_profilleri 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ====================================================================
-- 7. STORAGE BUCKET VE POLİTİKALARI
-- ====================================================================

-- Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ilan-resimleri', 'ilan-resimleri', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS politikaları
CREATE POLICY "Herkes ilan resimlerini görebilir" ON storage.objects
    FOR SELECT USING (bucket_id = 'ilan-resimleri');

CREATE POLICY "Kullanıcılar ilan resmi yükleyebilir" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'ilan-resimleri' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Kullanıcılar kendi resimlerini silebilir" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'ilan-resimleri' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ====================================================================
-- 8. ADMIN MANAGEMENT FUNCTIONS
-- ====================================================================

-- Function to create admin user
CREATE OR REPLACE FUNCTION create_admin_user(email text, password text)
RETURNS text AS $$
DECLARE
    existing_user_id uuid;
BEGIN
    -- Check if user already exists
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE auth.users.email = create_admin_user.email;
    
    IF existing_user_id IS NOT NULL THEN
        -- User exists, make them admin
        UPDATE public.kullanici_profilleri 
        SET is_admin = true, aktif = true 
        WHERE id = existing_user_id;
        
        RETURN 'Existing user made admin: ' || existing_user_id::text;
    END IF;
    
    -- User doesn't exist
    RETURN 'User not found. Please register first, then make admin.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- SETUP COMPLETE!
-- ====================================================================
-- After running this SQL:
-- 1. Create admin user: Register normally first, then run:
--    SELECT create_admin_user('satoshinakamototokyo42@gmail.com', 'sevimbebe4242');
-- 2. Update supabase-config.js with your URL and KEY
-- 3. Test with admin login
-- ====================================================================