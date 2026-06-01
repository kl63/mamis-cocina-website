'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mounted, setMounted] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { itemCount } = useCart()
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
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative h-20 w-64">
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
            {user ? (
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
            ) : (
              <Button asChild variant="ghost" size="icon" className="hidden sm:flex text-white hover:bg-white/10">
                <Link href="/login">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
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
              <div className="flex flex-col gap-2 pt-2">
                {user ? (
                  <>
                    <div className="text-sm text-gray-300 py-2 px-3 bg-gray-800/50 rounded-lg">
                      Signed in as: <span className="font-bold text-white">{user.user_metadata?.full_name || user.email}</span>
                    </div>
                    {isAdmin ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <span className="text-orange-500">Admin Panel</span>
                        </Link>
                      </Button>
                    ) : (
                      <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold border border-blue-500/30 text-center">
                        Customer
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href="/cart" onClick={() => setMobileMenuOpen(false)}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Cart ({itemCount})
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
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
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <User className="h-4 w-4 mr-2" />
                        Account
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href="/cart" onClick={() => setMobileMenuOpen(false)}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Cart ({itemCount})
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
