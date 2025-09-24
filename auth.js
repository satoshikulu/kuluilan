import { supabase, signIn, signUp, signOut, getCurrentUser } from './supabase-config.js';

// Supabase Authentication functions
/**
 * Kullanıcı kayıt fonksiyonu
 * @param {string} email - Kullanıcının email adresi
 * @param {string} password - Kullanıcının şifresi
 * @returns {Promise} Kayıt işleminin sonucunu içeren Promise
 */
function register(email, password) {
    return signUp(email, password)
        .then(({ data, error }) => {
            if (error) {
                console.error("Kayıt hatası:", error.message);
                return {
                    success: false,
                    error: error.message
                };
            }
            
            console.log("Kayıt başarılı:", data.user);
            return {
                success: true,
                user: data.user
            };
        })
        .catch((error) => {
            console.error("Kayıt hatası:", error.message);
            return {
                success: false,
                error: error.message
            };
        });
}

/**
 * Kullanıcı giriş fonksiyonu
 * @param {string} email - Kullanıcının email adresi
 * @param {string} password - Kullanıcının şifresi
 * @returns {Promise} Giriş işleminin sonucunu içeren Promise
 */
function login(email, password) {
    return signIn(email, password)
        .then(({ data, error }) => {
            if (error) {
                console.error("Giriş hatası:", error.message);
                return {
                    success: false,
                    error: error.message
                };
            }
            
            console.log("Giriş başarılı:", data.user);
            // Admin kontrolü
            if (email === 'satoshinakamototokyo42@gmail.com') {
                // Admin dashboard'a yönlendir
                window.location.href = '/admin-dashboard.html';
            } else {
                // Normal kullanıcı dashboard'a yönlendir
                window.location.href = '/user-dashboard.html';
            }
            return {
                success: true,
                user: data.user
            };
        })
        .catch((error) => {
            console.error("Giriş hatası:", error.message);
            return {
                success: false,
                error: error.message
            };
        });
}

// Oturumu kapatma fonksiyonu
async function logout() {
    try {
        const { error } = await signOut();
        if (error) {
            console.error("Çıkış hatası:", error.message);
            return {
                success: false,
                error: error.message
            };
        }
        
        console.log("Başarıyla çıkış yapıldı");
        window.location.href = '/index.html';
        return {
            success: true
        };
    } catch (error) {
        console.error("Çıkış hatası:", error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Form submit işleyicisi örneği - Kayıt
function handleRegisterFormSubmit(event) {
    event.preventDefault();
    
    const email = event.target.email.value;
    const password = event.target.password.value;
    
    register(email, password)
        .then((result) => {
            if (result.success) {
                // Başarılı kayıt sonrası yönlendirme veya UI güncelleme
                alert('Kayıt başarılı! Hoş geldiniz.');
                // Örnek: window.location.href = '/dashboard';
            } else {
                // Hata mesajını göster
                alert('Kayıt sırasında bir hata oluştu: ' + result.error);
            }
        });
}

// Form submit işleyicisi örneği - Giriş
function handleLoginFormSubmit(event) {
    event.preventDefault();
    
    const email = event.target.email.value;
    const password = event.target.password.value;
    
    login(email, password)
        .then((result) => {
            if (result.success) {
                // Başarılı giriş sonrası yönlendirme veya UI güncelleme
                alert('Giriş başarılı! Hoş geldiniz.');
                // Admin kontrolü
                if (email === 'satoshinakamototokyo42@gmail.com') {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    window.location.href = '/user-dashboard.html';
                }
            } else {
                // Hata mesajını göster
                alert('Giriş sırasında bir hata oluştu: ' + result.error);
            }
        });
}

export { register, login, logout, handleRegisterFormSubmit, handleLoginFormSubmit };