import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get the file from the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to public directory
    const publicPath = join(process.cwd(), 'public', 'menu.pdf')
    await writeFile(publicPath, buffer)

    return NextResponse.json({ 
      success: true, 
      message: 'Menu PDF uploaded successfully',
      filename: 'menu.pdf'
    })
  } catch (error) {
    console.error('Error uploading menu PDF:', error)
    return NextResponse.json({ 
      error: 'Failed to upload PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
