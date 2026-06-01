import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: hours, error } = await supabase
      .from('restaurant_hours')
      .select('*')
      .order('day_of_week')
    
    if (error) {
      console.error('Error fetching restaurant hours:', error)
      return NextResponse.json({ hours: [] })
    }
    
    // Convert day_of_week integer to day name
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const hoursWithDayNames = hours?.map(hour => ({
      ...hour,
      day: dayNames[hour.day_of_week]
    }))
    
    return NextResponse.json({ hours: hoursWithDayNames || [] })
  } catch (error) {
    console.error('Error in restaurant-hours API:', error)
    return NextResponse.json({ hours: [] })
  }
}
