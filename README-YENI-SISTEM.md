# Yeni Supabase Sistemi - Kullanım Kılavuzu

## 🎯 Genel Bakış

Yeni sistem üye olmadan ilan vermeyi ve admin onay mekanizmasını destekler.

## 📋 Özellikler

### 1. Üye Olmadan İlan Verme ✅
- Kullanıcılar üye olmadan ilan verebilir
- Konuk kullanıcılar ad, soyad ve telefon bilgisi vermelidir
- Tüm ilanlar admin onayından sonra yayına alınır

### 2. Üyelik Sistemi ✅
- Basit üyelik: Ad, Soyad, Telefon
- Tüm üyelikler admin onayı gerektirir
- Onaylı üyeler:
  - Kendi ilanlarını takip edebilir
  - İlan düzenleyebilir
  - Favori ekleyebilir

### 3. Admin Onay Sistemi ✅
- **İlan Onay**: Admin bekleyen ilanları onaylar veya reddeder
- **Üyelik Onay**: Admin bekleyen üyelikleri onaylar veya reddeder
- Onay geçmişi kaydedilir

## 🚀 Kurulum Adımları

### Adım 1: Supabase SQL'i Çalıştır

1. Supabase Dashboard'a gidin
2. SQL Editor'ü açın
3. `supabase-yeni-schema.sql` dosyasını çalıştırın

### Adım 2: İlk Admin Kullanıcısını Oluştur

```sql
-- 1. Önce normal üye kaydı yapın (giris-kayit.html'den)
-- Ad: Admin
-- Soyad: User
-- Telefon: 5550000000

-- 2. Sonra SQL Editor'de çalıştırın:
SELECT create_admin_user('satoshinakamototokyo42@gmail.com');
```

### Adım 3: Storage Bucket Ayarları

1. Supabase Dashboard > Storage
2. `ilan-resimleri` bucket'ının public olduğundan emin olun
3. RLS politikaları otomatik oluşturulmuştur

## 📊 Veritabanı Yapısı

### Tablolar

1. **ilanlar** - İlan bilgileri
   - `user_id` (NULL olabilir) - Üye ilanları
   - `konuk_ad`, `konuk_soyad`, `konuk_telefon` - Konuk kullanıcı ilanları
   - `onayli` - Admin onayı (boolean)
   - `durum` - beklemede | yayinda | reddedildi | pasif

2. **kullanici_profilleri** - Kullanıcı bilgileri
   - `ad`, `soyad`, `telefon` - Temel bilgiler
   - `onay_durumu` - beklemede | onaylandi | reddedildi
   - `is_admin` - Admin yetkisi
   - `aktif` - Hesap durumu

3. **ilan_resimleri** - İlan görselleri
4. **ilan_favorileri** - Favori ilanlar (sadece üyeler)
5. **ilan_goruntulenmeleri** - İlan istatistikleri
6. **admin_onay_gecmisi** - Onay geçmişi

## 🔐 Güvenlik ve İzinler

### Row Level Security (RLS)

- ✅ Tüm tablolarda RLS aktif
- ✅ Herkes onaylı ilanları görebilir
- ✅ Herkes ilan ekleyebilir (konuk veya üye)
- ✅ Sadece admin onay yapabilir
- ✅ Kullanıcılar kendi ilanlarını yönetebilir

## 💻 Frontend Kullanımı

### İlan Verme (ilanver.html)

**Konuk Kullanıcı:**
```javascript
// Konuk bilgileri form alanlarından otomatik alınır
// konuk_ad, konuk_soyad, konuk_telefon, konuk_email (opsiyonel)
```

**Üye Kullanıcı:**
```javascript
// Oturum açık ise user_id otomatik eklenir
// Konuk alanları gizlenebilir (opsiyonel)
```

### Admin Paneli (admin.html)

**İlan Onaylama:**
```javascript
// Supabase fonksiyonu kullan
const { data, error } = await supabase.rpc('approve_ilan', {
  p_ilan_id: ilanId,
  p_admin_id: adminUserId,
  p_admin_notu: 'Onay notu'
})
```

**İlan Reddetme:**
```javascript
const { data, error } = await supabase.rpc('reject_ilan', {
  p_ilan_id: ilanId,
  p_admin_id: adminUserId,
  p_red_nedeni: 'Red nedeni'
})
```

**Üyelik Onaylama:**
```javascript
const { data, error } = await supabase.rpc('approve_uye', {
  p_user_id: userId,
  p_admin_id: adminUserId,
  p_admin_notu: 'Onay notu'
})
```

**Üyelik Reddetme:**
```javascript
const { data, error } = await supabase.rpc('reject_uye', {
  p_user_id: userId,
  p_admin_id: adminUserId,
  p_red_nedeni: 'Red nedeni'
})
```

## 📱 Kullanıcı Akışları

### Konuk Kullanıcı İlan Verme
1. ilanver.html'i aç
2. İletişim bilgilerini doldur (ad, soyad, telefon)
3. İlan detaylarını doldur
4. Gönder
5. "İlanınız admin onayı için gönderildi" mesajı

### Üye Olma
1. giris-kayit.html'i aç
2. Kayıt formunu doldur (ad, soyad, telefon)
3. Kayıt ol
4. "Üyelik başvurunuz admin onayı için gönderildi" mesajı
5. Admin onayı sonrası aktif olur

### Admin İlan Onaylama
1. admin.html > Bekleyen İlanlar
2. İlan detaylarını incele
3. Onayla veya Reddet
4. Not/neden ekle
5. Kaydet

### Admin Üyelik Onaylama
1. admin.html > Bekleyen Üyelikler
2. Kullanıcı bilgilerini incele
3. Onayla veya Reddet
4. Not/neden ekle
5. Kaydet

## 🔧 Konfigürasyon

### Sistem Ayarları (sistem_ayarlari tablosu)

```sql
-- Otomatik onay ayarları
UPDATE sistem_ayarlari 
SET deger = 'true' 
WHERE anahtar = 'otomatik_ilan_onay';

UPDATE sistem_ayarlari 
SET deger = 'true' 
WHERE anahtar = 'otomatik_uyelik_onay';

-- Konuk ilan vermeyi kapat
UPDATE sistem_ayarlari 
SET deger = 'false' 
WHERE anahtar = 'konuk_ilan_izin';
```

## 🐛 Sorun Giderme

### "Kullanıcı bulunamadı" Hatası
- `auth.users` tablosunda kullanıcı var mı kontrol edin
- Email doğru yazıldığından emin olun

### İlan Görünmüyor
- İlan `onayli = true` ve `durum = 'yayinda'` mı kontrol edin
- RLS politikaları aktif mi kontrol edin

### Resim Yüklenmiyor
- Storage bucket `ilan-resimleri` oluşturulmuş mu
- Bucket public mi
- RLS politikaları doğru mu

## 📞 Destek

Sorun yaşarsanız:
1. Browser console'u kontrol edin
2. Supabase logs'u inceleyin
3. RLS politikalarını kontrol edin
4. SQL fonksiyonlarının çalıştığından emin olun

## ✅ Test Checklist

- [ ] SQL schema başarıyla çalıştırıldı
- [ ] İlk admin oluşturuldu
- [ ] Storage bucket hazır
- [ ] Konuk kullanıcı ilan verebiliyor
- [ ] Üye kayıt olabiliyor
- [ ] Admin ilan onaylayabiliyor
- [ ] Admin üyelik onaylayabiliyor
- [ ] Onaylı ilanlar görünüyor
- [ ] Resim yükleme çalışıyor

---

**Son Güncelleme:** 2025-10-05
**Versiyon:** 2.0
