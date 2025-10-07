-- ====================================================================
-- SUPABASE SCHEMA - KULU İLAN SİSTEMİ
-- ====================================================================
-- Üye olmadan ilan verme + Admin onay sistemi
-- Temiz kurulum için tüm eski yapıları siler ve yeniden oluşturur

-- ====================================================================
-- 1. CLEANUP - Önce fonksiyonlar, sonra tablolar
-- ====================================================================

-- Fonksiyonları sil
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_slug() CASCADE;
DROP FUNCTION IF EXISTS create_admin_user(text) CASCADE;
DROP FUNCTION IF EXISTS approve_ilan(bigint, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS reject_ilan(bigint, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS approve_uye(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS reject_uye(uuid, uuid, text) CASCADE;

-- Tabloları sil (CASCADE otomatik trigger ve policy'leri de siler)
DROP TABLE IF EXISTS public.admin_onay_gecmisi CASCADE;
DROP TABLE IF EXISTS public.uyelik_basvurulari CASCADE;
DROP TABLE IF EXISTS public.ilan_goruntulenmeleri CASCADE;
DROP TABLE IF EXISTS public.ilan_favorileri CASCADE;
DROP TABLE IF EXISTS public.ilan_resimleri CASCADE;
DROP TABLE IF EXISTS public.sistem_ayarlari CASCADE;
DROP TABLE IF EXISTS public.kullanici_profilleri CASCADE;
DROP TABLE IF EXISTS public.ilanlar CASCADE;

-- ====================================================================
-- 2. HELPER FUNCTIONS
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
DECLARE
    extracted_phone TEXT;
BEGIN
    -- Email'den telefon numarasını çıkar ({telefon}@test.com formatında)
    extracted_phone := substring(NEW.email from '^(\d+)@');
    
    INSERT INTO public.kullanici_profilleri (
        id, 
        telefon,
        created_at, 
        onay_durumu, 
        aktif
    )
    VALUES (
        NEW.id, 
        COALESCE(extracted_phone, ''),
        NOW(), 
        'beklemede', 
        FALSE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate slug from title  
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.baslik IS NOT NULL AND (NEW.slug IS NULL OR NEW.slug = '') THEN
        NEW.slug := lower(
            regexp_replace(
                regexp_replace(NEW.baslik, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            )
        ) || '-' || extract(epoch from now())::bigint::text;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 3. MAIN TABLES
-- ====================================================================

-- Kullanıcı Profilleri (Önce bu oluşturulmalı)
CREATE TABLE public.kullanici_profilleri (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Temel Bilgiler
    ad TEXT NOT NULL DEFAULT '',
    soyad TEXT NOT NULL DEFAULT '',
    telefon TEXT NOT NULL DEFAULT '',
    
    -- Opsiyonel Bilgiler
    adres TEXT,
    sehir TEXT DEFAULT 'Konya',
    ilce TEXT DEFAULT 'Kulu',
    profil_resmi_url TEXT,
    
    -- Üyelik Durumu
    onay_durumu TEXT DEFAULT 'beklemede' CHECK (onay_durumu IN ('beklemede', 'onaylandi', 'reddedildi')),
    onay_tarihi TIMESTAMP WITH TIME ZONE,
    onay_veren_admin UUID REFERENCES auth.users(id),
    red_nedeni TEXT,
    
    -- Yetki ve Durum
    is_admin BOOLEAN DEFAULT FALSE,
    aktif BOOLEAN DEFAULT FALSE,
    
    -- İstatistikler
    toplam_ilan_sayisi INTEGER DEFAULT 0,
    aktif_ilan_sayisi INTEGER DEFAULT 0,
    
    -- Bildirimler
    email_bildirimleri BOOLEAN DEFAULT TRUE,
    sms_bildirimleri BOOLEAN DEFAULT FALSE,
    
    -- Sistem
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Ana İlanlar Tablosu
CREATE TABLE public.ilanlar (
    id BIGSERIAL PRIMARY KEY,
    
    -- Kullanıcı Bilgisi (NULL olabilir - üye olmadan ilan için)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Üye Olmayan Kullanıcı Bilgileri
    konuk_ad TEXT,
    konuk_soyad TEXT,
    konuk_telefon TEXT,
    konuk_email TEXT,
    
    -- Temel İlan Bilgileri
    baslik TEXT NOT NULL,
    aciklama TEXT,
    fiyat BIGINT NOT NULL CHECK (fiyat >= 0 AND fiyat <= 999999999999),
    telefon TEXT NOT NULL,
    mahalle TEXT NOT NULL,
    kategori TEXT NOT NULL,
    alt_kategori TEXT,
    konum TEXT,
    
    -- İlan Özellikleri (Opsiyonel)
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
    
    -- Admin ve Onay Sistemi
    onayli BOOLEAN DEFAULT FALSE,
    durum TEXT DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'yayinda', 'reddedildi', 'pasif', 'silinmis')),
    onay_tarihi TIMESTAMP WITH TIME ZONE,
    onay_veren_admin UUID REFERENCES auth.users(id),
    admin_notu TEXT,
    red_nedeni TEXT,
    
    -- İstatistikler
    goruntulenme_sayisi INTEGER DEFAULT 0,
    favori_sayisi INTEGER DEFAULT 0,
    
    -- Sistem
    slug TEXT,
    aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Either user_id OR guest info must be present
    CONSTRAINT user_or_guest_check CHECK (
        user_id IS NOT NULL OR 
        (konuk_ad IS NOT NULL AND konuk_telefon IS NOT NULL)
    )
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

-- Üyelik Başvuruları
CREATE TABLE public.uyelik_basvurulari (
    id BIGSERIAL PRIMARY KEY,
    ad TEXT NOT NULL,
    soyad TEXT NOT NULL,
    telefon TEXT NOT NULL,
    email TEXT,
    
    -- Durum
    durum TEXT DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'onaylandi', 'reddedildi')),
    onay_tarihi TIMESTAMP WITH TIME ZONE,
    onay_veren_admin UUID REFERENCES auth.users(id),
    red_nedeni TEXT,
    
    -- Oluşturulan kullanıcı
    olusturulan_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Onay Geçmişi
CREATE TABLE public.admin_onay_gecmisi (
    id BIGSERIAL PRIMARY KEY,
    
    -- Ne onaylandı
    kayit_tipi TEXT NOT NULL CHECK (kayit_tipi IN ('ilan', 'uyelik')),
    kayit_id BIGINT NOT NULL,
    
    -- Admin bilgisi
    admin_user_id UUID REFERENCES auth.users(id),
    
    -- Onay detayları
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

-- ====================================================================
-- 4. DEFAULT DATA
-- ====================================================================

-- Varsayılan sistem ayarları
INSERT INTO public.sistem_ayarlari (anahtar, deger, aciklama) VALUES 
('site_adi', 'Kulu Emlak Pazarı', 'Site başlığı'),
('maksimum_resim_sayisi', '5', 'İlan başına maksimum resim sayısı'),
('maksimum_resim_boyutu', '5242880', 'Maksimum resim boyutu (5MB)'),
('otomatik_ilan_onay', 'false', 'İlanların otomatik onaylanması'),
('otomatik_uyelik_onay', 'false', 'Üyeliklerin otomatik onaylanması'),
('konuk_ilan_izin', 'true', 'Üye olmadan ilan verebilme'),
('admin_email', 'satoshinakamototokyo42@gmail.com', 'Ana admin email adresi')
ON CONFLICT (anahtar) DO NOTHING;

-- ====================================================================
-- 5. INDEXES
-- ====================================================================

-- İlanlar
CREATE INDEX idx_ilanlar_user_id ON public.ilanlar(user_id);
CREATE INDEX idx_ilanlar_kategori ON public.ilanlar(kategori);
CREATE INDEX idx_ilanlar_onayli ON public.ilanlar(onayli);
CREATE INDEX idx_ilanlar_durum ON public.ilanlar(durum);
CREATE INDEX idx_ilanlar_created_at ON public.ilanlar(created_at DESC);
CREATE INDEX idx_ilanlar_mahalle ON public.ilanlar(mahalle);
CREATE INDEX idx_ilanlar_fiyat ON public.ilanlar(fiyat);

-- Kullanıcı profilleri
CREATE INDEX idx_kullanici_profilleri_onay_durumu ON public.kullanici_profilleri(onay_durumu);
CREATE INDEX idx_kullanici_profilleri_is_admin ON public.kullanici_profilleri(is_admin);
CREATE INDEX idx_kullanici_profilleri_aktif ON public.kullanici_profilleri(aktif);
CREATE INDEX idx_kullanici_profilleri_telefon ON public.kullanici_profilleri(telefon);

-- Diğer tablolar
CREATE INDEX idx_ilan_resimleri_ilan_id ON public.ilan_resimleri(ilan_id);
CREATE INDEX idx_ilan_favorileri_user_id ON public.ilan_favorileri(user_id);
CREATE INDEX idx_ilan_goruntulenmeleri_ilan_id ON public.ilan_goruntulenmeleri(ilan_id);
CREATE INDEX idx_uyelik_basvurulari_durum ON public.uyelik_basvurulari(durum);

-- ====================================================================
-- 6. TRIGGERS
-- ====================================================================

-- Updated_at triggers
CREATE TRIGGER update_ilanlar_updated_at 
    BEFORE UPDATE ON public.ilanlar 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kullanici_profilleri_updated_at 
    BEFORE UPDATE ON public.kullanici_profilleri 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sistem_ayarlari_updated_at 
    BEFORE UPDATE ON public.sistem_ayarlari 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uyelik_basvurulari_updated_at 
    BEFORE UPDATE ON public.uyelik_basvurulari 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Slug generation
CREATE TRIGGER generate_ilan_slug
    BEFORE INSERT OR UPDATE ON public.ilanlar
    FOR EACH ROW EXECUTE FUNCTION generate_slug();

-- User profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- RLS'yi etkinleştir
ALTER TABLE public.ilanlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilan_resimleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kullanici_profilleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilan_favorileri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilan_goruntulenmeleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_onay_gecmisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sistem_ayarlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uyelik_basvurulari ENABLE ROW LEVEL SECURITY;

-- İlanlar için RLS politikaları
CREATE POLICY "Herkes onaylı ilanları görebilir" ON public.ilanlar
    FOR SELECT USING (onayli = true AND durum = 'yayinda' AND aktif = true);

CREATE POLICY "Kullanıcılar kendi ilanlarını görebilir" ON public.ilanlar
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Herkes ilan ekleyebilir" ON public.ilanlar
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Kullanıcılar kendi ilanlarını güncelleyebilir" ON public.ilanlar
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi ilanlarını silebilir" ON public.ilanlar
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admin ilanları okuyabilir" ON public.ilanlar
    FOR SELECT USING (
        (SELECT is_admin FROM public.kullanici_profilleri WHERE id = auth.uid() LIMIT 1) = true
    );

CREATE POLICY "Admin ilanları güncelleyebilir" ON public.ilanlar
    FOR UPDATE USING (
        (SELECT is_admin FROM public.kullanici_profilleri WHERE id = auth.uid() LIMIT 1) = true
    );

CREATE POLICY "Admin ilanları silebilir" ON public.ilanlar
    FOR DELETE USING (
        (SELECT is_admin FROM public.kullanici_profilleri WHERE id = auth.uid() LIMIT 1) = true
    );

-- İlan resimleri için RLS
CREATE POLICY "Herkes onaylı ilan resimlerini görebilir" ON public.ilan_resimleri
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ilanlar 
            WHERE id = ilan_id AND onayli = true AND aktif = true
        )
    );

CREATE POLICY "Herkes resim yükleyebilir" ON public.ilan_resimleri
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin tüm resimleri yönetebilir" ON public.ilan_resimleri
    FOR ALL USING (
        (SELECT is_admin FROM public.kullanici_profilleri WHERE id = auth.uid() LIMIT 1) = true
    );

-- Kullanıcı profilleri için RLS
CREATE POLICY "Profilleri görüntüleme" ON public.kullanici_profilleri
    FOR SELECT USING (auth.uid() = id OR is_admin = true);

CREATE POLICY "Profilleri güncelleme" ON public.kullanici_profilleri
    FOR UPDATE USING (
        auth.uid() = id OR 
        (SELECT is_admin FROM public.kullanici_profilleri WHERE id = auth.uid() LIMIT 1) = true
    );

CREATE POLICY "Admin profil silebilir" ON public.kullanici_profilleri
    FOR DELETE USING (
        (SELECT is_admin FROM public.kullanici_profilleri WHERE id = auth.uid() LIMIT 1) = true
    );

-- Favoriler için RLS
CREATE POLICY "Kullanıcılar kendi favorilerini yönetebilir" ON public.ilan_favorileri
    FOR ALL USING (auth.uid() = user_id);

-- Görüntülenmeler için RLS
CREATE POLICY "Herkes görüntülenme ekleyebilir" ON public.ilan_goruntulenmeleri
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin görüntülenmeleri görebilir" ON public.ilan_goruntulenmeleri
    FOR SELECT USING (
        (SELECT is_admin FROM public.kullanici_profilleri WHERE id = auth.uid() LIMIT 1) = true
    );

-- Üyelik başvuruları için RLS
CREATE POLICY "Herkes üyelik başvurusu yapabilir" ON public.uyelik_basvurulari
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin üyelik başvurularını yönetebilir" ON public.uyelik_basvurulari
    FOR ALL USING (
        (SELECT is_admin FROM public.kullanici_profilleri WHERE id = auth.uid() LIMIT 1) = true
    );

-- Admin onay geçmişi için RLS
CREATE POLICY "Admin onay geçmişini yönetebilir" ON public.admin_onay_gecmisi
    FOR ALL USING (
        (SELECT is_admin FROM public.kullanici_profilleri WHERE id = auth.uid() LIMIT 1) = true
    );

-- Sistem ayarları için RLS
CREATE POLICY "Herkes sistem ayarlarını okuyabilir" ON public.sistem_ayarlari
    FOR SELECT USING (true);

CREATE POLICY "Admin sistem ayarlarını yönetebilir" ON public.sistem_ayarlari
    FOR ALL USING (
        (SELECT is_admin FROM public.kullanici_profilleri WHERE id = auth.uid() LIMIT 1) = true
    );

-- ====================================================================
-- 8. STORAGE BUCKET
-- ====================================================================

-- Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ilan-resimleri', 'ilan-resimleri', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS politikaları
CREATE POLICY "Herkes ilan resimlerini görebilir" ON storage.objects
    FOR SELECT USING (bucket_id = 'ilan-resimleri');

CREATE POLICY "Herkes ilan resmi yükleyebilir" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'ilan-resimleri');

CREATE POLICY "Admin tüm resimleri silebilir" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'ilan-resimleri' AND
        (SELECT is_admin FROM public.kullanici_profilleri WHERE id = auth.uid() LIMIT 1) = true
    );

-- ====================================================================
-- 9. ADMIN FUNCTIONS
-- ====================================================================

-- İlan onaylama fonksiyonu
CREATE OR REPLACE FUNCTION approve_ilan(
    p_ilan_id BIGINT,
    p_admin_id UUID,
    p_admin_notu TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_eski_durum TEXT;
BEGIN
    -- Eski durumu al
    SELECT durum INTO v_eski_durum FROM public.ilanlar WHERE id = p_ilan_id;
    
    -- İlanı onayla
    UPDATE public.ilanlar
    SET 
        onayli = true,
        durum = 'yayinda',
        onay_tarihi = NOW(),
        onay_veren_admin = p_admin_id,
        admin_notu = p_admin_notu,
        updated_at = NOW()
    WHERE id = p_ilan_id;
    
    -- Geçmişe kaydet
    INSERT INTO public.admin_onay_gecmisi (kayit_tipi, kayit_id, admin_user_id, onay_durumu, onay_notu, eski_durum, yeni_durum)
    VALUES ('ilan', p_ilan_id, p_admin_id, true, p_admin_notu, v_eski_durum, 'yayinda');
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- İlan reddetme fonksiyonu
CREATE OR REPLACE FUNCTION reject_ilan(
    p_ilan_id BIGINT,
    p_admin_id UUID,
    p_red_nedeni TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_eski_durum TEXT;
BEGIN
    -- Eski durumu al
    SELECT durum INTO v_eski_durum FROM public.ilanlar WHERE id = p_ilan_id;
    
    -- İlanı reddet
    UPDATE public.ilanlar
    SET 
        onayli = false,
        durum = 'reddedildi',
        onay_tarihi = NOW(),
        onay_veren_admin = p_admin_id,
        red_nedeni = p_red_nedeni,
        admin_notu = p_red_nedeni,
        updated_at = NOW()
    WHERE id = p_ilan_id;
    
    -- Geçmişe kaydet
    INSERT INTO public.admin_onay_gecmisi (kayit_tipi, kayit_id, admin_user_id, onay_durumu, onay_notu, eski_durum, yeni_durum)
    VALUES ('ilan', p_ilan_id, p_admin_id, false, p_red_nedeni, v_eski_durum, 'reddedildi');
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Üyelik onaylama fonksiyonu
CREATE OR REPLACE FUNCTION approve_uye(
    p_user_id UUID,
    p_admin_id UUID,
    p_admin_notu TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_eski_durum TEXT;
    v_user_id_bigint BIGINT;
BEGIN
    -- Eski durumu al
    SELECT onay_durumu INTO v_eski_durum FROM public.kullanici_profilleri WHERE id = p_user_id;
    
    -- UUID'yi bigint'e çevir (geçmişe kaydetmek için)
    v_user_id_bigint := ('x' || substring(p_user_id::text, 1, 15))::bit(60)::bigint;
    
    -- Üyeliği onayla
    UPDATE public.kullanici_profilleri
    SET 
        onay_durumu = 'onaylandi',
        onay_tarihi = NOW(),
        onay_veren_admin = p_admin_id,
        aktif = true,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Geçmişe kaydet
    INSERT INTO public.admin_onay_gecmisi (kayit_tipi, kayit_id, admin_user_id, onay_durumu, onay_notu, eski_durum, yeni_durum)
    VALUES ('uyelik', v_user_id_bigint, p_admin_id, true, p_admin_notu, v_eski_durum, 'onaylandi');
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Üyelik reddetme fonksiyonu
CREATE OR REPLACE FUNCTION reject_uye(
    p_user_id UUID,
    p_admin_id UUID,
    p_red_nedeni TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_eski_durum TEXT;
    v_user_id_bigint BIGINT;
BEGIN
    -- Eski durumu al
    SELECT onay_durumu INTO v_eski_durum FROM public.kullanici_profilleri WHERE id = p_user_id;
    
    -- UUID'yi bigint'e çevir
    v_user_id_bigint := ('x' || substring(p_user_id::text, 1, 15))::bit(60)::bigint;
    
    -- Üyeliği reddet
    UPDATE public.kullanici_profilleri
    SET 
        onay_durumu = 'reddedildi',
        onay_tarihi = NOW(),
        onay_veren_admin = p_admin_id,
        red_nedeni = p_red_nedeni,
        aktif = false,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Geçmişe kaydet
    INSERT INTO public.admin_onay_gecmisi (kayit_tipi, kayit_id, admin_user_id, onay_durumu, onay_notu, eski_durum, yeni_durum)
    VALUES ('uyelik', v_user_id_bigint, p_admin_id, false, p_red_nedeni, v_eski_durum, 'reddedildi');
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin kullanıcı oluşturma
CREATE OR REPLACE FUNCTION create_admin_user(p_email text)
RETURNS text AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Kullanıcıyı bul
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE auth.users.email = p_email;
    
    IF v_user_id IS NULL THEN
        RETURN 'Kullanıcı bulunamadı. Önce kayıt olun.';
    END IF;
    
    -- Admin yap
    UPDATE public.kullanici_profilleri 
    SET 
        is_admin = true, 
        aktif = true,
        onay_durumu = 'onaylandi'
    WHERE id = v_user_id;
    
    RETURN 'Admin yapıldı: ' || v_user_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- KURULUM TAMAMLANDI!
-- ====================================================================
-- Sonraki adımlar:
-- 1. giris-kayit.html'den kayıt olun
-- 2. auth.users tablosundan email'inizi bulun: SELECT id, email FROM auth.users;
-- 3. Admin yapın: UPDATE kullanici_profilleri SET is_admin=true, aktif=true, onay_durumu='onaylandi' WHERE id='USER_ID';
-- ====================================================================
