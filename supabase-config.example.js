import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// BU DOSYA ÖRNEKTİR. Gerçek anahtarlarınızı supabase-config.js dosyasına koyun.
// supabase-config.js GITIGNORE'a EKLENMİŞTİR ve REPOYA PUSH EDİLMEYECEKTİR.

// 1) Aşağıdaki yer tutucuları kendi proje bilgilerinizle değiştirin
// 2) Bu dosyayı KOPYALAYIP supabase-config.js adıyla kaydedin (git tarafından izlenmez)

const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co'
const supabaseKey = 'YOUR_PUBLIC_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)

// İsteğe bağlı yardımcılar (örnek olarak bırakıldı)
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
