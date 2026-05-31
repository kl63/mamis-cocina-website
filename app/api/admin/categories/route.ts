import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    console.log('🔄 Server-side fetching all categories')
    
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('❌ Failed to fetch categories:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Categories fetched successfully:', data?.length || 0)
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
