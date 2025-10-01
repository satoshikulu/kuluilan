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

export { register, login, logout };