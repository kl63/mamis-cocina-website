import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Try Supabase Storage first
    try {
      const { data, error } = await supabase.storage
        .from('menu-pdfs')
        .download('menu.pdf')

      if (!error && data) {
        return new NextResponse(data, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="menu.pdf"',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    } catch (supabaseError) {
      console.warn('Supabase Storage failed, falling back to public folder:', supabaseError)
    }

    // Fallback to public folder
    const publicPath = join(process.cwd(), 'public', 'menu.pdf')
    
    if (existsSync(publicPath)) {
      const fileBuffer = await readFile(publicPath)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="menu.pdf"',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
  } catch (error) {
    console.error('Error serving menu PDF:', error)
    return NextResponse.json({ error: 'Failed to serve PDF' }, { status: 500 })
  }
}
