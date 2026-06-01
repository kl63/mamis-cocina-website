'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { CartItem, MenuItem } from '@/types'
import { createClient } from '@/lib/supabase/client'
import * as cartDb from '@/lib/supabase/cart'

interface CartContextType {
  cart: CartItem[]
  itemCount: number
  subtotal: number
  tax: number
  total: number
  isOpen: boolean
  loading: boolean
  addToCart: (item: MenuItem, quantity: number, customizations: Record<string, string>, selectedToppings: string[], selectedSauces: string[], itemPrice: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const TAX_RATE = 0.08 // 8% tax rate

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Load user and cart on mount
  useEffect(() => {
    async function loadCart() {
      // Cart disabled for Mami's Cocina - skip loading
      console.log('🚫 Cart loading disabled')
      setCart([])
      setLoading(false)
      return
      
      /* Original cart loading code disabled
      try {
        // Check if user is authenticated with timeout
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('User fetch timeout')), 3000)
        )
        
        const userPromise = supabase.auth.getUser()
        
        let currentUserId: string | undefined = undefined
        
        try {
          const result = await Promise.race([userPromise, timeoutPromise])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentUserId = (result as any)?.data?.user?.id
        } catch {
          console.log('⚠️ User fetch timeout, treating as guest')
          currentUserId = undefined
        }

        setUserId(currentUserId)

        // Load cart from database
        const cartItems = await cartDb.getUserCart(currentUserId)
        setCart(cartItems)
        
        console.log('✅ Cart loaded successfully:', cartItems.length, 'items', currentUserId ? '(user)' : '(guest)')
      } catch (error) {
        console.error('❌ Error loading cart:', error)
        console.error('💡 Make sure you have run the migration: 007_create_cart_tables.sql')
        // Don't crash the app, just use empty cart
        setCart([])
      } finally {
        setLoading(false)
      }
      */
    }

    loadCart()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id

      if (event === 'SIGNED_IN' && newUserId) {
        // Cart feature disabled for Mami's Cocina - no migration needed
        setUserId(newUserId)
      } else if (event === 'SIGNED_OUT') {
        // User logged out - switch to guest cart
        setUserId(undefined)
        const cartItems = await cartDb.getUserCart(undefined)
        setCart(cartItems)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Calculate totals
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + item.totalPrice, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax

  const addToCart = async (
    menuItem: MenuItem,
    quantity: number,
    customizations: Record<string, string>,
    selectedToppings: string[],
    selectedSauces: string[],
    itemPrice: number
  ) => {
    // Cart functionality disabled for Mami's Cocina
    console.log('🚫 Add to cart disabled:', menuItem.name)
    alert('Online ordering is currently disabled. Please call us to place an order!')
    return
    
    /* Original cart code disabled
    try {
      console.log('🛒 Adding to cart:', {
        item: menuItem.name,
        quantity,
        userId: userId || 'guest',
        price: itemPrice
      })
      
      const newItem = await cartDb.addCartItem(
        menuItem,
        quantity,
        customizations,
        selectedToppings,
        selectedSauces,
        itemPrice,
        userId
      )

      console.log('✅ Item added to cart:', newItem)

      if (newItem) {
        // Reload cart from database
        console.log('🔄 Reloading cart...')
        const cartItems = await cartDb.getUserCart(userId)
        console.log('✅ Cart reloaded:', cartItems.length, 'items')
        setCart(cartItems)

        // Open cart drawer
        setIsOpen(true)
      } else {
        console.error('❌ addCartItem returned null/undefined')
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error)
    }
    */
  }

  const removeFromCart = async (itemId: string) => {
    try {
      const success = await cartDb.removeCartItem(itemId)
      
      if (success) {
        // Reload cart from database
        const cartItems = await cartDb.getUserCart(userId)
        setCart(cartItems)
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await cartDb.updateCartItemQuantity(itemId, quantity)
      
      // Reload cart from database
      const cartItems = await cartDb.getUserCart(userId)
      setCart(cartItems)
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const clearCart = async () => {
    try {
      const success = await cartDb.clearCart(userId)
      
      if (success) {
        setCart([])
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }

  const toggleCart = () => setIsOpen(!isOpen)
  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        subtotal,
        tax,
        total,
        isOpen,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
