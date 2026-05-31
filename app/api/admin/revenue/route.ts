import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7', 10)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching revenue data:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Group by date
    const revenueByDate: Record<string, number> = {}
    orders.forEach((order: { created_at: string; total_amount: string }) => {
      const date = new Date(order.created_at).toLocaleDateString()
      revenueByDate[date] = (revenueByDate[date] || 0) + parseFloat(order.total_amount)
    })
    
    const result = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue
    }))
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error in revenue API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
}
