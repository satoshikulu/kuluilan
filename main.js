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
        // Show phone if synthetic phone email is used (e.g., 5551234567@example.com)
        let label = user.email || '';
        // If email local-part is only digits, show it as phone number
        const match = label.match(/^([0-9]+)@/);
        if (match) {
            label = match[1];
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
    // Use a configurable synthetic domain that passes email validation
    const env = (typeof window !== 'undefined') ? (window.__ENV || {}) : {};
    const domain = env.SYNTHETIC_EMAIL_DOMAIN || 'example.com';
    return `${phoneDigits}@${domain}`;
}

// Derive a deterministic password from the phone number so user doesn't type one
// Note: This is a UX convenience and not as secure as true passwordless with OTP.
function derivePassword(phoneDigits) {
    // Ensure minimum length and include mixed chars
    return `kP@z-${phoneDigits}-#2025!`;
}

// Setup modal form handlers
function setupModalForms() {
    // Login form submit handler using only phone (no password in UI)
    const loginForm = document.querySelector('#login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phoneInput = document.querySelector('#login-phone');
            const phone = phoneInput ? phoneInput.value : '';
            const phoneDigits = normalizePhone(phone);
            const syntheticEmail = phoneToEmail(phoneDigits);
            const password = derivePassword(phoneDigits);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            if (modal) modal.hide();
            
            const result = await login(syntheticEmail, password);
            if (!result.success) {
                alert('Giriş başarısız: ' + result.error);
            }
            // Admin approval check after login
            try {
                const user = await getCurrentUser();
                if (user) {
                    const { data: prof, error: profErr } = await supabase
                        .from('kullanici_profilleri')
                        .select('onayli')
                        .eq('id', user.id)
                        .maybeSingle();
                    if (!profErr && prof) {
                        if (prof.onayli !== true) {
                            // Not approved: immediately sign out
                            await supabase.auth.signOut();
                            alert('Hesabınız henüz admin tarafından onaylanmadı.');
                        } else {
                            // Approved: redirect to homepage
                            setTimeout(() => { window.location.href = 'index.html'; }, 300);
                        }
                    }
                }
            } catch (x) {
                console.warn('Onay kontrolü yapılamadı:', x);
            }
        });
    }

    // Register form submit handler using ad soyad + phone (no password in UI)
    const registerForm = document.querySelector('#register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameInput = document.querySelector('#register-name');
            const phoneInput = document.querySelector('#register-phone');
            const name = nameInput ? nameInput.value : '';
            const phone = phoneInput ? phoneInput.value : '';
            const phoneDigits = normalizePhone(phone);
            const syntheticEmail = phoneToEmail(phoneDigits);
            const password = derivePassword(phoneDigits);
            
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
                        // Save profile with pending approval by default
                        await updateUserProfile(user.id, { ad_soyad: name, telefon: phoneDigits, onayli: false });
                    }
                } catch (err) {
                    console.warn('Profil kaydedilirken uyarı:', err);
                }
                alert('Kayıt alındı! Admin onayından sonra telefon numaranızla giriş yapabilirsiniz.');
            }
        });
    }
}

// Make getKullaniciIlanlari globally available
window.getKullaniciIlanlari = getKullaniciIlanlari;