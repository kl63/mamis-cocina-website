import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for server-side operations (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, newStatus } = body

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'Missing orderId or newStatus' }, { status: 400 })
    }

    console.log('🔄 Server-side updating order status:', orderId, 'to', newStatus)

    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()

    if (error) {
      console.error('❌ Failed to update status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Status updated successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
