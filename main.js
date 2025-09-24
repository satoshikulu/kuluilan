import { register, login, logout } from './auth.js';
import { getKullaniciIlanlari } from './ilan-ekle.js';
import { supabase } from './supabase-config.js';

// Supabase oturum durumunu kontrol et
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('Kullanıcı giriş yaptı:', session.user);
        updateUIAfterLogin(session.user);
    } else if (event === 'SIGNED_OUT') {
        console.log('Kullanıcı çıkış yaptı');
        updateUIAfterLogout();
    }
});

// UI güncellemeleri
function updateUIAfterLogin(user) {
    // Giriş butonlarını gizle, çıkış butonunu göster
    const loginBtns = document.querySelectorAll('.login-btn');
    const logoutBtns = document.querySelectorAll('.logout-btn');
    
    loginBtns.forEach(btn => btn.style.display = 'none');
    logoutBtns.forEach(btn => btn.style.display = 'block');
    
    // Kullanıcı bilgilerini göster
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.textContent = `Hoş geldin, ${user.email}`;
        userInfo.style.display = 'block';
    }
}

function updateUIAfterLogout() {
    // Çıkış butonlarını gizle, giriş butonunu göster
    const loginBtns = document.querySelectorAll('.login-btn');
    const logoutBtns = document.querySelectorAll('.logout-btn');
    
    loginBtns.forEach(btn => btn.style.display = 'block');
    logoutBtns.forEach(btn => btn.style.display = 'none');
    
    // Kullanıcı bilgilerini gizle
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.style.display = 'none';
    }
}

// Login form submit handler
document.querySelector('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#login-email').value;
    const password = document.querySelector('#login-password').value;
    
    const result = await login(email, password);
    if (!result.success) {
        alert('Giriş başarısız: ' + result.error);
    }
});

// Register form submit handler
document.querySelector('#register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#register-email').value;
    const password = document.querySelector('#register-password').value;
    
    const result = await register(email, password);
    if (!result.success) {
        alert('Kayıt başarısız: ' + result.error);
    } else {
        alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
    }
});

// Make getKullaniciIlanlari globally available
window.getKullaniciIlanlari = getKullaniciIlanlari;
