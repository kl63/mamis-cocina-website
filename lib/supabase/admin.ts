/**
 * Admin database operations
 * Functions for managing menu items, users, and stats
 */

import { createClient } from '@/lib/supabase/client'
import type { MenuItem, MenuCategory } from '@/types'

const supabase = createClient()

// Global token cache - set by admin page on load
let cachedToken: string | null = null

export function setAdminToken(token: string | null) {
  cachedToken = token
  console.log('🔐 Admin token cached:', token ? 'Yes' : 'No')
}

// Helper to get session token from storage (faster than calling getSession)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    // Supabase stores auth in localStorage with pattern: sb-<project-ref>-auth-token
    // Try multiple possible keys
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]
    
    const possibleKeys = [
      `sb-${projectRef}-auth-token`,
      `supabase.auth.token`,
      `sb-auth-token`,
    ]
    
    // Try exact keys first
    for (const key of possibleKeys) {
      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Supabase stores it in different formats
          const token = parsed?.access_token || 
                       parsed?.currentSession?.access_token ||
                       parsed?.session?.access_token ||
                       parsed?.data?.session?.access_token
          if (token) {
            console.log('✅ Found session token at key:', key)
            return token
          }
        } catch {
          // Not JSON or wrong format
        }
      }
    }
    
    // Fallback: search all localStorage keys
    console.log('🔍 Searching all localStorage keys...')
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      
      console.log('  Checking key:', key)
      
      // Look for any key containing 'sb-' or 'supabase'
      if (key.includes('sb-') || key.includes('supabase')) {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            const parsed = JSON.parse(value)
            // Look for access_token anywhere in the object
            const token = parsed?.access_token || 
                         parsed?.currentSession?.access_token ||
                         parsed?.session?.access_token ||
                         parsed?.data?.session?.access_token
            
            if (token && typeof token === 'string') {
              console.log('✅ Found session token in key:', key)
              return token
            }
          } catch {
            // Not JSON
          }
        }
      }
    }
    
    console.log('❌ No session token found in localStorage')
  } catch {
    console.log('⚠️ Error reading from localStorage')
  }
  
  return null
}

// Helper to get headers with auth token
// Priority: cachedToken > providedToken (NO localStorage fallback - those tokens are expired!)
function getAuthHeaders(providedToken?: string | null) {
  const token = cachedToken || providedToken
  
  const headers: Record<string, string> = {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    console.log('🔑 Using fresh admin session token')
  } else {
    headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    console.log('🔓 No fresh token - using anonymous key')
  }
  
  return headers
}

// Get session token from Supabase with timeout
export async function getSessionToken(): Promise<string | null> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 2000)
    )
    const sessionPromise = supabase.auth.getSession()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any
    return data?.session?.access_token || null
  } catch {
    console.log('⚠️ Could not get session token')
    return null
  }
}

// ============================================
// MENU ITEMS CRUD
// ============================================

export async function getAllMenuItems() {
  try {
    // Use server-side API route to bypass client-side session timeout
    const response = await fetch('/api/admin/menu-items')
    
    if (!response.ok) {
      console.error('❌ Error fetching menu items:', response.status)
      return []
    }
    
    const result = await response.json()
    console.log('✅ Fetched menu items:', result.data?.length || 0)
    return result.data || []
  } catch {
    console.error('❌ Error in getAllMenuItems')
    return []
  }
}

export async function createMenuItem(item: {
  name: string
  name_es?: string
  description: string
  description_es?: string
  price: number
  category_id?: string
  image_url?: string
  is_popular?: boolean
  is_spicy?: boolean
  calories?: number
  customization_options?: unknown
}) {
  try {
    console.log('📝 Creating menu item:', item)
    
    const dbItem = {
      ...item,
      is_available: true // Set as available by default
    }
    
    const headers = await getAuthHeaders()
    headers['Prefer'] = 'return=representation'
    
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items`
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(dbItem),
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error creating menu item:', response.status, errorText)
      throw new Error(`Failed to create menu item: ${response.status}`)
    }
    
    const data = await response.json()
    const newItem = Array.isArray(data) ? data[0] : data
    console.log('✅ Menu item created:', newItem)
    return newItem
  } catch (error) {
    console.error('❌ Error in createMenuItem:', error)
    throw error
  }
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>) {
  try {
    const headers = await getAuthHeaders()
    headers['Prefer'] = 'return=representation'
    
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}`
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error updating menu item:', response.status, errorText)
      throw new Error(`Failed to update menu item: ${response.status}`)
    }
    
    const data = await response.json()
    const updatedItem = Array.isArray(data) ? data[0] : data
    return updatedItem
  } catch (error) {
    console.error('❌ Error in updateMenuItem:', error)
    throw error
  }
}

export async function deleteMenuItem(id: string) {
  try {
    const headers = await getAuthHeaders()
    
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}`
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error deleting menu item:', response.status, errorText)
      throw new Error(`Failed to delete menu item: ${response.status}`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Error in deleteMenuItem:', error)
    throw error
  }
}

// ============================================
// STATISTICS
// ============================================

export async function getAdminStats() {
  try {
    const headers = await getAuthHeaders()
    headers['Prefer'] = 'count=exact'

    // Fetch all counts in parallel
    const [menuRes, categoryRes, cartRes, ordersRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items?select=count`, {
        headers,
        signal: AbortSignal.timeout(5000)
      }),
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_categories?select=count`, {
        headers,
        signal: AbortSignal.timeout(5000)
      }),
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cart_items?select=count`, {
        headers,
        signal: AbortSignal.timeout(5000)
      }),
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?select=count`, {
        headers,
        signal: AbortSignal.timeout(5000)
      })
    ])

    // Get counts from headers
    const menuCount = parseInt(menuRes.headers.get('content-range')?.split('/')[1] || '0')
    const categoryCount = parseInt(categoryRes.headers.get('content-range')?.split('/')[1] || '0')
    const activeCartsCount = parseInt(cartRes.headers.get('content-range')?.split('/')[1] || '0')
    const totalOrders = parseInt(ordersRes.headers.get('content-range')?.split('/')[1] || '0')

    // Calculate total revenue (sum of all completed orders)
    const revenueRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?select=total_amount&status=eq.completed`, {
      headers,
      signal: AbortSignal.timeout(5000)
    })
    
    let totalRevenue = 0
    if (revenueRes.ok) {
      const orders = await revenueRes.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)
    }

    return {
      menuItems: menuCount || 0,
      categories: categoryCount || 0,
      activeCarts: activeCartsCount || 0,
      totalOrders: totalOrders || 0,
      totalRevenue: totalRevenue || 0,
    }
  } catch {
    console.error('Error fetching admin stats')
    return {
      menuItems: 0,
      categories: 0,
      activeCarts: 0,
      totalOrders: 0,
      totalRevenue: 0,
    }
  }
}

// ============================================
// CATEGORIES
// ============================================

export async function getAllCategories() {
  try {
    // Use server-side API route to bypass client-side session timeout
    const response = await fetch('/api/admin/categories')
    
    if (!response.ok) {
      console.error('❌ Error fetching categories:', response.status)
      return []
    }
    
    const result = await response.json()
    return result.data || []
  } catch {
    console.error('❌ Error in getAllCategories')
    return []
  }
}

export async function createCategory(category: {
  name: string
  name_es?: string
  description?: string
  description_es?: string
}) {
  try {
    const headers = await getAuthHeaders()
    headers['Prefer'] = 'return=representation'
    
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_categories`
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(category),
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create category: ${response.status}`)
    }
    
    const data = await response.json()
    return Array.isArray(data) ? data[0] : data
  } catch (error) {
    console.error('❌ Error in createCategory:', error)
    throw error
  }
}

export async function updateCategory(id: string, updates: Partial<MenuCategory>) {
  try {
    const headers = await getAuthHeaders()
    headers['Prefer'] = 'return=representation'
    
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_categories?id=eq.${id}`
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update category: ${response.status}`)
    }
    
    const data = await response.json()
    return Array.isArray(data) ? data[0] : data
  } catch (error) {
    console.error('❌ Error in updateCategory:', error)
    throw error
  }
}

export async function deleteCategory(id: string) {
  try {
    const headers = await getAuthHeaders()
    
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_categories?id=eq.${id}`
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete category: ${response.status}`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Error in deleteCategory:', error)
    throw error
  }
}

// ============================================
// CART ANALYTICS (Admin View)
// ============================================

export async function getActiveCartsWithItems() {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      menu_items!cart_items_menu_item_id_fkey (
        name,
        price
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching cart items:', error)
    return []
  }

  return data || []
}

// ============================================
// POPULAR ITEMS (Legacy - moved to analytics)
// ============================================

export async function togglePopularItem(id: string, isPopular: boolean) {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ is_featured: isPopular })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling popular item:', error)
    throw error
  }

  return data
}

// ============================================
// ORDERS
// ============================================

export async function getAllOrders() {
  try {
    // Use server-side API route to bypass client-side session timeout
    const response = await fetch('/api/admin/orders')
    
    if (!response.ok) {
      console.error('❌ Error fetching all orders:', response.status)
      return []
    }
    
    const result = await response.json()
    return result.data || []
  } catch {
    console.error('❌ Error in getAllOrders')
    return []
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    // Use server-side API route to bypass client-side session timeout
    const response = await fetch('/api/admin/update-order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status })
    })
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || `Failed to update order status: ${response.status}`)
    }
    
    const result = await response.json()
    return Array.isArray(result.data) ? result.data[0] : result.data
  } catch (error) {
    console.error('❌ Error in updateOrderStatus:', error)
    throw error
  }
}

// ============================================
// ANALYTICS
// ============================================

export async function getRevenueByDate(days: number = 7) {
  try {
    const response = await fetch(`/api/admin/revenue?days=${days}`)
    
    if (!response.ok) {
      console.error('❌ Error fetching revenue data:', response.status)
      return []
    }
    
    const data = await response.json()
    console.log('📊 Revenue data received:', data.length, 'entries')
    return data
  } catch {
    console.error('❌ Error in getRevenueByDate')
    return []
  }
}

export async function getPopularItems(limit: number = 10) {
  try {
    const response = await fetch(`/api/admin/popular-items?limit=${limit}`)
    
    if (!response.ok) {
      console.error('❌ Error fetching popular items:', response.status)
      return []
    }
    
    const data = await response.json()
    console.log('📊 Popular items received:', data.length, 'items')
    return data
  } catch {
    console.error('❌ Error in getPopularItems')
    return []
  }
}

export async function getPeakHours() {
  try {
    const response = await fetch('/api/admin/peak-hours')
    
    if (!response.ok) {
      console.error('❌ Error fetching peak hours:', response.status)
      return []
    }
    
    const data = await response.json()
    console.log('📊 Peak hours received:', data.length, 'entries')
    return data
  } catch {
    console.error('❌ Error in getPeakHours')
    return []
  }
}

// ==================== INVENTORY MANAGEMENT ====================

export interface InventoryItem {
  id: string
  menu_item_id: string
  quantity: number
  low_stock_threshold: number
  last_restocked_at: string
  created_at: string
  updated_at: string
  menu_item?: MenuItem
}

export async function getAllInventory() {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        menu_item:menu_items(*)
      `)
      .order('quantity', { ascending: true })

    if (error) throw error
    return data as InventoryItem[]
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
}

export async function updateInventoryQuantity(menuItemId: string, quantity: number) {
  try {
    const { data, error} = await supabase
      .from('inventory')
      .update({ 
        quantity,
        last_restocked_at: new Date().toISOString()
      })
      .eq('menu_item_id', menuItemId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating inventory:', error)
    return { data: null, error }
  }
}

export async function updateLowStockThreshold(menuItemId: string, threshold: number) {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .update({ low_stock_threshold: threshold })
      .eq('menu_item_id', menuItemId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating low stock threshold:', error)
    return { data: null, error }
  }
}

export async function getLowStockItems() {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        menu_item:menu_items(*)
      `)
      .filter('quantity', 'lte', supabase.rpc('low_stock_threshold'))
      .order('quantity', { ascending: true })

    if (error) throw error
    return data as InventoryItem[]
  } catch (error) {
    console.error('Error fetching low stock items:', error)
    return []
  }
}
