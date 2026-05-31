'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingCart, Check, CreditCard, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAllMenuItems, getAllCategories } from '@/lib/supabase/admin'
import { createOrder } from '@/lib/supabase/orders'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { PaymentForm } from '@/components/stripe/PaymentForm'
import { useAuth } from '@/contexts/AuthContext'
import type { MenuItem, MenuCategory } from '@/types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem extends MenuItem {
  quantity: number
}

interface OrderConfirmation {
  orderNumber: string
  total: number
}

export default function KioskPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [lastActivity, setLastActivity] = useState(() => Date.now())
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [addedItem, setAddedItem] = useState<string | null>(null)

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login?redirect=/kiosk')
    }
  }, [user, isAdmin, authLoading, router])

  // Load menu data
  useEffect(() => {
    const loadData = async () => {
      const [items, cats] = await Promise.all([
        getAllMenuItems(),
        getAllCategories()
      ])
      setMenuItems(items)
      setCategories(cats)
    }
    loadData()
  }, [])

  // Reset inactivity timer on any interaction
  useEffect(() => {
    const resetTimer = () => setLastActivity(Date.now())

    window.addEventListener('click', resetTimer)
    window.addEventListener('touchstart', resetTimer)

    return () => {
      window.removeEventListener('click', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
    }
  }, [])

  // Update current time periodically for inactivity checks
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-reset after 2 minutes of inactivity
  useEffect(() => {
    if (currentTime - lastActivity > 120000) { // 2 minutes
      // eslint-disable-next-line
      setCart([])
      setSelectedCategory('all')
      setIsCartOpen(false)
    }
  }, [currentTime, lastActivity])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-orange-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading kiosk...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized state
  if (!user || !isAdmin) {
    return null // Will redirect
  }

  // Filter items by category
  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category_id === selectedCategory)

  // Add to cart
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
    setLastActivity(currentTime)
    setAddedItem(item.name)
    
    // Auto-hide notification after 2 seconds
    setTimeout(() => {
      setAddedItem(null)
    }, 2000)
  }

  // Update quantity
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id)
      if (!item) return prev
      
      const newQuantity = item.quantity + delta
      if (newQuantity <= 0) {
        return prev.filter(i => i.id !== id)
      }
      
      return prev.map(i => 
        i.id === id ? { ...i, quantity: newQuantity } : i
      )
    })
  }

  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Initialize payment
  const handleInitiatePayment = async () => {
    if (cart.length === 0) return

    setIsProcessing(true)
    setPaymentError('')
    
    try {
      // Calculate amounts
      const subtotal = total
      const taxAmount = subtotal * 0.08 // 8% tax
      const totalAmount = subtotal + taxAmount

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount }),
      })
      
      const data = await response.json()
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
        setShowPayment(true)
        setIsCartOpen(false)
      } else {
        setPaymentError('Failed to initialize payment')
        alert('Failed to initialize payment')
      }
    } catch (error) {
      console.error('❌ Payment initialization error:', error)
      setPaymentError('Failed to initialize payment')
      alert('Failed to initialize payment')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle payment success
  const handlePaymentSuccess = async () => {
    try {
      setIsProcessing(true)
      
      // Calculate amounts
      const subtotal = total
      const taxAmount = subtotal * 0.08 // 8% tax
      const totalAmount = subtotal + taxAmount

      // Convert cart to CartItem format
      const cartItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url,
        menuItem: item,
        customizations: {},
        selectedToppings: [],
        selectedSauces: [],
        selectedSides: [],
        specialInstructions: ''
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any

      // Create order as guest (kiosk mode)
      const order = await createOrder({
        customer_name: 'Kiosk Customer',
        customer_email: 'kiosk@byteburger.com',
        customer_phone: '555-KIOSK',
        notes: 'Kiosk Order - In-Store Pickup (Paid via Stripe)',
        cart_items: cartItems,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        delivery_type: 'pickup'
      })

      // Show confirmation
      setOrderConfirmation({
        orderNumber: order.order_number,
        total: totalAmount
      })
      
      // Clear cart and close payment
      setCart([])
      setShowPayment(false)
      setClientSecret('')

      // Auto-close confirmation after 10 seconds
      setTimeout(() => {
        setOrderConfirmation(null)
      }, 10000)
    } catch (error) {
      console.error('❌ Order creation error:', error)
      alert('Order failed. Please try again or ask for assistance.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setPaymentError(error)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-700 p-4 sm:p-6 md:p-8 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">🍔 ByteBurger</h1>
            <span className="text-xl sm:text-2xl md:text-3xl text-orange-200">Kiosk</span>
          </div>
          
          <Button
            onClick={() => setIsCartOpen(true)}
            className="bg-white text-orange-600 hover:bg-orange-50 h-16 sm:h-20 md:h-24 px-6 sm:px-8 md:px-12 text-xl sm:text-2xl md:text-3xl font-black shadow-xl relative w-full sm:w-auto"
          >
            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mr-2 sm:mr-3 md:mr-4" />
            View Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-red-500 text-white w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-base sm:text-xl md:text-2xl font-black border-2 sm:border-4 border-white">
                {itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8">
        {/* Category Tabs */}
        <div className="flex gap-2 sm:gap-3 md:gap-4 mb-6 md:mb-8 overflow-x-auto pb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 rounded-xl md:rounded-2xl font-black text-lg sm:text-xl md:text-2xl whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-2xl scale-105'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 rounded-xl md:rounded-2xl font-black text-lg sm:text-xl md:text-2xl whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-2xl scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 sm:border-3 border-orange-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 hover:border-orange-500 transition-all cursor-pointer shadow-xl"
              onClick={() => addToCart(item)}
            >
              <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-4 sm:mb-6 text-center">{item.image_url}</div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 line-clamp-2">{item.name}</h3>
              {item.description && (
                <p className="text-gray-400 mb-4 sm:mb-6 text-base sm:text-lg md:text-xl line-clamp-2">{item.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-orange-500">${item.price.toFixed(2)}</span>
                <Button className="bg-gradient-to-r from-orange-500 to-red-600 text-white h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 text-xl sm:text-2xl font-black">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>
              {item.calories && (
                <div className="mt-3 sm:mt-4 text-gray-500 text-sm sm:text-base md:text-lg">{item.calories} cal</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-gradient-to-br from-gray-900 to-black border-l-2 sm:border-l-4 border-orange-500 z-50 overflow-y-auto"
            >
              <div className="p-4 sm:p-6 md:p-8">
                {/* Cart Header */}
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">Your Order</h2>
                  <Button
                    onClick={() => setIsCartOpen(false)}
                    variant="ghost"
                    className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                  </Button>
                </div>

                {/* Cart Items */}
                {cart.length === 0 ? (
                  <div className="text-center py-12 sm:py-16 md:py-20">
                    <ShoppingCart className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 text-gray-700 mx-auto mb-4 sm:mb-6" />
                    <p className="text-2xl sm:text-3xl text-gray-500">Your cart is empty</p>
                    <p className="text-lg sm:text-xl text-gray-600 mt-3 sm:mt-4">Tap items to add them</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 sm:space-y-6 mb-6 md:mb-8">
                      {cart.map(item => (
                        <div
                          key={item.id}
                          className="bg-gray-800/50 border-2 border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6"
                        >
                          <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl sm:text-2xl md:text-3xl font-black mb-1 sm:mb-2 line-clamp-2">{item.name}</h3>
                              <p className="text-lg sm:text-xl md:text-2xl text-orange-500 font-bold">
                                ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-4xl sm:text-5xl md:text-6xl ml-3 sm:ml-4 flex-shrink-0">{item.image_url}</div>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                            <Button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 bg-red-600 hover:bg-red-700"
                            >
                              <Minus className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                            </Button>
                            <span className="text-2xl sm:text-3xl md:text-4xl font-black w-12 sm:w-16 md:w-20 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                            </Button>
                            <div className="flex-1 text-right">
                              <p className="text-xl sm:text-2xl md:text-3xl font-black text-orange-400">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total and Checkout */}
                    <div className="bg-gradient-to-r from-orange-600 to-red-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                      <div className="flex justify-between items-center text-white">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black">Total</span>
                        <span className="text-4xl sm:text-5xl md:text-6xl font-black">${total.toFixed(2)}</span>
                      </div>
                      <Button
                        onClick={handleInitiatePayment}
                        disabled={isProcessing}
                        className="w-full h-16 sm:h-20 md:h-24 bg-white text-orange-600 hover:bg-orange-50 text-2xl sm:text-3xl md:text-4xl font-black shadow-2xl disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 border-2 sm:border-3 md:border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mr-2" />
                            Pay & Place Order
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setCart([])}
                        variant="outline"
                        className="w-full h-14 sm:h-16 md:h-20 border-white text-white hover:bg-white/10 text-xl sm:text-2xl md:text-3xl font-black"
                      >
                        Clear Cart
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Inactivity Warning */}
      {currentTime - lastActivity > 90000 && currentTime - lastActivity < 120000 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 rounded-xl sm:rounded-2xl shadow-2xl text-base sm:text-xl md:text-2xl font-bold max-w-[90%] sm:max-w-none text-center"
        >
          ⏱️ Session will reset in {Math.ceil((120000 - (currentTime - lastActivity)) / 1000)}s
        </motion.div>
      )}

      {/* Item Added Notification */}
      <AnimatePresence>
        {addedItem && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 rounded-xl sm:rounded-2xl shadow-2xl text-base sm:text-xl md:text-2xl font-bold max-w-[90%] sm:max-w-none text-center z-40"
          >
            <div className="flex items-center justify-center gap-3">
              <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
              <span>{addedItem} added to cart!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Confirmation Modal */}
      <AnimatePresence>
        {orderConfirmation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto"
            >
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 max-w-6xl w-full shadow-2xl my-auto">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
                  {/* Left: Checkmark */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="flex-shrink-0"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-white rounded-full flex items-center justify-center">
                      <Check className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-green-600" strokeWidth={4} />
                    </div>
                  </motion.div>
                  
                  {/* Middle: Order Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 md:mb-4 leading-tight">
                      Order Placed!
                    </h2>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-green-100 mb-4 md:mb-6">
                      Your order has been received
                    </p>
                    
                    <div className="bg-white/20 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 mb-3 md:mb-4">
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-green-100 mb-1 md:mb-2">
                        Order Number
                      </p>
                      <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-wider break-all">
                        {orderConfirmation.orderNumber}
                      </p>
                    </div>
                    
                    <div className="bg-white/20 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6">
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-green-100 mb-1 md:mb-2">
                        Total Amount
                      </p>
                      <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white">
                        ${orderConfirmation.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right: Instructions & Button */}
                  <div className="flex-shrink-0 text-center md:text-right flex flex-col items-center md:items-end gap-4 md:gap-6">
                    <div className="text-green-100">
                      <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-2">
                        Please wait at the counter
                      </p>
                      <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-green-200">
                        Your order will be ready soon!
                      </p>
                    </div>
                    
                    <Button
                      onClick={() => setOrderConfirmation(null)}
                      className="h-14 sm:h-16 md:h-18 lg:h-20 px-6 sm:px-8 md:px-12 bg-white text-green-600 hover:bg-green-50 text-lg sm:text-xl md:text-2xl lg:text-3xl font-black whitespace-nowrap"
                    >
                      Start New Order
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
              onClick={() => setShowPayment(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-orange-500/30 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 max-w-4xl w-full shadow-2xl my-auto">
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white flex items-center gap-3">
                    <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-orange-500" />
                    Payment
                  </h2>
                  <Button
                    onClick={() => setShowPayment(false)}
                    variant="ghost"
                    className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                  </Button>
                </div>

                {paymentError && (
                  <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 mb-6">
                    <p className="text-red-300 text-center">{paymentError}</p>
                  </div>
                )}

                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm
                    amount={total * 1.08}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>

                <Button
                  onClick={() => setShowPayment(false)}
                  variant="outline"
                  className="w-full mt-6 border-orange-500/30 text-orange-500 hover:bg-orange-500/10 text-xl sm:text-2xl font-black"
                >
                  Cancel Payment
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
