'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function FeatureDisabled() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <div className="text-center max-w-md px-4">
        <h1 className="text-4xl font-black text-white mb-4">
          Feature Disabled
        </h1>
        <p className="text-gray-400 mb-8">
          This feature is not available for Mami&apos;s Cocina.
        </p>
        <Button asChild className="bg-gradient-to-r from-red-500 to-yellow-600">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
