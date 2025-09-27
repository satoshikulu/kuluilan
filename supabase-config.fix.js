import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Minimal fixed supabase-config for debugging (do NOT commit real keys)
let _supabase = null

function readEnv() {
  const envWin = (typeof window !== 'undefined') ? window.__ENV : undefined
  const url = envWin && envWin.VITE_SUPABASE_URL ? envWin.VITE_SUPABASE_URL : ''
  const key = envWin && envWin.VITE_SUPABASE_ANON_KEY ? envWin.VITE_SUPABASE_ANON_KEY : ''
  return { url, key }
}

export function getSupabase() {
  if (_supabase) return _supabase
  const { url, key } = readEnv()
  _supabase = createClient(url, key)
  return _supabase
}

export const supabase = new Proxy({}, {
  get(_t, prop) { return getSupabase()[prop] }
})

export const getCurrentUser = async () => {
  const { data: { user } } = await getSupabase().auth.getUser()
  return user
}

export const signIn = async (email, password) => {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password })
  return { data, error }
}

export default { getSupabase, supabase, getCurrentUser, signIn }
