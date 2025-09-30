import { register, login, logout } from './auth.js';
import { getKullaniciIlanlari } from './ilan.js';
import { supabase, getCurrentUser, updateUserProfile } from './supabase-config.js';

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

// Initial session check on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await getCurrentUser();
        if (user) {
            updateUIAfterLogin(user);
        } else {
            updateUIAfterLogout();
        }
        
        // Setup modal form handlers
        setupModalForms();
    } catch (e) {
        console.warn('Oturum kontrolü yapılamadı:', e);
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
        // Show phone if synthetic phone email is used
        let label = user.email || '';
        if (label.endsWith('@phone.local')) {
            label = label.replace('@phone.local', '');
        }
        userInfo.textContent = `Hoş geldin, ${label}`;
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

// Helpers for phone-based auth
function normalizePhone(raw) {
    const digits = (raw || '').replace(/[^0-9]/g, '');
    return digits; // keep as is; backend expects 10-11 digits allowed by UI
}

function phoneToEmail(phoneDigits) {
    return `${phoneDigits}@phone.local`;
}

// Setup modal form handlers
function setupModalForms() {
    // Login form submit handler (guarded) using phone+password
    const loginForm = document.querySelector('#login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phoneInput = document.querySelector('#login-phone');
            const passwordInput = document.querySelector('#login-password');
            const phone = phoneInput ? phoneInput.value : '';
            const password = passwordInput ? passwordInput.value : '';
            const phoneDigits = normalizePhone(phone);
            const syntheticEmail = phoneToEmail(phoneDigits);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            if (modal) modal.hide();
            
            const result = await login(syntheticEmail, password);
            if (!result.success) {
                alert('Giriş başarısız: ' + result.error);
            }
        });
    }

    // Register form submit handler (guarded) using name+phone+password
    const registerForm = document.querySelector('#register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameInput = document.querySelector('#register-name');
            const phoneInput = document.querySelector('#register-phone');
            const passwordInput = document.querySelector('#register-password');
            const name = nameInput ? nameInput.value : '';
            const phone = phoneInput ? phoneInput.value : '';
            const password = passwordInput ? passwordInput.value : '';
            const phoneDigits = normalizePhone(phone);
            const syntheticEmail = phoneToEmail(phoneDigits);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            if (modal) modal.hide();
            
            const result = await register(syntheticEmail, password);
            if (!result.success) {
                alert('Kayıt başarısız: ' + result.error);
            } else {
                try {
                    // Ensure we have a user id then save profile
                    const user = await getCurrentUser();
                    if (user) {
                        await updateUserProfile(user.id, { ad_soyad: name, telefon: phoneDigits });
                    }
                } catch (err) {
                    console.warn('Profil kaydedilirken uyarı:', err);
                }
                alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
            }
        });
    }
}

// Make getKullaniciIlanlari globally available
window.getKullaniciIlanlari = getKullaniciIlanlari;