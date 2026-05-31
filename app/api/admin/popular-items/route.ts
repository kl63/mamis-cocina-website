import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('menu_item_id, quantity, menu_items(name, price)')
      .limit(1000)
    
    if (error) {
      console.error('❌ Error fetching popular items:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Aggregate by menu item
    const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orderItems.forEach((item: any) => {
      const itemId = item.menu_item_id
      const name = item.menu_items?.name || 'Unknown'
      const price = item.menu_items?.price || 0
      const quantity = item.quantity
      
      if (!itemStats[itemId]) {
        itemStats[itemId] = { name, quantity: 0, revenue: 0 }
      }
      itemStats[itemId].quantity += quantity
      itemStats[itemId].revenue += quantity * price
    })
    
    // Sort by quantity and limit
    const result = Object.values(itemStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error in popular items API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch popular items' },
      { status: 500 }
    )
  }
}
