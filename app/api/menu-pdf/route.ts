import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Download the PDF from Supabase Storage
    const { data, error } = await supabase.storage
      .from('menu-pdfs')
      .download('menu.pdf')

    if (error) {
      console.error('Error downloading menu PDF:', error)
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    // Return the PDF with proper headers
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="menu.pdf"',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving menu PDF:', error)
    return NextResponse.json({ error: 'Failed to serve PDF' }, { status: 500 })
  }
}
