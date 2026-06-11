import { createClient } from '@/lib/supabase/client'
import type { MenuItem, MenuCategory, Order, User } from '@/types'

// Menu Categories
export async function getCategories() {
  // Use direct REST API call
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_categories?select=*&is_active=eq.true&order=display_order`
  const headers = {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  }
  
  console.log('🔵 Fetching categories via REST API...')
  
  const response = await fetch(url, { 
    headers,
    signal: AbortSignal.timeout(5000)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const data = await response.json()
  console.log('✅ Got categories:', data.length)
  
  return data as MenuCategory[]
}

export async function getCategoryById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as MenuCategory
}

// Menu Items
export async function getMenuItems() {
  // Try direct REST API call instead of Supabase client
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items?select=*,category:category_id(*)`
  const headers = {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  }
  
  console.log('🔵 Fetching via REST API...')
  
  const response = await fetch(url, { 
    headers,
    signal: AbortSignal.timeout(5000) // 5 second timeout
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const data = await response.json()
  console.log('✅ Got data:', data.length, 'items')
  
  return data as MenuItem[]
}

export async function getMenuItemById(id: string) {
  // Fetch item via REST API
  const itemUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items?select=*&id=eq.${id}`
  const headers = {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  }
  
  const itemResponse = await fetch(itemUrl, { 
    headers,
    signal: AbortSignal.timeout(5000)
  })
  
  if (!itemResponse.ok) {
    throw new Error(`HTTP ${itemResponse.status}`)
  }
  
  const items = await itemResponse.json()
  if (!items || items.length === 0) {
    throw new Error('Item not found')
  }
  
  const item = items[0]
  
  // Fetch category if category_id exists
  if (item.category_id) {
    const catUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_categories?select=*&id=eq.${item.category_id}`
    const catResponse = await fetch(catUrl, { 
      headers,
      signal: AbortSignal.timeout(5000)
    })
    
    if (catResponse.ok) {
      const categories = await catResponse.json()
      if (categories && categories.length > 0) {
        item.category = categories[0]
      }
    }
  }
  
  return item as MenuItem
}

export async function getMenuItemsByCategory(categoryId: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items?select=*&category_id=eq.${categoryId}&is_available=eq.true&order=created_at.desc`
  const headers = {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  }
  
  const response = await fetch(url, { 
    headers,
    signal: AbortSignal.timeout(5000)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  const data = await response.json()
  return data as MenuItem[]
}

export async function getPopularMenuItems() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items?select=*&is_featured=eq.true&is_available=eq.true&limit=6`
  const headers = {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  }
  
  const response = await fetch(url, { 
    headers,
    signal: AbortSignal.timeout(5000)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  const data = await response.json()
  return data as MenuItem[]
}

export async function searchMenuItems(query: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items?select=*&or=(name.ilike.*${query}*,description.ilike.*${query}*)&is_available=eq.true`
  const headers = {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  }
  
  const response = await fetch(url, { 
    headers,
    signal: AbortSignal.timeout(5000)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  const data = await response.json()
  return data as MenuItem[]
}

// Admin: Create menu item
export async function createMenuItem(item: Partial<MenuItem>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('menu_items')
    .insert(item)
    .select()
    .single()

  if (error) throw error
  return data as MenuItem
}

// Admin: Update menu item
export async function updateMenuItem(id: string, updates: Partial<MenuItem>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as MenuItem
}

// Admin: Delete menu item
export async function deleteMenuItem(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Orders
export async function createOrder(order: {
  user_id?: string
  customer_name: string
  customer_email: string
  customer_phone: string
  subtotal: number
  tax_amount: number
  total_amount: number
  notes?: string
  delivery_type?: string
  items: Array<{
    menu_item_id: string
    quantity: number
    price: number
    customizations?: Record<string, string>
  }>
}) {
  try {
    console.log('🔵 createOrder: Starting...')
    
    const headers = {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }

    // Generate simple order number (no RPC needed)
    const order_number = `BB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    console.log('🔵 Generated order number:', order_number)

    // Create order via REST API
    const orderUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders`
    console.log('🔵 Calling order API...')
    
    const orderResponse = await fetch(orderUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: order.user_id,
        order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        total_amount: order.total_amount,
        notes: order.notes,
        delivery_type: order.delivery_type || 'pickup',
        status: 'pending',
      }),
      signal: AbortSignal.timeout(10000)
    })

    console.log('🔵 Order API response:', orderResponse.status)

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error('❌ Order creation failed:', errorText)
      throw new Error(`Failed to create order: ${orderResponse.status} - ${errorText}`)
    }

    const orderData = await orderResponse.json()
    const createdOrder = Array.isArray(orderData) ? orderData[0] : orderData
    console.log('✅ Order created:', createdOrder.id)

    // Create order items
    console.log('🔵 Creating order items...')
    const orderItems = order.items.map(item => ({
      order_id: createdOrder.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: item.price,
      customizations: item.customizations,
    }))

    const itemsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/order_items`
    const itemsResponse = await fetch(itemsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderItems),
      signal: AbortSignal.timeout(10000)
    })

    console.log('🔵 Order items API response:', itemsResponse.status)

    if (!itemsResponse.ok) {
      const errorText = await itemsResponse.text()
      console.error('❌ Order items creation failed:', errorText)
      throw new Error(`Failed to create order items: ${itemsResponse.status} - ${errorText}`)
    }

    console.log('✅ Order items created')
    return createdOrder as Order
  } catch (error) {
    console.error('❌ Error in createOrder:', error)
    throw error
  }
}

export async function getOrderById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_item:menu_items (*)
      ),
      user:users (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Order
}

export async function getOrderByNumber(orderNumber: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_item:menu_items (*)
      ),
      user:users (*)
    `)
    .eq('order_number', orderNumber)
    .single()

  if (error) throw error
  return data as Order
}

export async function getUserOrders(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_item:menu_items (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Order[]
}

export async function getAllOrders() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_item:menu_items (*)
      ),
      user:users (*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Order[]
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error
  return data as Order
}

// Users
export async function getUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as User
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as User
}
