# Kulu Emlak Pazarı

Kulu Emlak Pazarı, Kulu ilçesindeki emlak ilanlarını listeleyen ve yöneten bir web uygulamasıdır.

## Özellikler

- Kullanıcı kaydı ve girişi (telefon numarası ile)
- İlan ekleme, düzenleme ve silme
- İlanları kategori ve mahalleye göre filtreleme
- Resim yükleme desteği
- Admin paneli ile ilan onaylama
- Responsive tasarım

## Teknolojiler

- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5
- Supabase (Authentication, Database, Storage)
- Tailwind CSS (bazı sayfalarda)

## Kurulum

1. Projeyi bilgisayarınıza klonlayın veya indirin
2. Supabase hesabınızı oluşturun
3. Supabase projenizde gerekli tabloları oluşturun:
   - `ilanlar`
   - `ilan_resimleri`
   - `kullanici_profilleri`
   - `ilan_favorileri`
   - `ilan_goruntulenmeleri`
4. Supabase Storage'da `ilan-resimleri` adında bir bucket oluşturun
5. `.env` dosyasını oluşturun ve Supabase bilgilerinizi ekleyin:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   VITE_ADMIN_PASS=your_admin_password
   ```
6. `env.js` dosyasını oluşturun ve aynı bilgileri ekleyin

## Kullanım

### Kullanıcı Olarak

1. Ana sayfaya gidin
2. "Giriş Yap / Üye Ol" butonuna tıklayın
3. Telefon numaranızla kayıt olun veya giriş yapın
4. "İlan Ver" butonuna tıklayarak yeni ilan ekleyin

### Admin Olarak

1. Ana sayfaya gidin
2. "Giriş Yap / Üye Ol" butonuna tıklayın
3. Email: `satoshinakamototokyo42@gmail.com`
4. Şifre: `.env` dosyasında belirttiğiniz `VITE_ADMIN_PASS`
5. Admin paneline erişin
6. Kullanıcıları ve ilanları yönetin

## Dosya Yapısı

```
kuluilan/
├── admin.html          # Admin paneli
├── giris-kayit.html    # Giriş/kayıt sayfası
├── ilanver.html        # İlan verme sayfası
├── ilanlar.html        # İlan kategorileri sayfası
├── index.html          # Ana sayfa
├── user-dashboard.html # Kullanıcı paneli
├── iletisim.html       # İletişim sayfası
├── satilik-evler.html  # Satılık evler sayfası
├── kiralik-evler.html  # Kiralık evler sayfası
├── ...                 # Diğer kategori sayfaları
├── ilan.js             # İlan işlemleri (Supabase)
├── auth.js             # Kimlik doğrulama işlemleri
├── supabase-config.js  # Supabase yapılandırması
├── main.js             # Ana JavaScript dosyası
├── env.js              # Ortam değişkenleri
├── .env                # Ortam değişkenleri (gizli)
├── supabase-schema.sql # Supabase şeması
└── supabase-full-schema.sql # Tam Supabase şeması
```

## Geliştirme

### Yerel Sunucu

Projeyi yerelde çalıştırmak için bir HTTP sunucusu kullanmanız önerilir:

```bash
# Python 3 ile
python -m http.server 8000

# Node.js ile (http-server paketi gereklidir)
npx http-server

# Live Server eklentisi (VS Code)
# Sağ tık -> Open with Live Server
```

### Kod Kalitesi

- Tüm JavaScript dosyaları ES6 modüllerini kullanır
- Fonksiyonlar tek sorumluluk ilkesine göre tasarlanmıştır
- Hata işleme tüm asenkron işlemlerde uygulanmıştır

## Güvenlik

- Kullanıcı şifreleri Supabase tarafından güvenli şekilde hash'lenir
- JWT token'lar ile oturum yönetimi yapılır
- Satır seviyesi güvenlik (RLS) politikaları uygulanmıştır
- Ortam değişkenleri doğru şekilde ayrıştırılır

## Katkıda Bulunma

1. Forklayın
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi yapın
4. Commit'leyin (`git commit -am 'Yeni özellik eklendi'`)
5. Branch'inizi push'layın (`git push origin feature/yeni-ozellik`)
6. Pull request oluşturun

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## İletişim

Proje ile ilgili sorularınız için lütfen issues kısmını kullanın.