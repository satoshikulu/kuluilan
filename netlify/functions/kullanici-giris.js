const { createClient } = require('@supabase/supabase-js')

// A minimal endpoint to accept legacy login from login.html and respond with user info.
// Use server-side Supabase anon key or service role key depending on desired behavior.

exports.handler = async function (event, context) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Server not configured' }) }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method not allowed' }) }

    const payload = JSON.parse(event.body || '{}')
    const { telefon, ad_soyad } = payload

    // Very small example: try to find profile by telefon, fallback create
    const { data: profiles, error } = await supabase.from('kullanici_profilleri').select('*').eq('telefon', telefon).limit(1)
    if (error) throw error

    if (profiles && profiles.length > 0) {
      return { statusCode: 200, body: JSON.stringify({ success: true, user: profiles[0] }) }
    }

    // Create profile stub
    const { data, error: insertErr } = await supabase.from('kullanici_profilleri').insert({ ad_soyad, telefon }).select()
    if (insertErr) throw insertErr

    return { statusCode: 200, body: JSON.stringify({ success: true, user: data[0] }) }
  } catch (error) {
    console.error('kullanici-giris error', error)
    return { statusCode: 500, body: JSON.stringify({ success: false, message: error.message }) }
  }
}
