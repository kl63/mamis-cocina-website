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
  const checkAdminStatus = async (currentUser: User | null) => {
    console.log('🔍 Checking admin status for:', currentUser?.email || 'no user')
    
    if (!currentUser) {
      console.log('❌ No user, setting isAdmin to false')
      setIsAdmin(false)
      return
    }

    try {
      console.log('📡 Fetching admin status from database for user ID:', currentUser.id)
      
      // Fetch admin status from public.users table
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', currentUser.id)
        .single()
      
      console.log('📊 Database response:', { data, error })
      
      if (error) {
        console.error('❌ Error fetching admin status:', error)
        setIsAdmin(false)
        return
      }
      
      const isAdminUser = data?.is_admin || false
      
      // Debug logging
      console.log('🔐 Auth Check Result:', {
        email: currentUser.email,
        userId: currentUser.id,
        isAdmin: isAdminUser,
        rawData: data,
        decision: isAdminUser ? '✅ SETTING AS ADMIN' : '❌ SETTING AS CUSTOMER'
      })
      
      setIsAdmin(isAdminUser)
      console.log('🎯 Final admin state set to:', isAdminUser)
    } catch (error) {
      console.error('💥 Exception checking admin status:', error)
      setIsAdmin(false)
    }
  }

  // Periodic admin status refresh (every 30 seconds)
  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(() => {
      console.log('🔄 Refreshing admin status...')
      checkAdminStatus(user)
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Load user on mount and listen for auth changes
  useEffect(() => {
    let mounted = true
    
    // Get initial session with timeout
    const loadSession = async () => {
      try {
        console.log('🔄 Loading session...')
        const { data, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('❌ Session error:', error)
          setUser(null)
          await checkAdminStatus(null)
        } else if (data?.session) {
          console.log('✅ Session loaded:', data.session.user.email)
          setUser(data.session.user)
          await checkAdminStatus(data.session.user)
        } else {
          console.log('ℹ️ No active session')
          setUser(null)
          await checkAdminStatus(null)
        }
      } catch (error) {
        console.error('⚠️ Session load error:', error)
        if (!mounted) return
        setUser(null)
        await checkAdminStatus(null)
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      // Immediately check admin status after successful login
      if (data?.user) {
        console.log('✅ Login successful, checking admin status...')
        setUser(data.user)
        await checkAdminStatus(data.user)
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
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear all browser storage to prevent stale cache
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      console.log('✅ Signed out successfully')
      
      // Force full page reload to clear all state
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
