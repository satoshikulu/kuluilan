import { supabase } from './supabase-config.js';

const LS_KEY = 'session_user';

export function getSession() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
}

export function setSession(user) {
  localStorage.setItem(LS_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(LS_KEY);
}

// Get current authenticated user from Supabase
export async function getCurrentUser() {
  // Auth kullanmadığımız için session'dan kullanıcı bilgilerini al
  return getSession();
}

// Signup without Supabase Auth - sadece veritabanına kayıt
export async function signupProfile({ ad, soyad, telefon }) {
  try {
    // Telefon numarasının benzersiz olduğunu kontrol et
    const { data: existing, error: existErr } = await supabase
      .from('kullanici_profilleri')
      .select('id')
      .eq('telefon', telefon)
      .maybeSingle();
    if (existErr && existErr.code !== 'PGRST116') throw existErr;
    if (existing) {
      return { success: false, error: 'Bu telefon numarası zaten kayıtlı' };
    }

    // Kullanıcıyı veritabanına kaydet (Supabase Auth kullanmadan)
    const { data, error } = await supabase
      .from('kullanici_profilleri')
      .insert([
        {
          ad: ad,
          soyad: soyad,
          telefon: telefon,
          onay_durumu: 'beklemede',
          aktif: false,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Session'ı kaydet
    const userData = {
      id: data.id,
      ad: data.ad,
      soyad: data.soyad,
      telefon: data.telefon
    };
    
    setSession(userData);

    return { 
      success: true, 
      user: userData,
      message: 'Kayıt başarılı! Admin onayı bekleniyor.' 
    };
  } catch (e) {
    console.error('Signup error:', e);
    return { success: false, error: e.message || String(e) };
  }
}

// Login without Supabase Auth - sadece veritabanından kullanıcı bul
export async function loginProfile({ ad, soyad, telefon }) {
  try {
    // Önce profili kontrol et
    const { data: profileData, error: profileError } = await supabase
      .from('kullanici_profilleri')
      .select('*')
      .eq('ad', ad)
      .eq('soyad', soyad)
      .eq('telefon', telefon)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profileData) return { success: false, error: 'Kullanıcı bulunamadı' };

    // Onay durumunu kontrol et
    if (profileData.onay_durumu === 'beklemede') {
      // Beklemede olan kullanıcılar için session oluştur
      const userData = {
        id: profileData.id,
        ad: profileData.ad,
        soyad: profileData.soyad,
        telefon: profileData.telefon,
        onay_durumu: profileData.onay_durumu
      };
      
      setSession(userData);
      return { success: true, user: userData, message: 'Hesabınız admin onayı bekliyor' };
    }
    
    if (profileData.onay_durumu === 'reddedildi') {
      return { success: false, error: 'Hesabınız reddedildi: ' + (profileData.red_nedeni || 'Nedeni belirtilmemiş') };
    }
    
    if (!profileData.aktif) {
      return { success: false, error: 'Hesabınız pasif durumda' };
    }

    // Session'ı kaydet
    const userData = {
      id: profileData.id,
      ad: profileData.ad,
      soyad: profileData.soyad,
      telefon: profileData.telefon,
      is_admin: profileData.is_admin,
      onay_durumu: profileData.onay_durumu
    };
    
    setSession(userData);

    // Son giriş zamanını güncelle
    await supabase
      .from('kullanici_profilleri')
      .update({ last_login: new Date().toISOString() })
      .eq('id', profileData.id);

    return { success: true, user: userData };
  } catch (e) {
    console.error('Login error:', e);
    return { success: false, error: e.message || String(e) };
  }
}

export async function logout() {
  clearSession();
  window.location.href = 'index.html';
}

export default { signupProfile, loginProfile, getSession, logout };