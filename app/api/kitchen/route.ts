import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'This feature is disabled for Mami&apos;s Cocina' },
    { status: 403 }
  )
}

export async function POST() {
  return NextResponse.json(
    { error: 'This feature is disabled for Mami&apos;s Cocina' },
    { status: 403 }
  )
}
