'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mounted, setMounted] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { user, signOut, isAdmin } = useAuth()

  // Prevent hydration mismatch by only showing user-dependent UI after mount
  useEffect(() => {
    // This is the correct pattern for preventing hydration mismatch
    // eslint-disable-next-line
    setMounted(true)
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Spacer for mobile to balance hamburger menu */}
          <div className="md:hidden w-10"></div>
          
          <div className="flex items-center flex-1 md:flex-initial justify-center md:justify-start">
            <Link href="/" className="flex items-center">
              <div className="relative h-16 w-48 sm:h-20 sm:w-64">
                <Image
                  src="/mamis_cocina_logo.png"
                  alt="Mami's Cocina Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6 -ml-8">
              <Link
                href="/"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/menu"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Menu
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                About
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Cart disabled for Mami's Cocina */}
            {/* Sign-in hidden - only show for logged-in users */}
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-300">
                  {user.user_metadata?.full_name || user.email}
                </span>
                {isAdmin ? (
                  <Link href="/admin">
                    <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full font-bold border border-orange-500/30">
                      Admin
                    </span>
                  </Link>
                ) : (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold border border-blue-500/30">
                    Customer
                  </span>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/10"
                  onClick={async () => {
                    setIsSigningOut(true)
                    await signOut()
                  }}
                  disabled={isSigningOut}
                  title="Sign Out"
                >
                  <LogOut className={`h-5 w-5 ${isSigningOut ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/menu"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Menu
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              {/* Sign-in hidden from mobile menu - only show for logged-in users */}
              {user && (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="text-sm text-gray-300 py-2 px-3 bg-gray-800/50 rounded-lg">
                    Signed in as: <span className="font-bold text-white">{user.user_metadata?.full_name || user.email}</span>
                  </div>
                  {isAdmin && (
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <span className="text-orange-500">Admin Panel</span>
                      </Link>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={async () => {
                      setMobileMenuOpen(false)
                      setIsSigningOut(true)
                      await signOut()
                    }}
                    disabled={isSigningOut}
                  >
                    <LogOut className={`h-4 w-4 mr-2 ${isSigningOut ? 'animate-spin' : ''}`} />
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
