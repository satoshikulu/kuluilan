# Test Senaryoları

## 🧪 Kurulum Sonrası Testler

### Test 1: Konuk Kullanıcı İlan Verme
1. **ilanver.html** sayfasını aç
2. İletişim bilgilerini doldur:
   - Adınız: Ahmet
   - Soyadınız: Yılmaz
   - Telefon: 5551234567
3. İlan bilgilerini doldur:
   - Başlık: Test Satılık Ev
   - Kategori: Satılık Ev
   - Fiyat: 500000
   - Mahalle: Cumhuriyet
   - Açıklama: Test amaçlı ilan
   - Telefon: 5551234567
4. **İlanı Yayınla** butonuna tıkla
5. ✅ Beklenen: "İlanınız admin onayı için gönderildi" mesajı

**SQL Kontrolü:**
```sql
SELECT id, baslik, konuk_ad, konuk_soyad, onayli, durum 
FROM ilanlar 
WHERE konuk_telefon = '5551234567';
```
Beklenen: `onayli = false`, `durum = 'beklemede'`

---

### Test 2: Üye Kaydı
1. **giris-kayit.html** sayfasını aç
2. Kayıt Ol formunu doldur:
   - Ad: Test
   - Soyad: Kullanıcı
   - Telefon: 5559876543
3. **Kayıt Ol** butonuna tıkla
4. ✅ Beklenen: "Kayıt başarılı! Admin onayı bekleniyor" mesajı

**SQL Kontrolü:**
```sql
SELECT k.id, k.ad, k.soyad, k.telefon, k.onay_durumu, k.aktif 
FROM kullanici_profilleri k
WHERE k.telefon = '5559876543';
```
Beklenen: `onay_durumu = 'beklemede'`, `aktif = false`

---

### Test 3: Admin ile Giriş
1. **giris-kayit.html** sayfasını aç
2. Giriş Yap formunu doldur:
   - Ad: Admin
   - Soyad: User
   - Telefon: 5550000000
3. **Giriş Yap** butonuna tıkla
4. ✅ Beklenen: Başarılı giriş, anasayfaya yönlendirilme

**Console Kontrolü:**
```javascript
// Browser console'da
console.log(localStorage.getItem('session_user'));
```
Beklenen: JSON formatında kullanıcı bilgileri

---

### Test 4: Admin İlan Onaylama
1. Admin olarak **admin.html** sayfasını aç
2. Bekleyen ilanları görüntüle
3. Test ilanını bul (Ahmet Yılmaz'ın ilanı)
4. **Onayla** butonuna tıkla
5. Admin notu ekle: "Test onayı"
6. ✅ Beklenen: İlan onaylanır

**SQL Kontrolü:**
```sql
SELECT id, baslik, onayli, durum, onay_tarihi, admin_notu 
FROM ilanlar 
WHERE konuk_telefon = '5551234567';
```
Beklenen: `onayli = true`, `durum = 'yayinda'`

**Admin Geçmişi:**
```sql
SELECT * FROM admin_onay_gecmisi 
WHERE kayit_tipi = 'ilan' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

### Test 5: Admin Üyelik Onaylama
1. Admin olarak **admin.html** sayfasını aç
2. Bekleyen üyelikleri görüntüle
3. Test kullanıcısını bul (Test Kullanıcı)
4. **Onayla** butonuna tıkla
5. ✅ Beklenen: Üyelik onaylanır

**SQL Kontrolü:**
```sql
SELECT id, ad, soyad, telefon, onay_durumu, aktif, onay_tarihi
FROM kullanici_profilleri 
WHERE telefon = '5559876543';
```
Beklenen: `onay_durumu = 'onaylandi'`, `aktif = true`

---

### Test 6: Onaylı Üye ile İlan Verme
1. Test Kullanıcı ile giriş yap (5559876543)
2. **ilanver.html** sayfasını aç
3. ✅ Beklenen: İletişim bilgileri otomatik dolu olmalı (üye olduğu için)
4. İlan bilgilerini doldur ve yayınla
5. ✅ Beklenen: İlan `user_id` ile kaydedilir, `konuk_*` alanları NULL

**SQL Kontrolü:**
```sql
SELECT id, baslik, user_id, konuk_ad, onayli, durum 
FROM ilanlar 
WHERE user_id = (SELECT id FROM kullanici_profilleri WHERE telefon = '5559876543');
```
Beklenen: `user_id IS NOT NULL`, `konuk_ad IS NULL`

---

### Test 7: Anasayfada İlanları Görüntüleme
1. **index.html** sayfasını aç
2. ✅ Beklenen: Sadece onaylı ilanlar görünür
3. Konsolu kontrol et (F12)

**SQL Kontrolü:**
```sql
SELECT id, baslik, onayli, durum, aktif 
FROM ilanlar 
WHERE onayli = true AND durum = 'yayinda' AND aktif = true;
```

---

### Test 8: İlan Reddetme
1. Admin olarak yeni bir konuk ilan oluştur
2. **admin.html** > Bekleyen İlanlar
3. İlanı seç ve **Reddet** butonuna tıkla
4. Red nedeni gir: "Test red"
5. ✅ Beklenen: İlan reddedilir

**SQL Kontrolü:**
```sql
SELECT id, baslik, onayli, durum, red_nedeni 
FROM ilanlar 
WHERE durum = 'reddedildi' 
ORDER BY created_at DESC 
LIMIT 1;
```
Beklenen: `durum = 'reddedildi'`, `red_nedeni = 'Test red'`

---

### Test 9: Üyelik Reddetme
1. Admin olarak yeni bir kayıt oluştur (farklı telefon)
2. **admin.html** > Bekleyen Üyelikler
3. Kullanıcıyı seç ve **Reddet** butonuna tıkla
4. Red nedeni gir: "Test amaçlı red"
5. ✅ Beklenen: Üyelik reddedilir

**SQL Kontrolü:**
```sql
SELECT id, ad, soyad, onay_durumu, red_nedeni, aktif 
FROM kullanici_profilleri 
WHERE onay_durumu = 'reddedildi' 
ORDER BY created_at DESC 
LIMIT 1;
```
Beklenen: `onay_durumu = 'reddedildi'`, `aktif = false`

---

### Test 10: Reddedilen Kullanıcı Giriş Denemesi
1. Reddedilen kullanıcının bilgileriyle giriş yap
2. ✅ Beklenen: "Hesabınız reddedildi: Test amaçlı red" mesajı
3. Giriş yapılmamalı

---

## 🔍 Hata Ayıklama Komutları

### Tüm İlanları Görüntüle
```sql
SELECT 
    id, 
    baslik, 
    COALESCE(konuk_ad, 'Üye') as kim,
    fiyat,
    mahalle,
    onayli,
    durum,
    created_at
FROM ilanlar 
ORDER BY created_at DESC;
```

### Tüm Kullanıcıları Görüntüle
```sql
SELECT 
    k.id,
    k.ad,
    k.soyad,
    k.telefon,
    k.onay_durumu,
    k.aktif,
    k.is_admin,
    a.email
FROM kullanici_profilleri k
LEFT JOIN auth.users a ON a.id = k.id
ORDER BY k.created_at DESC;
```

### Admin Onay Geçmişi
```sql
SELECT 
    kayit_tipi,
    kayit_id,
    onay_durumu,
    onay_notu,
    eski_durum,
    yeni_durum,
    created_at
FROM admin_onay_gecmisi 
ORDER BY created_at DESC 
LIMIT 20;
```

### Storage Bucket Kontrolü
```sql
SELECT * FROM storage.buckets WHERE id = 'ilan-resimleri';
```

### Storage RLS Politikaları
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

---

## ⚠️ Yaygın Hatalar ve Çözümler

### Hata: "Kullanıcı oluşturulamadı"
**Çözüm:** Supabase Dashboard > Authentication > Settings
- Email Confirmations → **Disable**
- Auto Confirm Users → **Enable**

### Hata: "İlan görünmüyor"
**Çözüm:** 
```sql
-- İlanın durumunu kontrol et
SELECT onayli, durum, aktif FROM ilanlar WHERE id = X;

-- Eğer beklemedeyse, manuel onayla
SELECT approve_ilan(X, 'ADMIN_USER_ID', 'Manuel onay');
```

### Hata: "Resim yüklenmiyor"
**Çözüm:**
```sql
-- Bucket kontrolü
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ilan-resimleri', 'ilan-resimleri', true)
ON CONFLICT (id) DO UPDATE SET public = true;
```

### Hata: "Admin yetkisi yok"
**Çözüm:**
```sql
-- Kullanıcıyı admin yap
UPDATE kullanici_profilleri 
SET is_admin = true, aktif = true, onay_durumu = 'onaylandi'
WHERE telefon = '5550000000';
```

---

## ✅ Başarı Kriterleri

- [ ] Konuk kullanıcı ilan verebiliyor
- [ ] Yeni üye kayıt olabiliyor
- [ ] Üye giriş yapabiliyor
- [ ] Admin ilan onaylayabiliyor
- [ ] Admin ilan reddedebiliyor
- [ ] Admin üyelik onaylayabiliyor
- [ ] Admin üyelik reddedebiliyor
- [ ] Onaylı ilanlar anasayfada görünüyor
- [ ] Reddedilen kullanıcı giriş yapamıyor
- [ ] Bekleyen kullanıcı giriş yapamıyor
- [ ] Resim yükleme çalışıyor
- [ ] RLS politikaları çalışıyor

---

**Test Tarihi:** _______________
**Test Eden:** _______________
**Sonuç:** ⬜ Başarılı  ⬜ Başarısız

**Notlar:**
_______________________________________________
_______________________________________________
