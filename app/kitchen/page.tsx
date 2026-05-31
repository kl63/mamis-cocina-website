'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle, ChefHat, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  status: string
  created_at: string
  items: OrderItem[]
  notes?: string
}

interface OrderItem {
  id: string
  menu_item: {
    name: string
  }
  quantity: number
  customizations?: Record<string, string>
}

export default function KitchenDisplayPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [newOrderModal, setNewOrderModal] = useState<Order | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const lastOrderIdsRef = useRef<Set<string>>(new Set())

  async function fetchOrders() {
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?select=id,order_number,customer_name,customer_email,status,created_at,notes,items:order_items(id,quantity,customizations,menu_item:menu_items(name))&status=in.(pending,preparing)&order=created_at.asc`
      const headers = {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }

      const response = await fetch(url, { headers })
      if (response.ok) {
        const data = await response.json()

        // Initialize tracking on first load
        if (lastOrderIdsRef.current.size === 0) {
          data.forEach((order: Order) => lastOrderIdsRef.current.add(order.id))
        }

        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  async function handleNewOrder(orderId: string) {
    try {
      // Play notification sound
      playNotificationSound()

      // Fetch the new order details
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,order_number,customer_name,customer_email,status,created_at,notes,items:order_items(id,quantity,customizations,menu_item:menu_items(name))`
      const headers = {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }

      const response = await fetch(url, { headers })
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          const newOrder = data[0]
          setOrders(prev => [...prev, newOrder])
          lastOrderIdsRef.current.add(newOrder.id)

          // Show modal for new order
          setNewOrderModal(newOrder)

          // Auto-hide modal after 5 seconds
          setTimeout(() => {
            setNewOrderModal(null)
          }, 5000)
        }
      }
    } catch (error) {
      console.error('Error handling new order:', error)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    // Prevent multiple simultaneous updates
    if (updatingOrderId === orderId) {
      console.log('⚠️ Already updating this order, skipping')
      return
    }

    try {
      setUpdatingOrderId(orderId)
      console.log('🔄 Updating order status:', orderId, 'to', newStatus)

      // Use server-side API route for reliable updates (bypasses Vercel session timeout)
      const response = await fetch('/api/kitchen/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Failed to update status:', result.error)
        alert(`Failed to update order status: ${result.error}`)
        return
      }

      console.log('✅ Status updated successfully')

      // Update local state to reflect the change
      if (newStatus === 'completed') {
        // Remove completed orders from the queue
        setOrders(orders.filter(o => o.id !== orderId))
      } else {
        // Update status for other status changes
        setOrders(orders.map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ))
      }

      // Send email notification if order is ready for pickup
      if (newStatus === 'completed') {
        const order = orders.find(o => o.id === orderId)
        if (order) {
          console.log('Sending ready-for-pickup email...')
          fetch('/api/send-status-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderNumber: order.order_number,
              customerName: order.customer_name,
              customerEmail: order.customer_email,
              status: 'completed'
            })
          })
            .then(() => console.log('Ready email sent'))
            .catch(err => console.error('Email send failed:', err))
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert(`Error: ${error}`)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  function playNotificationSound() {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        console.log('Audio autoplay blocked by browser - user interaction required')
      })
    }
  }

  function getTimeSince(createdAt: string) {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins === 1) return '1 min'
    return `${diffMins} mins`
  }

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login?redirect=/kitchen')
    }
  }, [user, isAdmin, authLoading, router])

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Initial fetch and realtime subscription
  useEffect(() => {
    // Only fetch if authenticated
    if (!user || !isAdmin) return

    // Initial fetch on mount
    // eslint-disable-next-line
    fetchOrders()

    // Try to set up realtime subscription
    try {
      const supabase = createClient()
      const channel = supabase
        .channel('kitchen-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          async (payload) => {
            console.log('Realtime order update:', payload)

            if (payload.eventType === 'INSERT') {
              const newOrder = payload.new as { id: string }
              if (newOrder) {
                handleNewOrder(newOrder.id)
              }
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.error('Error setting up realtime subscription:', error)
    }
  }, [user, isAdmin])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-orange-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading kitchen display...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized state
  if (!user || !isAdmin) {
    return null // Will redirect
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'preparing': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const preparingOrders = orders.filter(o => o.status === 'preparing')

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <ChefHat className="w-12 h-12" />
          <div>
            <h1 className="text-4xl font-bold">Kitchen Display</h1>
            <p className="text-orange-100">ByteBurger - Live Orders</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold font-mono" suppressHydrationWarning>
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-orange-100" suppressHydrationWarning>
            {currentTime.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
            <h3 className="text-2xl font-bold">Pending</h3>
          </div>
          <p className="text-5xl font-bold text-yellow-500">{pendingOrders.length}</p>
        </div>
        <div className="bg-blue-500/20 border-2 border-blue-500 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <ChefHat className="w-8 h-8 text-blue-500" />
            <h3 className="text-2xl font-bold">Preparing</h3>
          </div>
          <p className="text-5xl font-bold text-blue-500">{preparingOrders.length}</p>
        </div>
        <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <h3 className="text-2xl font-bold">Total Active</h3>
          </div>
          <p className="text-5xl font-bold text-green-500">{orders.length}</p>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {orders.map(order => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-orange-500/30 rounded-2xl p-6 shadow-xl"
            >
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-3xl font-bold text-orange-500">
                    {order.order_number}
                  </h3>
                  <p className="text-gray-400">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Clock className="w-5 h-5" />
                    <span className="font-bold text-xl">
                      {getTimeSince(order.created_at)}
                    </span>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-2 ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {order.items?.map(item => (
                  <div key={item.id} className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-lg">
                        {item.quantity}x {item.menu_item?.name || 'Item'}
                      </span>
                    </div>
                    {item.customizations && Object.keys(item.customizations).length > 0 && (
                      <div className="mt-2 text-sm text-gray-400">
                        {Object.entries(item.customizations).map(([key, value]) => (
                          <div key={key}>• {key}: {value}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-200">
                    <strong>Note:</strong> {order.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {order.status === 'pending' && (
                  <Button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    disabled={updatingOrderId === order.id}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-lg disabled:opacity-50"
                  >
                    {updatingOrderId === order.id ? 'Updating...' : 'Start Cooking'}
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <Button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    disabled={updatingOrderId === order.id}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg col-span-2 disabled:opacity-50"
                  >
                    {updatingOrderId === order.id ? 'Updating...' : 'Mark Ready'}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-20">
          <ChefHat className="w-24 h-24 mx-auto text-gray-600 mb-4" />
          <h2 className="text-3xl font-bold text-gray-500">No Active Orders</h2>
          <p className="text-gray-600">Waiting for new orders...</p>
        </div>
      )}

      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} src="/notification.mp3" />

      {/* New Order Modal - FULLSCREEN */}
      <AnimatePresence>
        {newOrderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-orange-600 via-red-600 to-orange-700 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-full h-full flex flex-col p-4 sm:p-6 md:p-8 lg:p-12"
            >
              {/* Header - NEW ORDER at top */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="text-center mb-4 md:mb-6 flex items-center justify-center gap-3 md:gap-4"
              >
                <AlertCircle className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-yellow-300 drop-shadow-xl animate-pulse" />
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-xl">
                  NEW ORDER!
                </h2>
                <AlertCircle className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-yellow-300 drop-shadow-xl animate-pulse" />
              </motion.div>

              {/* Main Content - Two Columns */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 overflow-hidden">
                
                {/* Left Column - Order Info */}
                <div className="bg-white/20 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border-4 md:border-6 border-yellow-400 shadow-2xl flex flex-col">
                  <div className="text-center mb-4 md:mb-6 pb-4 md:pb-6 border-b-4 border-white/30">
                    <p className="text-yellow-300 text-xs sm:text-sm md:text-base font-bold mb-2">ORDER NUMBER</p>
                    <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-xl break-all">
                      {newOrderModal.order_number}
                    </p>
                  </div>

                  <div className="space-y-3 md:space-y-4 text-white">
                    <div className="bg-white/20 rounded-xl p-3 md:p-4">
                      <p className="text-yellow-300 text-xs sm:text-sm font-semibold mb-1">CUSTOMER</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold">{newOrderModal.customer_name}</p>
                    </div>

                    <div className="bg-white/20 rounded-xl p-3 md:p-4">
                      <p className="text-yellow-300 text-xs sm:text-sm font-semibold mb-1">TIME</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold">Just now</p>
                    </div>

                    <div className="bg-white/20 rounded-xl p-3 md:p-4">
                      <p className="text-yellow-300 text-xs sm:text-sm font-semibold mb-1">ITEMS</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold">{newOrderModal.items?.length || 0} item(s)</p>
                    </div>

                    {newOrderModal.notes && (
                      <div className="bg-yellow-300/30 border-2 md:border-3 border-yellow-300 rounded-xl p-3 md:p-4">
                        <p className="text-yellow-300 text-xs sm:text-sm font-semibold mb-2">SPECIAL NOTES</p>
                        <p className="text-base sm:text-lg md:text-xl font-bold text-yellow-100">{newOrderModal.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Order Items */}
                <div className="bg-white/20 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border-4 md:border-6 border-yellow-400 shadow-2xl flex flex-col overflow-hidden">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-4 md:mb-6 pb-3 md:pb-4 border-b-4 border-white/30">
                    ORDER DETAILS
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {newOrderModal.items?.map((item: OrderItem) => (
                      <div key={item.id} className="bg-gradient-to-br from-white/30 to-white/20 rounded-xl p-3 md:p-4 border-2 border-white/50 shadow-lg">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="bg-yellow-400 text-gray-900 font-black text-lg sm:text-xl md:text-2xl rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                            {item.quantity}
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-lg sm:text-xl md:text-2xl text-white leading-tight">
                              {item.menu_item?.name || 'Item'}
                            </p>
                          </div>
                        </div>
                        
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div className="mt-2 ml-12 sm:ml-14 space-y-1 bg-yellow-300/20 rounded-lg p-2">
                            <p className="text-yellow-300 text-xs font-bold mb-1">CUSTOMIZATIONS:</p>
                            {Object.entries(item.customizations).map(([key, value]) => (
                              <div key={key} className="text-sm sm:text-base md:text-lg text-yellow-100 font-semibold">
                                • <span className="text-yellow-200">{key}:</span> {value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer - Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
                <Button
                  onClick={() => {
                    updateOrderStatus(newOrderModal.id, 'preparing')
                    setNewOrderModal(null)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-black py-4 sm:py-5 md:py-6 text-xl sm:text-2xl md:text-3xl rounded-xl md:rounded-2xl shadow-2xl border-4 md:border-6 border-green-400 transform hover:scale-105 transition-transform"
                >
                  <ChefHat className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mr-2 md:mr-3" />
                  START COOKING
                </Button>
                <Button
                  onClick={() => setNewOrderModal(null)}
                  className="bg-red-600 hover:bg-red-700 text-white font-black py-4 sm:py-5 md:py-6 text-xl sm:text-2xl md:text-3xl rounded-xl md:rounded-2xl shadow-2xl border-4 md:border-6 border-red-400 transform hover:scale-105 transition-transform"
                >
                  DISMISS
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
