import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Get all restaurant hours
export async function GET() {
  try {
    console.log('🕐 Fetching restaurant hours from database...')
    
    // Use direct fetch with anon key since RLS allows public reads
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/restaurant_hours?select=*&order=day_of_week.asc`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Fetch error:', response.status, errorText)
      return NextResponse.json({ 
        error: 'Failed to fetch hours', 
        details: `HTTP ${response.status}: ${errorText}`
      }, { status: 500 })
    }

    const hours = await response.json()
    console.log('📊 Hours fetched:', hours)

    if (!Array.isArray(hours)) {
      console.error('❌ Invalid hours data returned:', hours)
      return NextResponse.json({ 
        error: 'Invalid data format',
        hours: []
      }, { status: 500 })
    }

    console.log('✅ Returning', hours.length, 'days')
    return NextResponse.json({ hours })
  } catch (error) {
    console.error('❌ Error in GET restaurant-hours:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Update restaurant hours
export async function PUT(request: Request) {
  try {
    const { dayOfWeek, openTime, closeTime, isClosed } = await request.json()

    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: 'Invalid day of week' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user is admin
    console.log('🔐 Checking admin access...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('👤 User:', user?.id, 'Error:', userError)
    
    if (!user) {
      console.error('❌ No user found')
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    console.log('📋 Fetching user role for:', user.id)
    
    // Get the session token for authenticated requests
    const { data: { session } } = await supabase.auth.getSession()
    console.log('🔑 Session:', session ? 'Found' : 'Not found')
    
    if (!session?.access_token) {
      console.error('❌ No session token')
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }
    
    // Use direct fetch with authenticated token
    const roleResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=is_admin&id=eq.${user.id}`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
        }
      }
    )

    const userData = await roleResponse.json()
    console.log('👮 User admin data:', userData)

    if (!Array.isArray(userData) || userData.length === 0 || !userData[0].is_admin) {
      console.error('❌ Not admin:', userData)
      return NextResponse.json({ 
        error: 'Forbidden - Admin only', 
        details: `User is_admin: ${userData[0]?.is_admin || 'not found'}` 
      }, { status: 403 })
    }

    console.log('✅ Admin verified:', userData[0].is_admin)

    // Update hours
    const { error } = await supabase
      .from('restaurant_hours')
      .update({
        open_time: openTime,
        close_time: closeTime,
        is_closed: isClosed
      })
      .eq('day_of_week', dayOfWeek)

    if (error) {
      console.error('Failed to update hours:', error)
      return NextResponse.json({ error: 'Failed to update hours' }, { status: 500 })
    }

    console.log('✅ Updated hours for day', dayOfWeek)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT restaurant-hours:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
