const { createClient } = require('@supabase/supabase-js')

// This function provides admin operations using SUPABASE_SERVICE_ROLE_KEY
// Environment variables required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

exports.handler = async function (event, context) {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server not configured with SUPABASE credentials' })
    }
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const { httpMethod } = event
    const qs = event.queryStringParameters || {}

    if (httpMethod === 'GET') {
      // list users (with pagination support)
      const { data, error } = await supabase.auth.admin.listUsers()
      if (error) throw error
      return {
        statusCode: 200,
        body: JSON.stringify({ users: data.users })
      }
    }

    if (httpMethod === 'DELETE') {
      const { userId } = qs
      if (!userId) return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) }
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error
      return { statusCode: 200, body: JSON.stringify({ success: true }) }
    }

    if (httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { action, userId, isAdmin, aktif } = body
      if (action === 'toggleAdmin') {
        // Update custom profile table is_admin field
        const { error } = await supabase.from('kullanici_profilleri').update({ is_admin: !!isAdmin }).eq('id', userId)
        if (error) throw error
        return { statusCode: 200, body: JSON.stringify({ success: true }) }
      }
      if (action === 'toggleActive') {
        const { error } = await supabase.from('kullanici_profilleri').update({ aktif: !!aktif }).eq('id', userId)
        if (error) throw error
        return { statusCode: 200, body: JSON.stringify({ success: true }) }
      }
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  } catch (error) {
    console.error('admin-users error', error)
    return { statusCode: 500, body: JSON.stringify({ error: error.message || String(error) }) }
  }
}
