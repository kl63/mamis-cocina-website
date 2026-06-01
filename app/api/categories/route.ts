import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: categories, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ categories: [] })
    }
    
    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error('Error in categories API:', error)
    return NextResponse.json({ categories: [] })
  }
}
