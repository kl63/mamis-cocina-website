import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at')
      .limit(1000)
    
    if (error) {
      console.error('❌ Error fetching peak hours:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Aggregate by hour
    const hourStats: Record<number, number> = {}
    orders.forEach((order: { created_at: string }) => {
      const hour = new Date(order.created_at).getHours()
      hourStats[hour] = (hourStats[hour] || 0) + 1
    })
    
    // Convert to array and sort by hour
    const result = Object.entries(hourStats)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        time: `${parseInt(hour)}:00`
      }))
      .sort((a, b) => a.hour - b.hour)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error in peak hours API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch peak hours' },
      { status: 500 }
    )
  }
}
