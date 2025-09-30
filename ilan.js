// ilan.js - Supabase tabanli ilan islemleri (tek modul)
// Bu modul yalnizca Supabase kullanir. Firebase bagimliliklari yoktur.
// Tarayici ortaminda calisir (ES Modules). supabase-client icin `supabase-config.js` kullanilir.

import { supabase, getCurrentUser, uploadImage, saveImageToDatabase } from './supabase-config.js'

// Yardimci: FormData -> ilan kaydi mapleme
function formDataToIlan(formData, userId) {
  const fiyatRaw = formData.get('fiyat')
  const fiyat = fiyatRaw ? Number(fiyatRaw) : null

  return {
    baslik: formData.get('baslik') || '',
    aciklama: formData.get('aciklama') || '',
  fiyat: Number.isFinite(fiyat) ? fiyat : 0,
  kategori: formData.get('kategori') || '',
  alt_kategori: formData.get('alt_kategori') || '',
  konum: formData.get('konum') || '',
  telefon: formData.get('telefon') || '',
  mahalle: formData.get('mahalle') || '',
    onayli: false,
    user_id: userId || null,
    created_at: new Date().toISOString()
  }
}

// Medya dosyalarini FormData'dan al
function getMediaFiles(formData) {
  // Hem 'media' hem de 'medya' anahtarlarini destekle (gecis donemi icin)
  const filesMedia = formData.getAll('media') || []
  const filesMedya = formData.getAll('medya') || []
  const files = [...filesMedia, ...filesMedya]
  // Dosya olmayanlar filtrelenir
  return files.filter(f => f && typeof f === 'object' && 'name' in f)
}

// 1) Kaydet: ilan + medya dosyalari
export async function saveData(formData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      alert('Lütfen önce giriş yapın.')
      throw new Error('Kullanici girisi gerekli')
    }

    // Form doğrulama
    const baslik = formData.get('baslik') || ''
    const fiyat = formData.get('fiyat') || ''
    const kategori = formData.get('kategori') || ''
    const telefon = formData.get('telefon') || ''
    const mahalle = formData.get('mahalle') || ''
    
    if (!baslik.trim()) {
      alert('Lütfen ilan başlığı girin.')
      return { success: false, error: 'Başlık gerekli' }
    }
    
    if (!fiyat || isNaN(fiyat) || Number(fiyat) <= 0) {
      alert('Lütfen geçerli bir fiyat girin.')
      return { success: false, error: 'Geçersiz fiyat' }
    }
    
    if (!kategori) {
      alert('Lütfen kategori seçin.')
      return { success: false, error: 'Kategori gerekli' }
    }
    
    if (!telefon || telefon.length < 10) {
      alert('Lütfen geçerli bir telefon numarası girin.')
      return { success: false, error: 'Geçersiz telefon' }
    }
    
    if (!mahalle) {
      alert('Lütfen mahalle seçin.')
      return { success: false, error: 'Mahalle gerekli' }
    }

    // Ilan kaydi olustur
    const ilanPayload = formDataToIlan(formData, user.id)

    // DEBUG: log payload to help diagnose UUID / payload issues
    console.log('DEBUG ilanPayload before insert:', ilanPayload)

    const { data: ilanInsert, error: ilanError } = await supabase
      .from('ilanlar')
      .insert([ilanPayload])
      .select()

    if (ilanError) {
  console.error('İlan kaydetme hatası:', ilanError)
  const msg = ilanError?.message || JSON.stringify(ilanError)
  alert('İlan kaydedilirken bir hata oluştu: ' + msg)
      return { success: false, error: ilanError }
    }

    const ilan = ilanInsert && ilanInsert[0]
    const ilanId = ilan?.id
    if (!ilanId) {
      const err = new Error('İlan ID alınamadı')
      console.error(err)
      alert('İlan ID alınamadı')
      return { success: false, error: err }
    }

    // Medya dosyalari
    const files = getMediaFiles(formData).slice(0, 5) // En fazla 5

    const uploadResults = []
    for (const file of files) {
      try {
        const up = await uploadImage(file, user.id, ilanId)
        if (up.error) throw up.error

        // Public URL'yi DB'ye yaz
        const publicUrl = up.data?.publicUrl
        const imageName = file.name
        const saveRes = await saveImageToDatabase(ilanId, publicUrl, imageName)
        if (saveRes.error) throw saveRes.error

        uploadResults.push({ ok: true, url: publicUrl })
      } catch (e) {
        console.error('Medya yükleme/kaydetme hatası:', e)
        uploadResults.push({ ok: false, error: e })
      }
    }

    // Basari/ozet
    const successCount = uploadResults.filter(r => r.ok).length
    const failCount = uploadResults.length - successCount

    if (failCount > 0) {
      alert(`İlan kaydedildi, fakat ${failCount} medya dosyası yüklenemedi.`)
    } else {
      alert('İlanınız başarıyla kaydedildi! Admin onayından sonra yayınlanacaktır.')
    }

    return { success: true, ilanId, uploads: uploadResults }
  } catch (error) {
    console.error('saveData genel hata:', error)
    alert('İlan kaydedilirken bir hata oluştu.')
    return { success: false, error }
  }
}

// 2) Onayli ilanlari getir
export async function getIlanlar(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('ilanlar')
      .select(`
        *,
        ilan_resimleri (resim_url, sira_no)
      `)
      .eq('onayli', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('getIlanlar hata:', error)
    alert('İlanlar alınırken bir hata oluştu.')
    return { success: false, error, data: [] }
  }
}

// 3) Kullaniciya ait ilanlar
export async function getKullaniciIlanlari() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      alert('Lütfen önce giriş yapın.')
      return { success: false, error: new Error('Kullanici yok'), data: [] }
    }

    const { data, error } = await supabase
      .from('ilanlar')
      .select(`
        *,
        ilan_resimleri (resim_url, sira_no)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('getKullaniciIlanlari hata:', error)
    alert('İlanlarınız alınırken bir hata oluştu.')
    return { success: false, error, data: [] }
  }
}

// 4) Ilan guncelle (sadece sahibi)
export async function updateIlan(ilanId, updateData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      alert('Lütfen önce giriş yapın.')
      return { success: false, error: new Error('Kullanici yok') }
    }

    const { data, error } = await supabase
      .from('ilanlar')
      .update(updateData)
      .eq('id', ilanId)
      .eq('user_id', user.id)
      .select()

    if (error) throw error
    alert('İlan başarıyla güncellendi.')
    return { success: true, data }
  } catch (error) {
    console.error('updateIlan hata:', error)
    alert('İlan güncellenirken bir hata oluştu.')
    return { success: false, error }
  }
}

// 5) Ilan sil (sadece sahibi)
export async function deleteIlan(ilanId) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      alert('Lütfen önce giriş yapın.')
      return { success: false, error: new Error('Kullanici yok') }
    }

    const { error } = await supabase
      .from('ilanlar')
      .delete()
      .eq('id', ilanId)
      .eq('user_id', user.id)

    if (error) throw error
    alert('İlan başarıyla silindi.')
    return { success: true }
  } catch (error) {
    console.error('deleteIlan hata:', error)
    alert('İlan silinirken bir hata oluştu.')
    return { success: false, error }
  }
}