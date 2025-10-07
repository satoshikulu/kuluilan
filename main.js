import { getSession, logout } from './auth.js';
import { getKullaniciIlanlari } from './ilan.js';

// Initial session check on page load (localStorage based)
document.addEventListener('DOMContentLoaded', async () => {
    const sessionUser = getSession();
    if (sessionUser) updateUIAfterLogin(sessionUser); else updateUIAfterLogout();
    // Bind logout buttons
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    });
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
        const adSoyad = [user.ad, user.soyad].filter(Boolean).join(' ').trim();
        const label = adSoyad || user.telefon || 'Kullanıcı';
        userInfo.textContent = `Hoş geldin, ${label}`;
        userInfo.style.display = 'block';
    }
}

function updateUIAfterLogout() {
    // Çıkış butonlarını gizle, giriş butonunu göster
    const loginBtns = document.querySelectorAll('.login-btn');
    const logoutBtns = document.querySelectorAll('.logout-btn');
    
    logoutBtns.forEach(btn => btn.style.display = 'none');
    
    // Kullanıcı bilgilerini gizle
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.style.display = 'none';
    }
}