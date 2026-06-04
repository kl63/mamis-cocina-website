'use client'

import { Search, Flame, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getMenuItems, getCategories } from '@/lib/supabase/database'
import type { MenuItem, MenuCategory } from '@/types'

// Emoji mapping for categories (temporary until we have real images)
const categoryEmojis: Record<string, string> = {
  'Burgers': '🍔',
  'Sides': '�',
  'Drinks': '🥤',
  'Desserts': '🍰',
}

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Add timeout to prevent infinite loading
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Menu fetch timeout')), 10000)
        )
        
        const dataPromise = Promise.all([
          getMenuItems(),
          getCategories(),
        ])
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [itemsData, categoriesData] = await Promise.race([dataPromise, timeout]) as any
        
        setMenuItems(itemsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error('❌ Error fetching menu data:', error)
        // Set empty arrays so UI doesn't stay loading forever
        setMenuItems([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Build category list
  const categoryList = ['All', ...categories.map(cat => cat.name)]

  const filteredItems = menuItems.filter((item) => {
    const categoryName = item.category?.name || ''
    const matchesCategory = selectedCategory === 'All' || categoryName === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dramatic Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-950 via-black to-gray-900 py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(255,100,0,.05) 35px, rgba(255,100,0,.05) 36px)',
          }} />
        </div>
        
        {/* Animated glow */}
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-10 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
        />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 px-6 py-3 text-sm font-bold text-orange-500 border-2 border-orange-500/40 mb-6"
            >
              <Flame className="w-4 h-4 inline mr-2" />
              EXPLORE OUR MENU
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
                From Our Casa
              </span>
              <br />
              <span className="text-white">to Yours</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-4">
              Authentic Mexican cuisine made with love and tradition
            </p>
            <p className="text-sm md:text-base text-yellow-400/90 max-w-2xl mx-auto bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2">
              ⚠️ Menu prices are subject to change. Please ask for current pricing. Thanks!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Menu PDF Download Section */}
      <section className="py-10 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/40 rounded-2xl p-5 lg:p-6 text-center"
          >
            <h2 className="text-xl md:text-2xl font-black text-white mb-2">View Our Full Menu</h2>
            <p className="text-sm text-gray-300 mb-4 max-w-2xl mx-auto">Download our complete menu to see all our delicious offerings</p>
            <a
              href="/menu.pdf"
              download="Mamis-Cocina-Menu.pdf"
              className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Download Menu PDF
            </a>
          </motion.div>
        </div>
      </section>

      <div className="flex-1 bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col gap-6 mb-12"
          >
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search flame-grilled goodness..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-orange-500/30 bg-gray-900/50 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 backdrop-blur-sm transition-all"
              />
            </div>

            {/* Category Buttons */}
            <div className="flex flex-wrap gap-3">
              {categoryList.map((category) => (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/50'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-2 border-gray-700 hover:border-orange-500/30'
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
              <p className="text-xl text-gray-400 mt-4">Loading menu...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-400">No items found matching your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative h-full"
                >
                  <Link href={`/menu/${item.id}`} className="block h-full">
                    <div className="h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-orange-500/20 rounded-2xl overflow-hidden hover:border-orange-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 cursor-pointer flex flex-col">
                    {/* Popular Badge */}
                    {item.is_popular && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-lg flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Popular
                      </div>
                    )}
                    
                    {/* Image Area */}
                    <div className="relative h-56 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                      {item.image_url ? (
                        <motion.img
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.4 }}
                          src={item.image_url.includes('unsplash.com') 
                            ? `${item.image_url.split('?')[0]}?w=600&q=80&auto=format`
                            : item.image_url
                          }
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 5 }}
                          transition={{ duration: 0.4 }}
                          className="text-8xl filter drop-shadow-2xl"
                        >
                          {categoryEmojis[item.category?.name || 'Tacos'] || '�'}
                        </motion.div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Flame effect */}
                      <motion.div
                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute bottom-3 right-3 text-3xl"
                      >
                        🔥
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-2xl font-black text-white mb-2">{item.name}</h3>
                        <p className="text-gray-400 text-sm">{item.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-3xl font-black text-orange-500">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
