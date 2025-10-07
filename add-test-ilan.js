import { getSupabase } from './supabase-config.js';
import { loginProfile } from './auth.js';

// Test kullanıcısıyla giriş yapma fonksiyonu
async function loginTestUser() {
  console.log('Test kullanıcısıyla giriş yapılıyor...');
  
  try {
    // Test kullanıcı bilgileri (Supabase şemasına göre)
    const testUser = {
      ad: "Test",
      soyad: "Kullanıcı",
      telefon: "5551234567"
    };

    const result = await loginProfile(testUser);
    
    if (result.success) {
      console.log('Test kullanıcısıyla giriş yapıldı:', result.user);
      return true;
    } else {
      console.error('Giriş başarısız:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Giriş sırasında hata oluştu:', error);
    return false;
  }
}

// Test ilanı ekleme fonksiyonu
async function addTestIlan() {
  console.log('Test ilanı ekleniyor...');
  
  try {
    const supabase = getSupabase();
    
    // Test ilan verisi
    const testIlan = {
      baslik: "Test İlanı - 3+1 Satılık Daire",
      aciklama: "Bu bir test ilanıdır. Lütfen dikkate almayınız.",
      fiyat: 500000,
      kategori: "satilik-ev",
      alt_kategori: "3+1",
      konum: "Merkez",
      telefon: "5551234567",
      mahalle: "cumhuriyet",
      onayli: false,
      durum: "beklemede"
    };

    // İlanı ekle
    const { data, error } = await supabase
      .from('ilanlar')
      .insert([testIlan])
      .select();

    if (error) {
      console.error('Test ilanı eklenirken hata oluştu:', error);
      return false;
    }

    console.log('Test ilanı başarıyla eklendi:', data);
    console.log('Eklenen ilan ID:', data[0].id);
    
    return true;
  } catch (error) {
    console.error('Test ilanı eklenirken hata oluştu:', error);
    return false;
  }
}

// Test ilanını ekle
async function runTest() {
  // Önce test kullanıcısıyla giriş yap
  const loginSuccess = await loginTestUser();
  
  if (loginSuccess) {
    // Giriş başarılıysa ilan ekle
    const addSuccess = await addTestIlan();
    
    if (addSuccess) {
      console.log('✅ Test ilanı başarıyla eklendi!');
    } else {
      console.log('❌ Test ilanı eklenirken hata oluştu.');
    }
  } else {
    console.log('❌ Test kullanıcısıyla giriş yapılamadı.');
  }
}

// Testi çalıştır
runTest();