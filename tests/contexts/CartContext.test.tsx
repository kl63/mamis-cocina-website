import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CartProvider, useCart } from '@/contexts/CartContext'

// 🛡️ Database is mocked - safe to test!

// Test component to access cart context
function TestComponent() {
  const { cart, total, addToCart, removeFromCart, clearCart, itemCount } = useCart()
  
  const testMenuItem = {
    id: 'item-1',
    name: 'Test Burger',
    description: 'Delicious burger',
    price: 10.99,
    category_id: 'cat-1',
    image_url: '🍔',
    is_available: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  return (
    <div>
      <div data-testid="cart-count">{cart.length}</div>
      <div data-testid="item-count">{itemCount}</div>
      <div data-testid="cart-total">{total.toFixed(2)}</div>
      <button onClick={() => addToCart(
        testMenuItem,
        1, // quantity
        {}, // customizations
        [], // selectedToppings
        [], // selectedSauces
        10.99 // itemPrice
      )}>
        Add Item
      </button>
      <button onClick={() => {
        // Remove the first cart item
        if (cart.length > 0) {
          removeFromCart(cart[0].id)
        }
      }}>Remove Item</button>
      <button onClick={clearCart}>Clear Cart</button>
    </div>
  )
}

describe('CartContext', () => {
  beforeEach(async () => {
    // Clear any mocked data before each test
    vi.clearAllMocks()
    // Reset the mock cart state
    const { clearCart } = await import('@/lib/supabase/cart')
    await clearCart()
  })

  it('initializes with empty cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )
    
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
    expect(screen.getByTestId('cart-total')).toHaveTextContent('0')
  })

  // Cart functionality disabled for Mami's Cocina - skipping these tests
  it.skip('adds items to cart', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )
    
    const addButton = screen.getByText('Add Item')
    addButton.click()
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    })
  })

  it.skip('calculates cart total correctly', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )
    
    const addButton = screen.getByText('Add Item')
    addButton.click()
    
    await waitFor(() => {
      // Should show $11.87 for one item ($10.99 + 8% tax)
      expect(screen.getByTestId('cart-total')).toHaveTextContent('11.87')
    })
  })

  it.skip('removes items from cart', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )
    
    // Add item first
    screen.getByText('Add Item').click()
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    })
    
    // Remove item
    screen.getByText('Remove Item').click()
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
    })
  })

  it.skip('clears entire cart', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )
    
    // Add multiple items
    screen.getByText('Add Item').click()
    screen.getByText('Add Item').click()
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('2')
    })
    
    // Clear cart
    screen.getByText('Clear Cart').click()
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('0')
    })
  })
})
