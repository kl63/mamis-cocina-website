import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Payment processing is disabled for Mami\'s Cocina' },
    { status: 403 }
  )
}
