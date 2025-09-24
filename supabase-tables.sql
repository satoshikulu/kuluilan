-- Supabase SQL Tabloları
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. İlanlar tablosu (ana tablo)
CREATE TABLE public.ilanlar (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    baslik TEXT NOT NULL,
    aciklama TEXT,
    fiyat INTEGER NOT NULL,
    telefon TEXT NOT NULL,
    mahalle TEXT,
    kategori TEXT NOT NULL, -- 'satilik' veya 'kiralik'
    alt_kategori TEXT NOT NULL, -- 'ev', 'arsa', 'isyeri', 'tarla'
    konum TEXT,
    
    -- Ev/İşyeri özellikleri
    metrekare INTEGER,
    oda_sayisi TEXT,
    isitma_tipi TEXT,
    bina_yasi INTEGER,
    kat TEXT,
    aidat INTEGER,
    depozito INTEGER,
    esya_durumu TEXT,
    
    -- Arsa/Tarla özellikleri
    imar_durumu TEXT,
    tapu_durumu TEXT,
    kaks DECIMAL(3,2),
    yaklasma_mesafesi INTEGER,
    yol_genisligi INTEGER,
    arsa_ozellikleri TEXT[], -- Array olarak saklayacağız
    
    -- Sistem alanları
    onayli BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. İlan resimleri tablosu
CREATE TABLE public.ilan_resimleri (
    id BIGSERIAL PRIMARY KEY,
    ilan_id BIGINT REFERENCES public.ilanlar(id) ON DELETE CASCADE,
    resim_url TEXT NOT NULL,
    resim_adi TEXT,
    sira_no INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Kullanıcı profilleri tablosu (auth.users'a ek bilgiler)
CREATE TABLE public.kullanici_profilleri (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ad_soyad TEXT,
    telefon TEXT,
    adres TEXT,
    sehir TEXT DEFAULT 'Konya',
    ilce TEXT DEFAULT 'Kulu',
    is_admin BOOLEAN DEFAULT FALSE,
    aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. İlan favorileri tablosu
CREATE TABLE public.ilan_favorileri (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ilan_id BIGINT REFERENCES public.ilanlar(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ilan_id)
);

-- 5. İlan görüntülenmeleri tablosu (istatistik için)
CREATE TABLE public.ilan_goruntulenmeleri (
    id BIGSERIAL PRIMARY KEY,
    ilan_id BIGINT REFERENCES public.ilanlar(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_adresi INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Admin onay geçmişi tablosu
CREATE TABLE public.admin_onay_gecmisi (
    id BIGSERIAL PRIMARY KEY,
    ilan_id BIGINT REFERENCES public.ilanlar(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES auth.users(id),
    onay_durumu BOOLEAN NOT NULL,
    onay_notu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler (performans için)
CREATE INDEX idx_ilanlar_user_id ON public.ilanlar(user_id);
CREATE INDEX idx_ilanlar_kategori ON public.ilanlar(kategori);
CREATE INDEX idx_ilanlar_alt_kategori ON public.ilanlar(alt_kategori);
CREATE INDEX idx_ilanlar_onayli ON public.ilanlar(onayli);
CREATE INDEX idx_ilanlar_created_at ON public.ilanlar(created_at);
CREATE INDEX idx_ilanlar_mahalle ON public.ilanlar(mahalle);
CREATE INDEX idx_ilanlar_fiyat ON public.ilanlar(fiyat);

CREATE INDEX idx_ilan_resimleri_ilan_id ON public.ilan_resimleri(ilan_id);
CREATE INDEX idx_ilan_favorileri_user_id ON public.ilan_favorileri(user_id);
CREATE INDEX idx_ilan_goruntulenmeleri_ilan_id ON public.ilan_goruntulenmeleri(ilan_id);

-- Trigger'lar (otomatik güncelleme için)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ilanlar_updated_at 
    BEFORE UPDATE ON public.ilanlar 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kullanici_profilleri_updated_at 
    BEFORE UPDATE ON public.kullanici_profilleri 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Otomatik kullanıcı profili oluşturma trigger'ı
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.kullanici_profilleri (id, created_at)
    VALUES (NEW.id, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) politikaları
ALTER TABLE public.ilanlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilan_resimleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kullanici_profilleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilan_favorileri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilan_goruntulenmeleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_onay_gecmisi ENABLE ROW LEVEL SECURITY;

-- İlanlar için RLS politikaları
-- Herkes onaylı ilanları görebilir
CREATE POLICY "Herkes onaylı ilanları görebilir" ON public.ilanlar
    FOR SELECT USING (onayli = true);

-- Kullanıcılar kendi ilanlarını görebilir
CREATE POLICY "Kullanıcılar kendi ilanlarını görebilir" ON public.ilanlar
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar ilan ekleyebilir
CREATE POLICY "Kullanıcılar ilan ekleyebilir" ON public.ilanlar
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi ilanlarını güncelleyebilir
CREATE POLICY "Kullanıcılar kendi ilanlarını güncelleyebilir" ON public.ilanlar
    FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar kendi ilanlarını silebilir
CREATE POLICY "Kullanıcılar kendi ilanlarını silebilir" ON public.ilanlar
    FOR DELETE USING (auth.uid() = user_id);

-- Admin tüm ilanları görebilir ve düzenleyebilir
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
            WHERE id = ilan_id AND onayli = true
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

-- Storage bucket'ları oluşturma (resimler için)
INSERT INTO storage.buckets (id, name, public) VALUES ('ilan-resimleri', 'ilan-resimleri', true);

-- Storage için RLS politikaları
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

-- İlk admin kullanıcısını oluşturmak için fonksiyon
CREATE OR REPLACE FUNCTION create_admin_user(email text, password text)
RETURNS text AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Bu fonksiyon sadece süper admin tarafından çalıştırılmalı
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (
        email,
        crypt(password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW()
    ) RETURNING id INTO user_id;
    
    -- Admin profili oluştur
    INSERT INTO public.kullanici_profilleri (id, is_admin, aktif)
    VALUES (user_id, true, true);
    
    RETURN 'Admin kullanıcı oluşturuldu: ' || user_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;