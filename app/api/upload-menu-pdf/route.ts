import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import busboy from 'busboy'
import { Readable } from 'stream'

// Configure route to accept larger payloads
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds max execution time
export const dynamic = 'force-dynamic' // Disable static optimization
// Note: Next.js has a 10MB body limit that cannot be increased in App Router
// For files larger than 10MB, consider using direct Supabase upload from client

export async function POST(request: NextRequest) {
  try {
    console.log('📤 PDF Upload request received')
    console.log('Content-Type:', request.headers.get('content-type'))
    
    // Check if user is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.email)

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      console.log('❌ User is not admin')
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    console.log('✅ Admin verified, parsing multipart data...')

    // Parse multipart form data using busboy
    const contentType = request.headers.get('content-type') || ''
    
    return new Promise<NextResponse>(async (resolve) => {
      const bb = busboy({ 
        headers: { 'content-type': contentType },
        limits: {
          fileSize: 15 * 1024 * 1024 // 15MB limit
        }
      })

      let fileBuffer: Buffer | null = null
      let fileName = ''
      let fileSize = 0

      bb.on('file', (name, file, info) => {
        console.log(`📁 Receiving file: ${info.filename}`)
        fileName = info.filename
        const chunks: Buffer[] = []

        file.on('data', (data: Buffer) => {
          chunks.push(data)
          fileSize += data.length
        })

        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks)
          console.log(`✅ File received: ${fileName} (${fileSize} bytes)`)
        })

        file.on('limit', () => {
          console.log('❌ File size limit exceeded')
          resolve(NextResponse.json({ 
            error: 'File size must be less than 15MB' 
          }, { status: 400 }))
        })
      })

      bb.on('finish', async () => {
        if (!fileBuffer) {
          resolve(NextResponse.json({ error: 'No file provided' }, { status: 400 }))
          return
        }

        console.log('📤 Uploading to Supabase...')
        const buffer = fileBuffer

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('menu-pdfs')
          .upload('menu.pdf', buffer, {
            contentType: 'application/pdf',
            upsert: true
          })

        if (uploadError) {
          console.error('Supabase upload error:', uploadError)
          console.error('Error details:', JSON.stringify(uploadError, null, 2))
          resolve(NextResponse.json({ 
            error: 'Failed to upload to Supabase Storage',
            details: uploadError.message,
            fullError: uploadError
          }, { status: 500 }))
          return
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('menu-pdfs')
          .getPublicUrl('menu.pdf')

        console.log('✅ PDF uploaded successfully:', publicUrl)
        resolve(NextResponse.json({ 
          success: true, 
          message: 'Menu PDF uploaded successfully',
          filename: 'menu.pdf',
          url: publicUrl
        }))
      })

      bb.on('error', (error: Error) => {
        console.error('❌ Busboy error:', error)
        resolve(NextResponse.json({ 
          error: 'Failed to parse upload',
          details: error.message
        }, { status: 400 }))
      })

      // Convert request body to stream and pipe to busboy
      // Use body property directly to avoid 10MB limit
      if (request.body) {
        const reader = request.body.getReader()
        const stream = new Readable({
          async read() {
            const { done, value } = await reader.read()
            if (done) {
              this.push(null)
            } else {
              this.push(Buffer.from(value))
            }
          }
        })
        stream.pipe(bb)
      } else {
        resolve(NextResponse.json({ error: 'No request body' }, { status: 400 }))
      }
    })
  } catch (error) {
    console.error('Error uploading menu PDF:', error)
    return NextResponse.json({ 
      error: 'Failed to upload PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
