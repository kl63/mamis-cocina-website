import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

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

    // Try Supabase Storage first
    try {
      const { error: uploadError } = await supabase.storage
        .from('menu-pdfs')
        .upload('menu.pdf', buffer, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        console.error('Error details:', JSON.stringify(uploadError, null, 2))
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-pdfs')
        .getPublicUrl('menu.pdf')

      return NextResponse.json({ 
        success: true, 
        message: 'Menu PDF uploaded successfully to Supabase Storage',
        filename: 'menu.pdf',
        url: publicUrl,
        storage: 'supabase'
      })
    } catch (supabaseError) {
      console.warn('Supabase Storage failed, falling back to public folder:', supabaseError)
      
      // Fallback to public folder (works locally)
      try {
        const publicPath = join(process.cwd(), 'public', 'menu.pdf')
        await writeFile(publicPath, buffer)
        
        return NextResponse.json({ 
          success: true, 
          message: 'Menu PDF uploaded successfully to public folder',
          filename: 'menu.pdf',
          url: '/menu.pdf',
          storage: 'public',
          warning: 'Using public folder fallback (Supabase Storage unavailable)'
        })
      } catch (fsError) {
        console.error('File system fallback also failed:', fsError)
        return NextResponse.json({ 
          error: 'Failed to upload PDF',
          details: 'Both Supabase Storage and file system failed',
          supabaseError: supabaseError instanceof Error ? supabaseError.message : 'Unknown',
          fsError: fsError instanceof Error ? fsError.message : 'Unknown'
        }, { status: 500 })
      }
    }
  } catch (error) {
    console.error('Error uploading menu PDF:', error)
    return NextResponse.json({ 
      error: 'Failed to upload PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
