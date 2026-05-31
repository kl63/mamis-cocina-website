import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔄 Server-side fetching all menu items')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data, error } = await supabase
      .from('menu_items')
      .select('*,category:menu_categories(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Failed to fetch menu items:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Menu items fetched successfully:', data?.length || 0)
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
