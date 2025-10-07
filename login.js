// login.js - profiles tablosu ile telefon tabanlı giriş
import { loginProfile, setSession } from './auth.js';

function qs(id) { return document.getElementById(id); }

async function handleLogin(e) {
  e.preventDefault();
  const ad = (qs('login-ad')?.value || '').trim();
  const soyad = (qs('login-soyad')?.value || '').trim();
  const telefon = (qs('login-telefon')?.value || '').trim();

  if (!ad || !soyad || !/^\d{10}$/.test(telefon)) {
    alert('Lütfen ad, soyad ve 10 haneli telefon giriniz.');
    return;
  }

  try {
    const res = await loginProfile({ ad, soyad, telefon });
    if (!res.success) { alert(res.error || 'Giriş başarısız'); return; }
    const row = res.user;
    setSession({ id: row.id, ad: row.ad, soyad: row.soyad, telefon: row.telefon });
    alert('Giriş başarılı.');
    window.location.href = 'index.html';
  } catch (err) {
    console.error('login error:', err);
    alert('Giriş sırasında hata: ' + (err?.message || String(err)));
  }
}

export function setupLoginForm() {
  const form = qs('login-form');
  if (form) form.addEventListener('submit', handleLogin);
}

// Auto-attach if this module is loaded directly on the page
setupLoginForm();
