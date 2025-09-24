import { supabase, getCurrentUser, uploadMultipleImages, saveImageToDatabase } from './supabase-config.js';

// İlan verilerini Supabase'e kaydetme fonksiyonu
export async function saveData(formData) {
    try {
        // Kullanıcının oturum açmış olup olmadığını kontrol et
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('Lütfen önce giriş yapın.');
        }

        // FormData'dan veri objesi oluştur
        const ilanData = {
            user_id: user.id,
            baslik: formData.get('baslik'),
            aciklama: formData.get('aciklama'),
            fiyat: parseInt(formData.get('fiyat').replace(/\D/g, ''), 10),
            telefon: formData.get('telefon'),
            mahalle: formData.get('mahalle'),
            kategori: formData.get('kategori'),
            alt_kategori: formData.get('alt_kategori'),
            konum: formData.get('mahalle'),
            metrekare: formData.get('metrekare') ? parseInt(formData.get('metrekare')) : null,
            oda_sayisi: formData.get('oda_sayisi'),
            isitma_tipi: formData.get('isitma_tipi'),
            bina_yasi: formData.get('bina_yasi') ? parseInt(formData.get('bina_yasi')) : null,
            kat: formData.get('kat'),
            aidat: formData.get('aidat') ? parseInt(formData.get('aidat')) : null,
            depozito: formData.get('depozito') ? parseInt(formData.get('depozito')) : null,
            esya_durumu: formData.get('esya_durumu'),
            imar_durumu: formData.get('imar_durumu'),
            tapu_durumu: formData.get('tapu_durumu'),
            created_at: new Date().toISOString(),
            onayli: false
        };

        // Supabase'e İlan verisini kaydet
        const { data, error } = await supabase
            .from('ilanlar')
            .insert([ilanData])
            .select();

        if (error) {
            throw error;
        }

        const savedIlan = data[0];
        console.log('İlan başarıyla kaydedildi:', savedIlan);

        // Resim dosyaları varsa yükle
        const resimFiles = formData.getAll('medya').filter(file => file && file.size > 0);
        if (resimFiles.length > 0) {
            console.log('Resimler yüklenmeye başlanıyor...', resimFiles.length, 'adet');
            
            try {
                const uploadResult = await uploadMultipleImages(resimFiles, user.id, savedIlan.id);
                
                if (uploadResult.successful && uploadResult.successful.length > 0) {
                    // Başarılı yüklenen resimleri database'e kaydet
                    for (let i = 0; i < uploadResult.successful.length; i++) {
                        const upload = uploadResult.successful[i];
                        const resim = resimFiles[i];
                        
                        await saveImageToDatabase(
                            savedIlan.id,
                            upload.data.publicUrl,
                            resim.name,
                            i + 1
                        );
                    }
                    
                    console.log(`${uploadResult.successCount}/${uploadResult.totalCount} resim başarıyla yüklendi.`);
                }
                
                if (uploadResult.failed && uploadResult.failed.length > 0) {
                    console.warn(`${uploadResult.failedCount} resim yüklenemedi:`, uploadResult.failed);
                }
            } catch (uploadError) {
                console.error('Resim yükleme hatası:', uploadError);
                // Resim yükleme hatası olsa bile ilanı kaydetmiş olduğumuz için devam edelim
            }
        }

        return savedIlan;

    } catch (error) {
        console.error('İlan kaydetme hatası:', error);
        throw error;
    }
}

// Tüm ilanları getirme fonksiyonu (resimlerle birlikte)
export async function getIlanlar() {
    try {
        const { data, error } = await supabase
            .from('ilanlar')
            .select(`
                *,
                ilan_resimleri (
                    id,
                    resim_url,
                    resim_adi,
                    sira_no
                ),
                kullanici_profilleri (
                    ad_soyad,
                    telefon
                )
            `)
            .eq('onayli', true)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('İlanları getirme hatası:', error);
        throw error;
    }
}

// Kullanıcının ilanlarını getirme fonksiyonu (resimlerle birlikte)
export async function getKullaniciIlanlari() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('Kullanıcı girişi yapılmamış.');
        }

        const { data, error } = await supabase
            .from('ilanlar')
            .select(`
                *,
                ilan_resimleri (
                    id,
                    resim_url,
                    resim_adi,
                    sira_no
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Kullanıcı ilanlarını getirme hatası:', error);
        throw error;
    }
}

// İlan silme fonksiyonu
export async function deleteIlan(ilanId) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('Kullanıcı girişi yapılmamış.');
        }

        // Önce ilanın kullanıcıya ait olup olmadığını kontrol et
        const { data: ilan, error: checkError } = await supabase
            .from('ilanlar')
            .select('user_id')
            .eq('id', ilanId)
            .single();

        if (checkError) {
            throw checkError;
        }

        if (ilan.user_id !== user.id) {
            throw new Error('Bu ilanı silme yetkiniz yok.');
        }

        // İlanı sil (RLS politikası sayesinde CASCADE ile resimler de silinecek)
        const { error } = await supabase
            .from('ilanlar')
            .delete()
            .eq('id', ilanId);

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('İlan silme hatası:', error);
        throw error;
    }
}

// İlan güncelleme fonksiyonu
export async function updateIlan(ilanId, updateData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('Kullanıcı girişi yapılmamış.');
        }

        const { data, error } = await supabase
            .from('ilanlar')
            .update(updateData)
            .eq('id', ilanId)
            .eq('user_id', user.id)
            .select();

        if (error) {
            throw error;
        }

        return data[0];
    } catch (error) {
        console.error('İlan güncelleme hatası:', error);
        throw error;
    }
} 


/**
 * Fetches all listings from Firestore and displays them in the ilanListesi div
 * @returns {Promise<Array>} Array of listing objects
 */
async function getIlanlar() {
    try {
        const querySnapshot = await getDocs(collection(db, "ilanlar"));
        const ilanlar = [];

        querySnapshot.forEach((doc) => {
            ilanlar.push({ id: doc.id, ...doc.data() });
        });

        // HTML'e yazdır
        const ilanListesi = document.getElementById("ilanListesi");
        ilanListesi.innerHTML = ""; // Önceki verileri temizle

        // Add some basic styling to the container
        ilanListesi.style.display = "grid";
        ilanListesi.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
        ilanListesi.style.gap = "20px";
        ilanListesi.style.padding = "20px";

        ilanlar.forEach((ilan) => {
            const div = document.createElement("div");
            div.className = "ilan-card";
            div.style.background = "white";
            div.style.borderRadius = "10px";
            div.style.padding = "20px";
            div.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            div.style.transition = "transform 0.2s ease-in-out";
            
            div.onmouseover = () => div.style.transform = "translateY(-5px)";
            div.onmouseout = () => div.style.transform = "translateY(0)";

            div.innerHTML = `
                <h3 style="margin-bottom: 15px; color: #2c3e50; font-size: 1.4rem;">${ilan.baslik || 'Başlık Yok'}</h3>
                <p style="color: #e74c3c; font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">
                    ${ilan.fiyat ? ilan.fiyat.toLocaleString() + ' TL' : 'Fiyat Belirtilmemiş'}
                </p>
                <p style="color: #7f8c8d; margin-bottom: 8px;">
                    <i class="fas fa-map-marker-alt" style="margin-right: 5px;"></i>
                    ${ilan.konum || 'Konum Belirtilmemiş'}
                </p>
                <p style="color: #7f8c8d; margin-bottom: 8px;">
                    <i class="fas fa-phone" style="margin-right: 5px;"></i>
                    ${ilan.telefon || 'Telefon Belirtilmemiş'}
                </p>
                ${ilan.aciklama ? `<p style="color: #34495e; margin-top: 15px; font-size: 0.9rem;">${ilan.aciklama}</p>` : ''}
                <hr style="margin: 15px 0; border-color: #ecf0f1;">
            `;
            
            ilanListesi.appendChild(div);
        });

        return ilanlar;
    } catch (error) {
        console.error("İlanlar getirilirken hata oluştu:", error);
        const ilanListesi = document.getElementById("ilanListesi");
        ilanListesi.innerHTML = `
            <div style="color: #e74c3c; text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>İlanlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
            </div>
        `;
        return [];
    }
}

/**
 * Saves a new listing to Firestore with user UID
 * @param {Object} formData - Form data containing listing details
 * @returns {Promise<Object>} The saved listing data with document ID
 */
async function saveData(formData = null) {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
        alert("Lütfen önce giriş yapın.");
        return null;
    }

    try {
        // If formData is provided, use it; otherwise use default data
        const ilan = formData ? {
            uid: user.uid,
            baslik: formData.get('baslik'),
            fiyat: Number(formData.get('fiyat')),
            konum: `${formData.get('ilce') || ''} ${formData.get('mahalle') || ''}`.trim(),
            telefon: formData.get('telefon'),
            aciklama: formData.get('aciklama'),
            kategori: formData.get('kategori'),
            alt_kategori: formData.get('alt_kategori'),
            metrekare: formData.get('metrekare') ? Number(formData.get('metrekare')) : null,
            oda_sayisi: formData.get('oda_sayisi'),
            isitma_tipi: formData.get('isitma_tipi'),
            bina_yasi: formData.get('bina_yasi') ? Number(formData.get('bina_yasi')) : null,
            kat: formData.get('kat'),
            aidat: formData.get('aidat') ? Number(formData.get('aidat')) : null,
            depozito: formData.get('depozito') ? Number(formData.get('depozito')) : null,
            esya_durumu: formData.get('esya_durumu'),
            imar_durumu: formData.get('imar_durumu'),
            tapu_durumu: formData.get('tapu_durumu'),
            kaks: formData.get('kaks') ? Number(formData.get('kaks')) : null,
            yaklasma_mesafesi: formData.get('yaklasma_mesafesi') ? Number(formData.get('yaklasma_mesafesi')) : null,
            yol_genisligi: formData.get('yol_genisligi') ? Number(formData.get('yol_genisligi')) : null,
            arsa_ozellikleri: formData.getAll('arsa_ozellikleri'),
            media: formData.get('media') ? formData.get('media').name : null,
            tarih: new Date().toISOString(),
            onayli: false // Yeni ilanlar varsayılan olarak onaysız
        } : {
            uid: user.uid,
            baslik: "Satılık Daire",
            fiyat: 250000,
            konum: "Konya/Kulu",
            telefon: "0555 123 45 67",
            tarih: new Date().toISOString(),
            onayli: false
        };

        // Add the document to Firestore
        const docRef = await addDoc(collection(db, "ilanlar"), ilan);
        console.log("İlan başarıyla kaydedildi, ID:", docRef.id);

        // Return the saved data with the document ID
        return { id: docRef.id, ...ilan };
    } catch (error) {
        console.error("İlan kaydedilirken hata oluştu:", error);
        throw error; // Re-throw the error for handling in the calling function
    }
}

// Export the functions
export { getIlanlar, saveData };

import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "./firebase-config.js";

/**
 * Fetches and displays listings belonging to the current user
 * @returns {Promise<Array>} Array of user's listings
 */
async function getKullaniciIlanlari() {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
        alert("Lütfen önce giriş yapın.");
        return [];
    }

    try {
        const ilanlarRef = collection(db, "ilanlar");
        const q = query(ilanlarRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const kullaniciIlanlari = [];
        querySnapshot.forEach((doc) => {
            kullaniciIlanlari.push({ id: doc.id, ...doc.data() });
        });

        // HTML'e yazdır
        const ilanListesi = document.getElementById("ilanListesi");
        ilanListesi.innerHTML = ""; // Önceki verileri temizle

        // Add some basic styling to the container
        ilanListesi.style.display = "grid";
        ilanListesi.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
        ilanListesi.style.gap = "20px";
        ilanListesi.style.padding = "20px";

        if (kullaniciIlanlari.length === 0) {
            ilanListesi.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <i class="fas fa-info-circle" style="font-size: 2rem; color: #3498db; margin-bottom: 15px;"></i>
                    <h3 style="color: #2c3e50; margin-bottom: 10px;">Henüz İlanınız Bulunmuyor</h3>
                    <p style="color: #7f8c8d;">İlan vermek için "İlan Ver" butonunu kullanabilirsiniz.</p>
                    <button onclick="showIlanEkle()" class="btn btn-primary mt-3">
                        <i class="fas fa-plus-circle me-1"></i>İlan Ver
                    </button>
                </div>
            `;
            return [];
        }

        kullaniciIlanlari.forEach((ilan) => {
            const div = document.createElement("div");
            div.className = "ilan-card";
            div.style.background = "white";
            div.style.borderRadius = "10px";
            div.style.padding = "20px";
            div.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            div.style.transition = "transform 0.2s ease-in-out";
            div.style.position = "relative";
            
            div.onmouseover = () => div.style.transform = "translateY(-5px)";
            div.onmouseout = () => div.style.transform = "translateY(0)";

            // Onay durumu badge'i
            const onayBadge = ilan.onayli 
                ? '<span style="position: absolute; top: 10px; right: 10px; background: #2ecc71; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;"><i class="fas fa-check-circle me-1"></i>Onaylı</span>'
                : '<span style="position: absolute; top: 10px; right: 10px; background: #f1c40f; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;"><i class="fas fa-clock me-1"></i>Onay Bekliyor</span>';

            div.innerHTML = `
                ${onayBadge}
                <h3 style="margin-bottom: 15px; color: #2c3e50; font-size: 1.4rem; padding-right: 80px;">${ilan.baslik || 'Başlık Yok'}</h3>
                <p style="color: #e74c3c; font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">
                    ${ilan.fiyat ? ilan.fiyat.toLocaleString() + ' TL' : 'Fiyat Belirtilmemiş'}
                </p>
                <p style="color: #7f8c8d; margin-bottom: 8px;">
                    <i class="fas fa-map-marker-alt" style="margin-right: 5px;"></i>
                    ${ilan.konum || 'Konum Belirtilmemiş'}
                </p>
                <p style="color: #7f8c8d; margin-bottom: 8px;">
                    <i class="fas fa-phone" style="margin-right: 5px;"></i>
                    ${ilan.telefon || 'Telefon Belirtilmemiş'}
                </p>
                ${ilan.aciklama ? `<p style="color: #34495e; margin-top: 15px; font-size: 0.9rem;">${ilan.aciklama}</p>` : ''}
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button onclick="duzenleIlan('${ilan.id}')" class="btn btn-sm btn-primary">
                        <i class="fas fa-edit me-1"></i>Düzenle
                    </button>
                    <button onclick="silIlan('${ilan.id}')" class="btn btn-sm btn-danger">
                        <i class="fas fa-trash me-1"></i>Sil
                    </button>
                </div>
                <hr style="margin: 15px 0; border-color: #ecf0f1;">
            `;
            
            ilanListesi.appendChild(div);
        });

        return kullaniciIlanlari;
    } catch (error) {
        console.error("Kullanıcı ilanları getirilirken hata oluştu:", error);
        const ilanListesi = document.getElementById("ilanListesi");
        ilanListesi.innerHTML = `
            <div style="grid-column: 1 / -1; color: #e74c3c; text-align: center; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>İlanlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
            </div>
        `;
        return [];
    }
}

// İlan düzenleme fonksiyonu (placeholder)
function duzenleIlan(ilanId) {
    alert('İlan düzenleme özelliği yakında eklenecektir.');
}

// İlan silme fonksiyonu (placeholder)
async function silIlan(ilanId) {
    if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) {
        return;
    }
    alert('İlan silme özelliği yakında eklenecektir.');
}

// Export the functions
export { getIlanlar, saveData, getKullaniciIlanlari };
