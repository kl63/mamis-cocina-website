'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  MenuSquare,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Package,
  Loader2,
  Clock,
  Menu,
  FileText,
  Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getAllMenuItems,
  getAdminStats,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteMenuItem,
  updateMenuItem,
  createMenuItem,
  getAllOrders,
  updateOrderStatus,
  getRevenueByDate,
  getPopularItems,
  getPeakHours,
} from '@/lib/supabase/admin'
import { uploadMenuItemImage } from '@/lib/supabase/storage'
import type { MenuItem, MenuCategory } from '@/types'
import { sendStatusUpdateEmail } from '@/lib/email/send-email'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { RestaurantHours } from '@/components/admin/RestaurantHours'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  // State for data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState({
    menuItems: 0,
    categories: 0,
    activeCarts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  
  // Get session token once when user is available
  useEffect(() => {
    if (user && !sessionToken) {
      console.log('🔑 Getting session token for admin operations...')
      
      // Set a safety timeout
      const safetyTimeout = setTimeout(() => {
        console.log('⚠️ Session token fetch timeout after 5 seconds')
        setSessionToken('') // Empty string means we tried but failed
      }, 5000)
      
      import('@/lib/supabase/client').then(({ createClient }) => {
        const supabase = createClient()
        
        // Try with a longer timeout
        Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ]).then((result: any) => {
          clearTimeout(safetyTimeout)
          const data = result?.data
          const token = data?.session?.access_token
          if (token) {
            console.log('✅ Session token retrieved:', token.substring(0, 20) + '...')
            setSessionToken(token)
            // Set the token in admin module
            import('@/lib/supabase/admin').then(({ setAdminToken }) => {
              setAdminToken(token)
              console.log('🔐 Admin token cached for API calls')
            })
          } else {
            console.log('⚠️ No session token in response')
            setSessionToken('')
          }
        }).catch((err) => {
          clearTimeout(safetyTimeout)
          console.log('⚠️ getSession failed:', err.message)
          setSessionToken('')
        })
      })
    }
  }, [user, sessionToken])
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    calories: 0,
    is_popular: false,
    image_url: '🍔',
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Category modal states
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false)
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  })

  // Analytics state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revenueData, setRevenueData] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [popularItemsData, setPopularItemsData] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [peakHoursData, setPeakHoursData] = useState<any[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Data loading function
  const loadData = useCallback(async () => {
    console.log('🔄 Loading admin data...')
    setLoading(true)
    try {
      const [itemsData, categoriesData, statsData, ordersData] = await Promise.all([
        getAllMenuItems(),
        getAllCategories(),
        getAdminStats(),
        getAllOrders(),
      ])

      console.log('✅ Data loaded:', {
        items: itemsData.length,
        categories: categoriesData.length,
        orders: ordersData.length,
        stats: statsData
      })

      setMenuItems(itemsData)
      setCategories(categoriesData)
      setStats(statsData)
      setOrders(ordersData)
    } catch (error) {
      console.error('❌ Error loading admin data:', error)
      // Still set empty arrays so UI doesn't stay loading forever
      setMenuItems([])
      setCategories([])
      setStats({
        menuItems: 0,
        categories: 0,
        activeCarts: 0,
        totalOrders: 0,
        totalRevenue: 0,
      })
    } finally {
      console.log('✅ Loading complete')
      setLoading(false)
      setHasLoadedOnce(true)
    }
  }, [])

  // Protect admin route and load data
  useEffect(() => {
    console.log('🔒 Admin Page Auth State:', { 
      authLoading, 
      hasUser: !!user, 
      isAdmin,
      hasToken: !!sessionToken,
      userEmail: user?.email 
    })

    // Safety timeout: if auth is still loading after 5 seconds, force redirect
    const safetyTimeout = setTimeout(() => {
      if (authLoading) {
        console.log('⚠️ Auth timeout - forcing redirect to login')
        setLoading(false)
        router.push('/login')
      }
    }, 5000)

    if (authLoading) {
      console.log('⏳ Still loading auth...')
      return () => clearTimeout(safetyTimeout)
    }

    clearTimeout(safetyTimeout)

    if (!user || !isAdmin) {
      console.log('🚫 Not authorized, redirecting to login')
      // eslint-disable-next-line
      setLoading(false)
      router.push('/login')
      return
    }

    // Wait for session token before loading data
    if (sessionToken === null) {
      console.log('⏳ Waiting for session token...')
      return
    }

    console.log('✅ Authorized admin with token, loading data...')
    void loadData()
  }, [user, isAdmin, authLoading, sessionToken, router, loadData])

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await deleteMenuItem(id)
      setMenuItems(items => items.filter(item => item.id !== id))
      // Reload stats
      const statsData = await getAdminStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      await updateMenuItem(editingItem.id, {
        name: editingItem.name,
        description: editingItem.description,
        price: editingItem.price,
        category_id: editingItem.category_id,
        calories: editingItem.calories,
        is_featured: editingItem.is_featured || editingItem.is_popular,
        image_url: editingItem.image_url,
      })
      
      // Reload data
      await loadData()
      setIsEditModalOpen(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Failed to update item')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddNew = async () => {
    if (!newItem.name || !newItem.price) {
      alert('Please fill in name and price')
      return
    }

    console.log('➕ Adding new menu item:', newItem.name)

    try {
      setUploadingImage(true)
      
      // Upload image if file is selected
      let imageUrl = newItem.image_url
      if (selectedFile) {
        console.log('📷 Uploading selected image...')
        imageUrl = await uploadMenuItemImage(selectedFile)
        console.log('✅ Image uploaded, URL:', imageUrl)
      } else {
        console.log('ℹ️ No image selected, using default emoji')
      }
      
      console.log('💾 Creating menu item in database...')
      await createMenuItem({
        name: newItem.name,
        description: newItem.description,
        price: newItem.price,
        category_id: newItem.category_id || undefined,
        calories: newItem.calories || undefined,
        is_popular: newItem.is_popular,
        image_url: imageUrl,
      })
      
      console.log('✅ Menu item created successfully')
      
      // Reload data
      console.log('🔄 Reloading admin data...')
      await loadData()
      setIsAddModalOpen(false)
      
      // Reset form
      setNewItem({
        name: '',
        description: '',
        price: 0,
        category_id: '',
        calories: 0,
        is_popular: false,
        image_url: '🍔',
      })
      setSelectedFile(null)
      setImagePreview(null)
      
      console.log('🎉 Item added successfully!')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error adding item:', error)
      const errorMsg = error?.message || error?.hint || error?.error_description || 'Unknown error'
      alert(`Failed to add item: ${errorMsg}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      alert('Please enter a category name')
      return
    }

    console.log('➕ Adding new category:', newCategory.name)

    try {
      console.log('💾 Creating category in database...')
      await createCategory({
        name: newCategory.name,
        description: newCategory.description,
      })
      
      console.log('✅ Category created successfully')
      
      // Reload data
      console.log('🔄 Reloading admin data...')
      await loadData()
      setIsAddCategoryModalOpen(false)
      
      // Reset form
      setNewCategory({
        name: '',
        description: '',
      })
      
      console.log('🎉 Category added successfully!')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error adding category:', error)
      const errorMsg = error?.message || error?.hint || error?.error_description || 'Unknown error'
      alert(`Failed to add category: ${errorMsg}`)
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name) {
      alert('Please enter a category name')
      return
    }

    console.log('✏️ Updating category:', editingCategory.name)

    try {
      await updateCategory(editingCategory.id, {
        name: editingCategory.name,
        description: editingCategory.description,
      })
      
      console.log('✅ Category updated successfully')
      
      // Reload data
      await loadData()
      setIsEditCategoryModalOpen(false)
      setEditingCategory(null)
      
      console.log('🎉 Category updated!')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error updating category:', error)
      const errorMsg = error?.message || error?.hint || error?.error_description || 'Unknown error'
      alert(`Failed to update category: ${errorMsg}`)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    console.log('🗑️ Deleting category:', name)

    try {
      await deleteCategory(id)
      setCategories(cats => cats.filter(cat => cat.id !== id))
      console.log('✅ Category deleted successfully')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error deleting category:', error)
      const errorMsg = error?.message || error?.hint || error?.error_description || 'Unknown error'
      alert(`Failed to delete category: ${errorMsg}`)
    }
  }

  // Load analytics data
  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const [revenue, popular, peaks] = await Promise.all([
        getRevenueByDate(timeRange),
        getPopularItems(10),
        getPeakHours()
      ])
      setRevenueData(revenue)
      setPopularItemsData(popular)
      setPeakHoursData(peaks)
    } catch (error) {
      console.error('❌ Error loading analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Load analytics when switching to analytics tab or changing time range
  useEffect(() => {
    if (activeTab === 'analytics') {
      // eslint-disable-next-line
      void loadAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, timeRange])

  // Show loading state only on first load
  if (!hasLoadedOnce && (authLoading || loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized state
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-24 h-24 text-orange-500 mx-auto mb-6" />
          <h1 className="text-4xl font-black text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-8">You need admin privileges to access this page.</p>
          <Button asChild className="bg-gradient-to-r from-orange-500 to-red-600">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-900">
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-20 left-0 right-0 z-50 px-4">
        <Button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
          size="sm"
        >
          <Menu className="w-4 h-4 mr-2" />
          Menu
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar - Hidden since navigation is on dashboard */}
        <aside
          className={`hidden fixed lg:static w-64 min-h-screen bg-gradient-to-b from-gray-900 to-black border-r border-orange-500/20 p-6 z-40 transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-black text-white mb-2">Admin Panel</h1>
                <p className="text-gray-400 text-sm">Mami&apos;s Cocina</p>
              </div>
              {/* Close button for mobile */}
              <Button
                onClick={() => setMobileMenuOpen(false)}
                variant="ghost"
                size="sm"
                className="lg:hidden text-white hover:bg-white/10"
              >
                ✕
              </Button>
            </div>
            
            {/* Admin User Info */}
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-400">Signed in as</span>
              </div>
              <p className="text-sm text-white font-bold truncate">
                {user?.user_metadata?.full_name || user?.email}
              </p>
              <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full font-bold border border-orange-500/30">
                👑 Admin
              </span>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              // Orders disabled for Mami's Cocina
              // { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'menu', label: 'Menu Items', icon: MenuSquare },
              { id: 'categories', label: 'Categories', icon: Package },
              { id: 'hours', label: 'Restaurant Hours', icon: Clock },
              { id: 'menu-pdf', label: 'Menu PDF', icon: FileText },
              // Analytics disabled for Mami's Cocina
              // { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-bold">{item.label}</span>
              </button>
            ))}
            
            {/* Kitchen and Kiosk disabled for Mami's Cocina */}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto pt-16 lg:pt-8">
          {/* Header with Logo */}
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative h-32 w-80">
                <Image
                  src="/mamis_cocina_logo.png"
                  alt="Mami's Cocina Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-white">Admin Panel</h1>
                <p className="text-gray-400 text-sm">Mami&apos;s Cocina</p>
              </div>
              {activeTab !== 'dashboard' && (
                <Button
                  onClick={() => setActiveTab('dashboard')}
                  className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Return to Dashboard
                </Button>
              )}
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Admin User Info */}
              <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-400">Signed in as</span>
                </div>
                <p className="text-sm text-white font-bold">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full font-bold border border-orange-500/30">
                  👑 Admin
                </span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 lg:mb-8">Dashboard Overview</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-800 to-black border-2 border-orange-500/20 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-gray-400 text-sm mb-1">Menu Items</p>
                  <p className="text-3xl font-black text-white">{stats.menuItems}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-gray-800 to-black border-2 border-orange-500/20 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-gray-400 text-sm mb-1">Categories</p>
                  <p className="text-3xl font-black text-white">{stats.categories}</p>
                </motion.div>
              </div>

              {/* Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setActiveTab('menu')}
                  className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/40 rounded-2xl p-6 cursor-pointer hover:border-orange-500/80 hover:shadow-2xl hover:shadow-orange-500/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <MenuSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Menu Items</h3>
                      <p className="text-gray-400 text-sm">Manage your menu items</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setActiveTab('categories')}
                  className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/40 rounded-2xl p-6 cursor-pointer hover:border-blue-500/80 hover:shadow-2xl hover:shadow-blue-500/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Categories</h3>
                      <p className="text-gray-400 text-sm">Manage menu categories</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setActiveTab('hours')}
                  className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/40 rounded-2xl p-6 cursor-pointer hover:border-purple-500/80 hover:shadow-2xl hover:shadow-purple-500/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Restaurant Hours</h3>
                      <p className="text-gray-400 text-sm">Set operating hours</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => setActiveTab('menu-pdf')}
                  className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/40 rounded-2xl p-6 cursor-pointer hover:border-green-500/80 hover:shadow-2xl hover:shadow-green-500/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Menu PDF</h3>
                      <p className="text-gray-400 text-sm">Upload menu PDF</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-black text-white">Orders Management</h2>
              </div>

              {/* Orders Table */}
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-orange-500/20 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left p-4 text-gray-400 font-bold">Order #</th>
                        <th className="text-left p-4 text-gray-400 font-bold">Customer</th>
                        <th className="text-left p-4 text-gray-400 font-bold">Email</th>
                        <th className="text-left p-4 text-gray-400 font-bold">Phone</th>
                        <th className="text-left p-4 text-gray-400 font-bold">Total</th>
                        <th className="text-left p-4 text-gray-400 font-bold">Status</th>
                        <th className="text-left p-4 text-gray-400 font-bold">Date</th>
                        <th className="text-left p-4 text-gray-400 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                          <td className="p-4">
                            <span className="font-mono text-orange-500 font-bold">{order.order_number}</span>
                          </td>
                          <td className="p-4 text-white">{order.customer_name}</td>
                          <td className="p-4 text-gray-400 text-sm">{order.customer_email}</td>
                          <td className="p-4 text-gray-400 text-sm">{order.customer_phone}</td>
                          <td className="p-4 text-white font-bold">${order.total_amount.toFixed(2)}</td>
                          <td className="p-4">
                            <select
                              value={order.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value
                                try {
                                  await updateOrderStatus(order.id, newStatus)
                                  
                                  // Send status update email
                                  const statusMessages: Record<string, string> = {
                                    preparing: "Great news! Your order is being prepared right now. We'll notify you when it's ready for pickup.",
                                    completed: "Your order is ready! Come pick it up at your earliest convenience.",
                                    delivered: "Thank you for picking up your order! We hope you enjoy your meal.",
                                    cancelled: "Your order has been cancelled. If you have any questions, please contact us."
                                  }
                                  
                                  sendStatusUpdateEmail({
                                    orderNumber: order.order_number,
                                    customerName: order.customer_name,
                                    customerEmail: order.customer_email,
                                    status: newStatus,
                                    statusMessage: statusMessages[newStatus] || 'Your order status has been updated.'
                                  }).catch(err => console.error('Email send failed:', err))
                                  
                                  await loadData()
                                } catch (error) {
                                  console.error('Error updating order status:', error)
                                  alert('Failed to update order status')
                                }
                              }}
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                order.status === 'completed'
                                  ? 'bg-green-500/20 text-green-500'
                                  : order.status === 'preparing'
                                  ? 'bg-blue-500/20 text-blue-500'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-500/20 text-red-500'
                                  : order.status === 'delivered'
                                  ? 'bg-purple-500/20 text-purple-500'
                                  : 'bg-yellow-500/20 text-yellow-500'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="completed">Completed</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4 text-gray-400 text-sm">
                            {new Date(order.created_at).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                            >
                              <Link href={`/order-confirmation?order=${order.order_number}`}>
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-xl">No orders yet</p>
                      <p className="text-sm mt-2">Orders will appear here once customers place them</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Menu Items Tab */}
          {activeTab === 'menu' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
                <h2 className="text-2xl lg:text-3xl font-black text-white">Menu Items</h2>
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Item
                </Button>
              </div>

              {menuItems.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-800 to-black border-2 border-orange-500/20 rounded-2xl">
                  <MenuSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No menu items found. Add your first item!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 overflow-x-auto">
                  {menuItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-gray-800 to-black border-2 border-orange-500/20 rounded-2xl p-6 hover:border-orange-500/40 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 w-full">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                            {item.image_url && (item.image_url.startsWith('http') || item.image_url.startsWith('/')) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg border-2 border-orange-500/30"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-5xl">
                                {item.image_url || '🍔'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-black text-white">{item.name}</h3>
                              {item.is_popular && (
                                <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full font-bold border border-orange-500/30">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{item.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-orange-500 font-bold">${item.price.toFixed(2)}</span>
                              <span className="text-gray-500">
                                Category: {item.category?.name || 'Uncategorized'}
                              </span>
                              {item.calories && (
                                <span className="text-gray-500">{item.calories} cal</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
                <h2 className="text-2xl lg:text-3xl font-black text-white">Categories</h2>
                <Button 
                  onClick={() => setIsAddCategoryModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-800 to-black border-2 border-orange-500/20 rounded-2xl">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No categories found. Add your first category!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-gray-800 to-black border-2 border-orange-500/20 rounded-2xl p-6 hover:border-orange-500/40 transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-black text-white">{category.name}</h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingCategory(category)
                              setIsEditCategoryModalOpen(true)
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:bg-blue-500/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {category.description && (
                        <p className="text-gray-400 text-sm mb-3">{category.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full border border-orange-500/30">
                          {menuItems.filter(item => item.category_id === category.id).length} items
                        </span>
                        {category.is_active ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full border border-green-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-500 rounded-full border border-gray-500/30">
                            Inactive
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Restaurant Hours Tab */}
          {activeTab === 'hours' && (
            <RestaurantHours />
          )}

          {/* Menu PDF Tab */}
          {activeTab === 'menu-pdf' && (
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 lg:mb-8">Menu PDF Upload</h2>
              
              <div className="bg-gradient-to-br from-gray-800 to-black border-2 border-orange-500/20 rounded-2xl p-6 lg:p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Current Menu PDF</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Upload a PDF file that customers can download from the homepage
                  </p>
                  
                  {/* Check if menu.pdf exists */}
                  <div className="flex items-center gap-4 mb-6">
                    <a 
                      href="/menu.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:text-orange-400 underline"
                    >
                      View Current Menu PDF
                    </a>
                  </div>
                </div>

                {/* Upload Form */}
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-orange-500/50 transition-colors">
                  <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-white mb-2">Upload New Menu PDF</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Drag and drop your PDF file here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          alert('Please upload a PDF file')
                          return
                        }
                        // Handle file upload
                        const formData = new FormData()
                        formData.append('file', file)
                        
                        fetch('/api/upload-menu-pdf', {
                          method: 'POST',
                          body: formData
                        })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success) {
                            alert('Menu PDF uploaded successfully!')
                          } else {
                            alert('Error uploading PDF: ' + (data.error || 'Unknown error'))
                          }
                        })
                        .catch(err => {
                          console.error('Upload error:', err)
                          alert('Error uploading PDF')
                        })
                      }
                    }}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload">
                    <Button 
                      type="button"
                      className="bg-gradient-to-r from-orange-500 to-red-600 text-white cursor-pointer"
                      onClick={() => document.getElementById('pdf-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose PDF File
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-4">
                    Maximum file size: 10MB
                  </p>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-blue-400 mb-2">📝 Instructions</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Upload your menu as a PDF file</li>
                    <li>• The file will be saved as <code className="bg-gray-900 px-1 rounded">menu.pdf</code></li>
                    <li>• Customers can download it from the &ldquo;View Our Full Menu&rdquo; section on the homepage</li>
                    <li>• Make sure the PDF is clear and readable on mobile devices</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              {/* Header with Time Range Selector */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">📊 Analytics Dashboard</h2>
                  <p className="text-gray-400">Track your restaurant performance in real-time</p>
                </div>
                
                {/* Time Range Buttons */}
                <div className="flex gap-2 bg-gray-900/50 p-2 rounded-xl border border-gray-700">
                  {[
                    { days: 7, label: '7 Days' },
                    { days: 30, label: '30 Days' },
                    { days: 90, label: '90 Days' }
                  ].map(({ days, label }) => (
                    <button
                      key={days}
                      onClick={() => setTimeRange(days as 7 | 30 | 90)}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        timeRange === days
                          ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              {analyticsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-4" />
                  <p className="text-gray-400 text-lg">Loading analytics data...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Revenue Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gray-800 rounded-xl">
                          <TrendingUp className="w-6 h-6 text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                          Last {timeRange} days
                        </span>
                      </div>
                      <h3 className="text-gray-400 text-sm mb-2">Total Revenue</h3>
                      <p className="text-3xl font-black text-white mb-1">
                        ${revenueData.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{revenueData.length} completed orders</p>
                    </motion.div>

                    {/* Top Item Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gray-800 rounded-xl">
                          <TrendingUp className="w-6 h-6 text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                          Best Seller
                        </span>
                      </div>
                      <h3 className="text-gray-400 text-sm mb-2">Top Item</h3>
                      <p className="text-2xl font-black text-white mb-1 truncate">
                        {popularItemsData[0]?.name || 'No data'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {popularItemsData[0]?.quantity || 0} sold · ${popularItemsData[0]?.revenue?.toFixed(2) || '0.00'}
                      </p>
                    </motion.div>

                    {/* Peak Time Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gray-800 rounded-xl">
                          <TrendingUp className="w-6 h-6 text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                          Busiest
                        </span>
                      </div>
                      <h3 className="text-gray-400 text-sm mb-2">Peak Hour</h3>
                      <p className="text-3xl font-black text-white mb-1">
                        {[...peakHoursData].sort((a, b) => b.orders - a.orders)[0]?.hour || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[...peakHoursData].sort((a, b) => b.orders - a.orders)[0]?.orders || 0} orders
                      </p>
                    </motion.div>
                  </div>

                  {/* Revenue Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gray-800 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">Revenue Trends</h3>
                        <p className="text-sm text-gray-400">Daily revenue over time</p>
                      </div>
                    </div>
                    {revenueData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={revenueData}>
                          <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                          <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '2px solid #F97316',
                              borderRadius: '12px',
                              padding: '12px'
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#F97316" 
                            strokeWidth={4}
                            dot={{ fill: '#F97316', r: 6, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 8 }}
                            fill="url(#revenueGradient)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-16">
                        <p className="text-gray-400 text-lg mb-2">No revenue data available</p>
                        <p className="text-gray-500 text-sm">Complete some orders to see revenue trends</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Popular Items Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gray-800 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">Top 10 Best Sellers</h3>
                        <p className="text-sm text-gray-400">Most popular menu items by sales</p>
                      </div>
                    </div>
                    {popularItemsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={450}>
                        <BarChart data={popularItemsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#9CA3AF" 
                            angle={-45} 
                            textAnchor="end" 
                            height={120}
                            style={{ fontSize: '11px' }}
                          />
                          <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '2px solid #3B82F6',
                              borderRadius: '12px',
                              padding: '12px'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="quantity" fill="#3B82F6" name="Quantity Sold" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="revenue" fill="#10B981" name="Revenue ($)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-16">
                        <p className="text-gray-400 text-lg mb-2">No sales data available</p>
                        <p className="text-gray-500 text-sm">Items will appear here as orders come in</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Peak Hours Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gray-800 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">Peak Hours Analysis</h3>
                        <p className="text-sm text-gray-400">Order volume throughout the day</p>
                      </div>
                    </div>
                    {peakHoursData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={peakHoursData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="hour" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                          <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '2px solid #A855F7',
                              borderRadius: '12px',
                              padding: '12px'
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="orders" 
                            fill="#A855F7" 
                            name="Number of Orders"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-16">
                        <p className="text-gray-400 text-lg mb-2">No order timing data available</p>
                        <p className="text-gray-500 text-sm">Data will populate as orders are placed</p>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-800 to-black border-2 border-orange-500/20 rounded-2xl p-6 lg:p-8 max-w-2xl w-full my-8"
          >
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-6">Edit Menu Item</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Description</label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Calories</label>
                  <input
                    type="number"
                    value={editingItem.calories || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, calories: parseInt(e.target.value) || undefined })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Category</label>
                <select
                  value={editingItem.category_id || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, category_id: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Image (emoji or URL)</label>
                <input
                  type="text"
                  value={editingItem.image_url || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                  placeholder="🍔"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_popular"
                  checked={editingItem.is_popular}
                  onChange={(e) => setEditingItem({ ...editingItem, is_popular: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="is_popular" className="text-sm text-gray-300">Mark as Popular</label>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                onClick={handleSaveEdit}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white"
              >
                Save Changes
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingItem(null)
                }}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-800 to-black border-2 border-orange-500/20 rounded-2xl p-6 lg:p-8 max-w-2xl w-full my-8"
          >
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-6">Add New Menu Item</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Classic Burger"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Delicious burger with fresh ingredients..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                    placeholder="9.99"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Calories</label>
                  <input
                    type="number"
                    value={newItem.calories || ''}
                    onChange={(e) => setNewItem({ ...newItem, calories: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                    placeholder="650"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Category</label>
                <select
                  value={newItem.category_id}
                  onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Image</label>
                
                {/* Image Preview */}
                {(imagePreview || (newItem.image_url && (newItem.image_url.startsWith('http') || newItem.image_url.startsWith('/')))) && (
                  <div className="mb-3 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imagePreview || newItem.image_url} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border-2 border-orange-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null)
                        setImagePreview(null)
                        setNewItem({ ...newItem, image_url: '🍔' })
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {/* Tabbed Upload Options */}
                <div className="space-y-3">
                  {/* Option 1: Upload File */}
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <label className="text-sm font-semibold text-white mb-2 block">📁 Upload from Computer</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                    />
                  </div>

                  {/* Option 2: Image URL */}
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <label className="text-sm font-semibold text-white mb-2 block">🔗 Or use Image URL</label>
                    <input
                      type="url"
                      value={newItem.image_url.startsWith('http') ? newItem.image_url : ''}
                      onChange={(e) => {
                        setNewItem({ ...newItem, image_url: e.target.value })
                        setSelectedFile(null)
                        setImagePreview(null)
                      }}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                    <p className="text-xs text-gray-500 mt-1">💡 Paste URL from Unsplash, Pexels, or any image link</p>
                  </div>

                  {/* Option 3: Emoji */}
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <label className="text-sm font-semibold text-white mb-2 block">😊 Or use an Emoji</label>
                    <input
                      type="text"
                      value={!newItem.image_url.startsWith('http') && !newItem.image_url.startsWith('/') ? newItem.image_url : ''}
                      onChange={(e) => {
                        setNewItem({ ...newItem, image_url: e.target.value || '🍔' })
                        setSelectedFile(null)
                        setImagePreview(null)
                      }}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none text-center text-2xl"
                      placeholder="🍔 🍟 🥤"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_popular_new"
                  checked={newItem.is_popular}
                  onChange={(e) => setNewItem({ ...newItem, is_popular: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="is_popular_new" className="text-sm text-gray-300">Mark as Popular</label>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                onClick={handleAddNew}
                disabled={uploadingImage}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white disabled:opacity-50"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Add Item'
                )}
              </Button>
              <Button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setNewItem({
                    name: '',
                    description: '',
                    price: 0,
                    category_id: '',
                    calories: 0,
                    is_popular: false,
                    image_url: '🍔',
                  })
                }}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-800 to-black border-2 border-blue-500/40 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-2xl font-black text-white mb-6">Add New Category</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category Name *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Burgers, Drinks, Desserts"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                onClick={handleAddCategory}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
              >
                Add Category
              </Button>
              <Button
                onClick={() => {
                  setIsAddCategoryModalOpen(false)
                  setNewCategory({
                    name: '',
                    description: '',
                  })
                }}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-800 to-black border-2 border-blue-500/40 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-2xl font-black text-white mb-6">Edit Category</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category Name *</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Burgers, Drinks, Desserts"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                <textarea
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                onClick={handleEditCategory}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
              >
                Update Category
              </Button>
              <Button
                onClick={() => {
                  setIsEditCategoryModalOpen(false)
                  setEditingCategory(null)
                }}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
