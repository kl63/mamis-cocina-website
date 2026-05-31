'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  // Check if user is admin
  const checkAdminStatus = (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false)
      return
    }

    try {
      // Check user_metadata for admin role
      const role = currentUser.user_metadata?.role
      const isAdminUser = role === 'admin'
      
      // Debug logging
      console.log('🔐 Auth Check:', {
        email: currentUser.email,
        role: role || 'customer',
        isAdmin: isAdminUser
      })
      
      setIsAdmin(isAdminUser)
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    }
  }

  // Load user on mount and listen for auth changes
  useEffect(() => {
    let mounted = true
    
    // Get initial session with timeout
    const loadSession = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 3000)
        )
        
        const sessionPromise = supabase.auth.getSession()
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (!mounted) return
        
        if (result?.data?.session) {
          console.log('✅ Session loaded:', result.data.session.user.email)
          setUser(result.data.session.user)
          checkAdminStatus(result.data.session.user)
        } else {
          console.log('ℹ️ No active session')
          setUser(null)
          checkAdminStatus(null)
        }
      } catch {
        console.log('⚠️ Session load timeout, continuing as guest')
        if (!mounted) return
        setUser(null)
        checkAdminStatus(null)
      } finally {
        if (mounted) {
          console.log('🔓 Auth loading complete')
          setLoading(false)
        }
      }
    }

    loadSession()

    // Try to listen for auth state changes (non-blocking)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let subscription: any = null
    try {
      const result = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return
        console.log('🔄 Auth state changed:', _event)
        setUser(session?.user ?? null)
        checkAdminStatus(session?.user ?? null)
        setLoading(false)
      })
      subscription = result.data.subscription
    } catch {
      console.log('⚠️ Could not set up auth listener')
    }

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sign up new user
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'customer', // Default role
          },
        },
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Sign in existing user
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      console.log('🚪 Signing out...')
      
      // Clear local state immediately for instant UI feedback
      setUser(null)
      setIsAdmin(false)
      
      // Sign out from Supabase (non-blocking for UI)
      supabase.auth.signOut().catch((error) => {
        console.error('❌ Sign out error:', error)
      })
      
      console.log('✅ Signed out successfully')
      
      // Use Next.js router for faster navigation (no full page reload)
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error signing out:', error)
      // State already cleared above
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
