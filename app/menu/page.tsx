'use client'

import { Search, Flame, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getMenuItems, getCategories } from '@/lib/supabase/database'
import type { MenuItem, MenuCategory } from '@/types'

export default function MenuPage() {
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

  // Filter items by search only
  const searchFilteredItems = menuItems.filter((item) => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(searchLower) ||
      (item.description?.toLowerCase() || '').includes(searchLower) ||
      (item.customization_options || []).some(option => 
        option.name.toLowerCase().includes(searchLower) ||
        option.options.some(choice => choice.label.toLowerCase().includes(searchLower))
      )
    )
  })

  // Group items by category
  const itemsByCategory = categories.map(category => ({
    category,
    items: searchFilteredItems.filter(item => item.category?.name === category.name)
  })).filter(group => group.items.length > 0)

  // Scroll to category section
  const scrollToCategory = (categoryName: string) => {
    const element = document.getElementById(`category-${categoryName}`)
    if (element) {
      const offset = 100 // Offset for fixed header
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
    }
  }

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
              href="/api/menu-pdf"
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
            {/* Spicy Note */}
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <span className="text-3xl">🌶️</span>
              <p className="text-sm text-gray-300">
                <span className="font-bold text-white">Spicy Items:</span> Look for the chili pepper 🌶️ next to menu items that pack some heat!
              </p>
            </div>

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

            {/* Category Buttons - Scroll to sections */}
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => scrollToCategory(category.name)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-lg font-bold transition-all text-sm bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-2 border-gray-700 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/30"
                >
                  <span className="text-white">{category.name}</span>
                  <span className="text-orange-400 ml-2">
                    {category.name_es || category.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
              <p className="text-xl text-gray-400 mt-4">Loading menu...</p>
            </div>
          ) : itemsByCategory.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-400">No items found matching your search</p>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {/* Category Sections */}
              {itemsByCategory.map((group, groupIndex) => (
                <motion.section
                  key={group.category.id}
                  id={`category-${group.category.name}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: groupIndex * 0.1 }}
                  className="scroll-mt-24"
                >
                  {/* Category Header */}
                  <div className="mb-6">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                      {group.category.name}
                      <span className="text-orange-400 font-normal ml-2">
                        {group.category.name_es || group.category.name}
                      </span>
                    </h2>
                    {(group.category.description || group.category.description_es) && (
                      <p className="text-lg text-gray-400 italic">
                        {group.category.description}
                        {group.category.description_es && group.category.description_es !== group.category.description && (
                          <span className="text-orange-400/70 ml-2">{group.category.description_es}</span>
                        )}
                      </p>
                    )}
                    <div className="h-1 w-24 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mt-3"></div>
                  </div>

                  {/* Items in this category */}
                  <div className="flex flex-col gap-4">
                    {group.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        whileHover={{ x: 8, transition: { duration: 0.3 } }}
                        className="group relative"
                      >
                        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-orange-500/20 rounded-xl overflow-hidden hover:border-orange-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 flex flex-row items-center">
                          {/* Popular Badge */}
                          {item.is_popular && (
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-lg flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Popular
                            </div>
                          )}
                          
                          {/* Image Area */}
                          <div className="relative w-32 h-32 flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                            {item.image_url && (
                              <motion.img
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.4 }}
                                src={item.image_url.includes('unsplash.com') 
                                  ? `${item.image_url.split('?')[0]}?w=300&q=80&auto=format`
                                  : item.image_url
                                }
                                alt={item.name}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-4 flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-black text-white">
                                  {item.name}
                                  <span className="text-orange-400 font-normal ml-2">
                                    {item.name_es || item.name}
                                  </span>
                                </h3>
                                {item.is_spicy && (
                                  <motion.span
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-xl"
                                    title="Spicy"
                                  >
                                    🌶️
                                  </motion.span>
                                )}
                              </div>
                              <p className="text-gray-400 text-sm line-clamp-3">
                                {item.description}
                                {(item.description_es || item.description) && (
                                  <span className="text-orange-400/60 block mt-1">
                                    {item.description_es || item.description}
                                  </span>
                                )}
                              </p>
                              
                              {/* Customization Options */}
                              {item.customization_options && item.customization_options.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-700">
                                  {item.customization_options.map((option, idx) => (
                                    <div key={idx} className="mb-2">
                                      <div className="text-xs font-bold text-orange-400 mb-1">
                                        {option.name}
                                        <span className="text-orange-300 font-normal ml-1">
                                          {option.name_es || option.name}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {option.options
                                          .sort((a, b) => (a.price_modifier ?? 0) - (b.price_modifier ?? 0))
                                          .map((choice, choiceIdx) => (
                                          <span 
                                            key={choiceIdx}
                                            className="inline-flex items-center px-2 py-1 bg-gray-800/50 rounded text-xs text-gray-300 border border-gray-700"
                                          >
                                            <span>
                                              {choice.label}
                                              <span className="text-orange-400/70 ml-1">
                                                {choice.label_es || choice.label}
                                              </span>
                                            </span>
                                            {(choice.price_modifier ?? 0) > 0 && (
                                              <span className="ml-1 text-orange-400 font-semibold">+${choice.price_modifier}</span>
                                            )}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center ml-4">
                              <span className="text-2xl font-black text-orange-500">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
