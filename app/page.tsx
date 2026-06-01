'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Zap, Star, TrendingUp, Flame, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getPopularMenuItems } from '@/lib/supabase/database'
import type { MenuItem } from '@/types'

// Emoji mapping for categories
const categoryEmojis: Record<string, string> = {
  'Tacos': '🌮',
  'Burritos': '�',
  'Quesadillas': '🧀',
  'Sides': '🫔',
  'Drinks': '🥤',
  'Desserts': '�',
}

export default function Home() {
  const [popularItems, setPopularItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch popular items and restaurant status on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [items, statusResponse] = await Promise.all([
          getPopularMenuItems(),
          fetch('/api/restaurant-status')
        ])
        
        setPopularItems(items.slice(0, 3)) // Show only 3 items
        
        const statusData = await statusResponse.json()
        setIsOpen(statusData.isOpen)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero Section with Animations - Dark & Dramatic */}
      <section className="relative bg-gradient-to-b from-gray-950 via-gray-900 to-background py-20 md:py-32 overflow-hidden">
        {/* Background Burger Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1920&h=1080&fit=crop&q=80"
            alt="Delicious tacos background"
            fill
            className="object-cover opacity-50"
            priority
            sizes="100vw"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        </div>

        {/* Animated glow elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-20 right-10 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            className="absolute bottom-20 left-10 w-96 h-96 bg-red-500/30 rounded-full blur-3xl"
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`inline-block rounded-full px-6 py-3 text-base font-bold border-2 mb-8 ${
                isOpen 
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/40' 
                  : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border-red-500/40'
              }`}
            >
              <Flame className="w-5 h-5 inline mr-2" />
              {isOpen ? 'WE ARE OPEN' : 'CLOSED'}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-tight mb-8"
            >
              <span className="bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                Authentic
              </span>
              <br />
              <span className="text-white">
                Mexican Flavor
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl md:text-3xl text-gray-300 max-w-3xl mx-auto font-medium mb-12"
            >
              Authentic tacos made with love, served with tradition.
              <br />
              <span className="text-red-400 font-bold">¡Bienvenidos a Mami&apos;s Cocina!</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Button asChild className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black text-lg px-10 py-7 rounded-full shadow-2xl hover:scale-110 transition-all">
                <Link href="/menu">
                  <Flame className="mr-2 w-6 h-6" />
                  ORDER NOW
                  <ChevronRight className="ml-2 w-6 h-6" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 font-black text-lg px-10 py-7 rounded-full transition-all">
                <Link href="/about">LEARN MORE</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Menu Preview Section - Dramatic Style */}
      <section className="py-24 bg-gradient-to-b from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 36px)',
          }} />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-4 text-white">
              <span className="bg-gradient-to-r from-red-400 via-yellow-500 to-green-500 bg-clip-text text-transparent">
                Featured Menu
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Authentic Mexican dishes made fresh daily
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-16 col-span-3">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
              <p className="text-xl text-gray-400 mt-4">Loading popular items...</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {popularItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -12, transition: { duration: 0.3 } }}
                className="group relative"
              >
                <Link href={`/menu/${item.id}`}>
                  <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-orange-500/20 rounded-2xl overflow-hidden hover:border-orange-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 cursor-pointer">
                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold z-10 shadow-lg flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      Popular
                    </div>
                    
                    {/* Image Area */}
                    <div className="relative h-64 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                      {item.image_url ? (
                        <motion.img
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.4 }}
                          src={item.image_url.includes('unsplash.com') 
                            ? `${item.image_url.split('?')[0]}?w=800&q=80&auto=format`
                            : item.image_url
                          }
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 5 }}
                          transition={{ duration: 0.4 }}
                          className="text-9xl filter drop-shadow-2xl"
                        >
                          {categoryEmojis[item.category?.name || 'Tacos'] || '🌮'}
                        </motion.div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Flame effects */}
                      <motion.div
                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute bottom-4 right-4 text-4xl"
                      >
                        🔥
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-black text-white">{item.name}</h3>
                        <span className="text-3xl font-black text-orange-500">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-gray-400 text-base">{item.description}</p>
                      
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-base py-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          )}

          {/* View Full Menu Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <Button asChild size="lg" variant="outline" className="!text-white border-2 border-orange-500 hover:bg-orange-500 hover:!text-white text-lg px-8 py-6 bg-transparent">
              <Link href="/menu">
                View Full Menu
                <ChevronRight className="ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section with Animations */}
      <section className="py-24 bg-gradient-to-b from-black via-gray-950 to-black relative overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,100,0,0.3) 0%, transparent 50%)',
          }} />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black">
              <span className="bg-gradient-to-r from-red-400 via-yellow-500 to-green-500 bg-clip-text text-transparent">
                Why Choose Mami&apos;s Cocina?
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Traditional recipes passed down through generations - taste authentic Mexico
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Flame,
                title: 'Authentic Recipes',
                description: 'Traditional Mexican recipes passed down from Mami herself',
                gradient: 'from-red-500/20 to-yellow-600/20',
                border: 'border-red-500/30',
                iconColor: 'text-red-500',
                shadow: 'hover:shadow-red-500/20',
                delay: 0,
              },
              {
                icon: Star,
                title: 'Fresh Ingredients',
                description: 'Handmade tortillas and fresh ingredients prepared daily',
                gradient: 'from-yellow-500/20 to-green-600/20',
                border: 'border-yellow-500/30',
                iconColor: 'text-yellow-500',
                shadow: 'hover:shadow-yellow-500/20',
                delay: 0.1,
              },
              {
                icon: Zap,
                title: 'Bold Spices',
                description: 'Authentic Mexican spices and homemade salsas',
                gradient: 'from-green-600/20 to-red-500/20',
                border: 'border-green-600/30',
                iconColor: 'text-green-600',
                shadow: 'hover:shadow-green-600/20',
                delay: 0.2,
              },
              {
                icon: TrendingUp,
                title: 'Family Tradition',
                description: 'Serving the community with love since generations',
                gradient: 'from-red-600/20 to-yellow-500/20',
                border: 'border-red-600/30',
                iconColor: 'text-red-600',
                shadow: 'hover:shadow-red-600/20',
                delay: 0.3,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: feature.delay }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`bg-gradient-to-br from-gray-900 to-black border-2 ${feature.border} rounded-2xl p-8 space-y-4 hover:border-opacity-100 transition-all hover:shadow-2xl ${feature.shadow} group cursor-pointer backdrop-blur-sm`}
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center border-2 ${feature.border}`}
                >
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </motion.div>
                <h3 className="text-2xl font-black text-white">{feature.title}</h3>
                <p className="text-gray-400 text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - SUPER DRAMATIC */}
      <section className="py-32 bg-gradient-to-br from-red-600 via-yellow-600 to-green-700 relative overflow-hidden">
        {/* Animated pattern background */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(255,255,255,.1) 50px, rgba(255,255,255,.1) 51px)',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-tight"
            >
              ¿Listo Para <br className="hidden md:block" />
              Sabor Auténtico?
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-3xl text-white/95 mb-12 max-w-4xl mx-auto font-medium"
            >
              Order now and taste authentic Mexican cuisine delivered in <span className="font-black text-yellow-300">30 minutes</span> or it&apos;s <span className="font-black text-yellow-300">FREE!</span>
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Button asChild className="bg-white text-red-600 hover:bg-gray-100 px-12 py-8 text-xl rounded-full shadow-2xl hover:scale-110 transition-all duration-300 font-black">
                <Link href="/menu">
                  <Flame className="mr-3 w-6 h-6" />
                  Order Now
                  <ChevronRight className="ml-3 w-6 h-6" />
                </Link>
              </Button>

              <Button asChild className="bg-transparent border-4 border-white text-white hover:bg-white hover:text-red-600 px-12 py-8 text-xl rounded-full transition-all duration-300 font-black shadow-2xl">
                <Link href="/about">
                  Our Story
                </Link>
              </Button>
            </motion.div>

            {/* Floating decorative elements */}
            <motion.div
              animate={{ y: [-15, 15, -15], rotate: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-10 left-20 text-7xl hidden lg:block"
            >
              �
            </motion.div>
            <motion.div
              animate={{ y: [15, -15, 15], rotate: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute bottom-10 right-20 text-7xl hidden lg:block"
            >
              �
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute top-1/2 left-10 text-6xl hidden lg:block"
            >
              🌶️
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, -180, -360] }}
              transition={{ duration: 5, repeat: Infinity, delay: 2 }}
              className="absolute top-1/2 right-10 text-6xl hidden lg:block"
            >
              🌶️
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
