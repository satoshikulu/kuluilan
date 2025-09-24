# Supabase Kurulum Rehberi

## 📋 Adım Adım Kurulum

### 1. Supabase Projesi Oluşturma
1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın
4. "New project" butonuna tıklayın
5. Proje adını girin (örn: "kulu-emlak")
6. Güçlü bir database şifresi oluşturun
7. Region olarak "West EU (Ireland)" seçin
8. "Create new project" butonuna tıklayın

### 2. Tabloları Oluşturma
1. Supabase Dashboard'da sol menüden **SQL Editor**'a gidin
2. `supabase-tables.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'a yapıştırın
4. **RUN** butonuna tıklayın
5. Tüm komutların başarıyla çalıştığından emin olun

### 3. Konfigürasyon Bilgilerini Alma
1. Supabase Dashboard'da **Settings** > **API** bölümüne gidin
2. Aşağıdaki bilgileri kopyalayın:
   - **Project URL** (supabaseUrl)
   - **anon public** key (supabaseKey)

### 4. Konfigürasyon Dosyasını Güncelleme
`supabase-config.js` dosyasını açın ve bilgilerinizi girin:

```javascript
const supabaseUrl = 'https://your-project-ref.supabase.co'  // Gerçek URL'nizi yazın
const supabaseKey = 'your-anon-key'  // Gerçek anon key'inizi yazın
```

### 5. Authentication Ayarları
1. Supabase Dashboard'da **Authentication** > **Settings** bölümüne gidin
2. **Site URL** alanına projenizin URL'sini girin (örn: `http://localhost:3000`)
3. **Redirect URLs** alanına da aynı URL'i ekleyin
4. **Email confirmations** özelliğini istediğiniz gibi ayarlayın

### 6. Storage Ayarları (Otomatik Oluşturuldu)
Tablolar oluşturulurken `ilan-resimleri` bucket'ı otomatik olarak oluşturuldu.
Kontrol etmek için:
1. **Storage** bölümüne gidin
2. `ilan-resimleri` bucket'ının oluşturulduğunu görmelisiniz

### 7. İlk Admin Kullanıcısı Oluşturma
1. **SQL Editor**'a gidin
2. Aşağıdaki komutu çalıştırın (email ve şifre değiştirin):

```sql
SELECT create_admin_user('admin@kuluemplak.com', 'güçlü-şifre-123');
```

## 🧪 Test Etme

### 1. Bağlantı Testi
1. Tarayıcınızda `test-supabase.html` dosyasını açın
2. "Supabase Bağlantısını Test Et" butonuna tıklayın
3. Başarılı mesajı görmelisiniz

### 2. İlan Ekleme Testi
1. `ilan-ekle.html` sayfasını açın
2. Bir kategori seçin
3. Formu doldurun
4. İlanı göndermeyi deneyin

### 3. Database Kontrolü
1. Supabase Dashboard'da **Table Editor** > **ilanlar** tablosuna gidin
2. Test ilanınızın eklendiğini görmelisiniz

## 📊 Tablo Yapısı

### Ana Tablolar:
- **ilanlar**: Ana ilan verileri
- **ilan_resimleri**: İlan fotoğrafları
- **kullanici_profilleri**: Kullanıcı profil bilgileri
- **ilan_favorileri**: Favori ilanlar
- **ilan_goruntulenmeleri**: İlan görüntülenme istatistikleri
- **admin_onay_gecmisi**: Admin onay geçmişi

### Storage:
- **ilan-resimleri**: İlan fotoğrafları için bucket

## 🔐 Güvenlik Özellikleri

### Row Level Security (RLS):
- Kullanıcılar sadece kendi ilanlarını düzenleyebilir
- Herkes onaylı ilanları görebilir
- Admin'ler tüm ilanları yönetebilir
- Resimler için uygun erişim kontrolleri

### Otomatik Özellikler:
- Yeni kullanıcı kaydında otomatik profil oluşturma
- Güncelleme tarihlerinin otomatik güncellenmesi
- Cascade silme işlemleri

## 🚀 Üretim İçin Öneriler

### 1. Environment Variables
Üretim ortamında konfigürasyon bilgilerini environment variables olarak saklayın.

### 2. HTTPS
Mutlaka HTTPS kullanın.

### 3. Rate Limiting
Supabase Dashboard'da rate limiting ayarlarını kontrol edin.

### 4. Backup
Otomatik backup ayarlarını yapılandırın.

### 5. Monitoring
Database performansını ve kullanımını takip edin.

## 🔧 Sorun Giderme

### Bağlantı Sorunu:
- URL ve API key'in doğru olduğundan emin olun
- Console'da hata mesajlarını kontrol edin

### Tablo Bulunamadı Hatası:
- SQL script'in tamamen çalıştırıldığından emin olun
- Table Editor'da tabloların oluştuğunu kontrol edin

### Resim Yükleme Sorunu:
- Storage bucket'ının oluştuğunu kontrol edin
- RLS politikalarının doğru çalıştığından emin olun

### Authentication Sorunu:
- Site URL'lerinin doğru ayarlandığından emin olun
- Email confirmation ayarlarını kontrol edin

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Supabase Documentation'ı kontrol edin
2. Console'daki hata mesajlarını inceleyin
3. Supabase Community'ye danışın