import { signupProfile } from './auth.js';

// Test kullanıcısı oluşturma fonksiyonu
async function createTestUser() {
  console.log('Test kullanıcısı oluşturuluyor...');
  
  try {
    // Test kullanıcı bilgileri
    const testUser = {
      ad: "Test",
      soyad: "Kullanıcı",
      telefon: "5551234567"
    };

    const result = await signupProfile(testUser);
    
    if (result.success) {
      console.log('Test kullanıcısı başarıyla oluşturuldu:', result.user);
      return true;
    } else {
      console.error('Kullanıcı oluşturma başarısız:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Kullanıcı oluşturma sırasında hata oluştu:', error);
    return false;
  }
}

// Test kullanıcı oluştur
async function runTest() {
  // Test kullanıcısı oluştur
  const createUserSuccess = await createTestUser();
  
  if (createUserSuccess) {
    console.log('✅ Test kullanıcısı başarıyla oluşturuldu!');
  } else {
    console.log('❌ Test kullanıcısı oluşturulamadı.');
  }
}

// Testi çalıştır
runTest();