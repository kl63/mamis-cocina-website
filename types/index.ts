// Database Types
export interface User {
  id: string
  email: string
  full_name?: string
  phone?: string
  role: 'customer' | 'admin' | 'staff'
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: string
  name: string
  name_es?: string // Spanish translation
  description?: string
  description_es?: string // Spanish translation
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomizationOption {
  name: string // e.g., "Protein Choices"
  name_es?: string // e.g., "Opciones de Proteína"
  options: CustomizationChoice[]
}

export interface CustomizationChoice {
  label: string // e.g., "Chicken" or "Pollo / Chicken"
  label_es?: string // e.g., "Pollo" (optional, for separate Spanish label)
  price_modifier?: number // e.g., 1 for +$1, 0 for no change
}

export interface MenuItem {
  id: string
  category_id?: string
  name: string
  name_es?: string // Spanish translation
  description?: string
  description_es?: string // Spanish translation
  price: number
  image_url?: string
  calories?: number
  is_available: boolean
  is_featured: boolean
  is_popular?: boolean // Legacy field for backwards compatibility
  is_spicy?: boolean // Indicates if the item is spicy
  customization_options?: CustomizationOption[]
  created_at: string
  updated_at: string
  category?: MenuCategory
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id?: string
  quantity: number
  price: number
  customizations?: Record<string, string>
  created_at: string
  menu_item?: MenuItem
}

export interface Order {
  id: string
  user_id?: string
  order_number: string
  status: 'pending' | 'preparing' | 'completed' | 'cancelled' | 'delivered'
  total_amount: number
  tax_amount: number
  subtotal: number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  notes?: string
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  user?: User
}

// Cart Types (Frontend only)
export interface CartItem {
  id: string // Unique ID for cart item (to handle same item with different customizations)
  menuItem: MenuItem
  quantity: number
  customizations: Record<string, string> // Single-select options (patty, cheese, bun, etc.)
  selectedToppings: string[] // Multi-select toppings
  selectedSauces: string[] // Multi-select sauces
  itemPrice: number // Price per item (base + customizations)
  totalPrice: number // itemPrice * quantity
}

export interface Cart {
  items: CartItem[]
  itemCount: number
  subtotal: number
  tax: number
  total: number
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Form Types
export interface CheckoutForm {
  customer_name: string
  customer_email: string
  customer_phone: string
  notes?: string
}
