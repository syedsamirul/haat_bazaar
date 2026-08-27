import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    // 1. Verify the caller sent a valid session token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: caller },
      error: userError,
    } = await callerClient.auth.getUser()

    if (userError || !caller) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // 2. Verify that user is actually an admin (checked with the admin
    // client so it doesn't depend on RLS being correctly configured)
    const { data: adminRow } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', caller.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // 3. Validate the new vendor's data
    const body = await request.json()
    const {
      email,
      password,
      shop_name,
      instagram_handle,
      whatsapp_number,
      website_url,
      description,
      category,
    } = body

    if (!email || !password || !shop_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!instagram_handle && !whatsapp_number) {
      return NextResponse.json(
        { error: 'Provide at least an Instagram handle or WhatsApp number' },
        { status: 400 }
      )
    }

    // 4. Create the account with the email pre-confirmed — this is the bypass
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError || !newUser.user) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create account' },
        { status: 400 }
      )
    }

    // 5. Create their vendor profile
    const { error: vendorError } = await supabaseAdmin.from('vendors').insert({
      id: newUser.user.id,
      shop_name,
      instagram_handle: instagram_handle ? instagram_handle.toLowerCase() : null,
      whatsapp_number: whatsapp_number || null,
      website_url: website_url || null,
      description: description || '',
      category: category || 'other',
    })

    if (vendorError) {
      // Don't leave an orphaned auth account if the vendor row failed
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: vendorError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: newUser.user.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
