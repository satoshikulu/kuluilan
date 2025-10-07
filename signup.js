// signup.js - profiles tablosu ile telefon tabanlı kayıt
import { signupProfile, setSession } from './auth.js';

function qs(id) { return document.getElementById(id); }

async function handleSignup(e) {
  e.preventDefault();
  const ad = (qs('signup-ad')?.value || '').trim();
  const soyad = (qs('signup-soyad')?.value || '').trim();
  const telefon = (qs('signup-telefon')?.value || '').trim();

  if (!ad || !soyad || !/^\d{10}$/.test(telefon)) {
    alert('Lütfen ad, soyad ve 10 haneli telefon giriniz.');
    return;
  }

  try {
    const res = await signupProfile({ ad, soyad, telefon });
    if (!res.success) { 
      alert(res.error || 'Kayıt başarısız'); 
      return; 
    }
    
    alert(res.message || 'Kayıt başarılı! Admin onayı bekleniyor.');
    
    // Admin onayı beklendiği için anasayfaya yönlendir
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  } catch (err) {
    console.error('signup error:', err);
    alert('Kayıt sırasında hata: ' + (err?.message || String(err)));
  }
}

export function setupSignupForm() {
  const form = qs('signup-form');
  if (form) form.addEventListener('submit', handleSignup);
}

// Auto-attach if this module is loaded directly on the page
setupSignupForm();
