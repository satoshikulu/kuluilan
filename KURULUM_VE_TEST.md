# Kulu Emlak Pazarı - Kurulum ve Test Rehberi

## Kurulum

### Gereksinimler
- Modern bir web tarayıcısı (Chrome, Firefox, Safari, Edge)
- Node.js (geliştirme için)
- Supabase hesabı

### Yerel Geliştirme Ortamı

1. **Projeyi klonlayın veya indirin**
   ```
   git clone <repo-url>
   ```

2. **Gerekli araçları yükleyin**
   ```bash
   # http-server paketini yükleyin (yerel test için)
   npm install -g http-server
   ```

3. **Sunucuyu başlatın**
   ```bash
   # Proje dizinine gidin
   cd kuluilan
   
   # Yerel sunucuyu başlatın
   http-server -p 8081
   ```

4. **Tarayıcınızda uygulamayı açın**
   - http://localhost:8081

## Supabase Yapılandırması

### 1. Supabase Projeyi Oluşturma
1. [Supabase](https://supabase.io/) hesabınıza giriş yapın
2. Yeni bir proje oluşturun
3. Proje URL'sini ve anon key'i not alın

### 2. Veritabanı Şemasını Oluşturma
1. Supabase dashboard'unda SQL editörüne gidin
2. `supabase-full-schema.sql` dosyasının içeriğini çalıştırın
3. `supabase-schema.sql` dosyasının içeriğini çalıştırın

### 3. Storage Ayarları
1. Supabase dashboard'unda Storage bölümüne gidin
2. `ilan-resimleri` adında bir bucket oluşturun
3. Bucket'ın public erişime açık olduğundan emin olun

### 4. Ortam Değişkenlerini Ayarlama
1. `.env` dosyasını oluşturun:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   VITE_ADMIN_PASS=your_admin_password
   ```

2. `env.js` dosyasını güncelleyin:
   ```javascript
   window.__ENV = {
     VITE_SUPABASE_URL: "your_supabase_project_url",
     VITE_SUPABASE_ANON_KEY: "your_supabase_anon_key",
     VITE_SUPABASE_SERVICE_ROLE_KEY: "your_supabase_service_role_key"
   };
   ```

## Test Rehberi

### 1. Kullanıcı Kaydı ve Girişi

#### 1.1. Kayıt Olma
1. http://localhost:8081/giris-kayit.html adresine gidin
2. "Üye Ol" sekmesine tıklayın
3. Formu doldurun:
   - Ad Soyad: Test Kullanıcı
   - Telefon: 5551234567 (10 haneli)
   - Şifre: en az 6 karakter
   - Şifre Tekrar: Aynı şifre
4. "Üye Ol" butonuna tıklayın
5. Başarılı kayıt mesajını görün

#### 1.2. Giriş Yapma
1. "Giriş Yap" sekmesine geçin
2. Formu doldurun:
   - Telefon: 5551234567
   - Şifre: Kayıt sırasında kullandığınız şifre
3. "Giriş Yap" butonuna tıklayın
4. Ana sayfaya yönlendirildiğinizi görün

### 2. İlan Verme

#### 2.1. Yeni İlan Ekleme
1. Ana sayfada "İlan Ver" butonuna tıklayın
2. Formu doldurun:
   - Başlık: Test İlanı
   - Kategori: Satılık Ev
   - Fiyat: 500000
   - Mahalle: Merkez Mahallesi
   - Açıklama: Test ilanı açıklaması
   - Telefon: 5551234567
3. Gerekirse resim ekleyin
4. "İlanı Yayınla" butonuna tıklayın
5. Başarılı mesajını görün

### 3. Admin İşlemleri

#### 3.1. Admin Girişi
1. http://localhost:8081/admin.html adresine gidin
2. Formu doldurun:
   - Email: satoshinakamototokyo42@gmail.com
   - Şifre: .env dosyasında belirttiğiniz VITE_ADMIN_PASS
3. "Giriş Yap" butonuna tıklayın

#### 3.2. İlan Onaylama
1. Bekleyen ilanları görün
2. "Yayına Al" butonuna tıklayarak ilanı onaylayın

### 4. Kullanıcı Paneli

#### 4.1. Kullanıcı Girişi
1. http://localhost:8081/user-dashboard.html adresine gidin
2. Kullanıcı olarak giriş yapın

#### 4.2. İlan Yönetimi
1. Kendi ilanlarınızı görün
2. İlan detaylarını görüntüleyin
3. İlanı düzenleyin veya silin

## Dosya Yapısı ve Açıklamalar

### Ana Sayfalar
- `index.html`: Ana sayfa
- `ilanlar.html`: İlan kategorileri
- `giris-kayit.html`: Kimlik doğrulama sayfası
- `ilanver.html`: İlan verme sayfası
- `admin.html`: Admin paneli
- `user-dashboard.html`: Kullanıcı paneli

### JavaScript Dosyaları
- `supabase-config.js`: Supabase istemci yapılandırması
- `auth.js`: Kimlik doğrulama işlemleri
- `ilan.js`: İlan işlemleri
- `main.js`: Ana uygulama mantığı
- `env.js`: Ortam değişkenleri

### Yapılandırma Dosyaları
- `.env`: Ortam değişkenleri (gizli)
- `supabase-schema.sql`: Kimlik doğrulama şeması
- `supabase-full-schema.sql`: Tam veritabanı şeması

## Sorun Giderme

### Yaygın Sorunlar

#### 1. "Supabase ortam değişkenleri eksik" hatası
- Çözüm: `env.js` dosyasının doğru şekilde yapılandırıldığından emin olun

#### 2. İlan eklerken "Lütfen giriş yapın" hatası
- Çözüm: Kullanıcı olarak giriş yapıldığından emin olun

#### 3. Resim yüklenemiyor hatası
- Çözüm: Supabase Storage'da `ilan-resimleri` bucket'ının oluşturulduğundan ve public erişime açık olduğundan emin olun

#### 4. Admin paneline erişilemiyor
- Çözüm: Admin kullanıcısının doğru şekilde oluşturulduğundan emin olun

### Destek

Sorunlarla karşılaşırsanız:
1. Tarayıcı konsolundaki hata mesajlarını kontrol edin
2. Ağ sekmesinde API çağrılarını inceleyin
3. Supabase dashboard'unda logları kontrol edin
4. GitHub issues bölümünde yardım isteyin

## Geliştirme

### Kod Kalitesi
- Tüm JavaScript dosyaları ES6 modüllerini kullanır
- Fonksiyonlar tek sorumluluk ilkesine göre tasarlanmıştır
- Hata işleme tüm asenkron işlemlerde uygulanmıştır

### Katkıda Bulunma
1. Forklayın
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi yapın
4. Commit'leyin (`git commit -am 'Yeni özellik eklendi'`)
5. Branch'inizi push'layın (`git push origin feature/yeni-ozellik`)
6. Pull request oluşturun