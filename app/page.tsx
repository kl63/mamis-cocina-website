'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Zap, Star, TrendingUp, Flame, ChevronRight, Clock, MapPin, Phone } from 'lucide-react'
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

interface RestaurantHours {
  day: string
  open_time: string
  close_time: string
  is_closed: boolean
}

// Cache hours data to avoid refetching on every render
let cachedHours: RestaurantHours[] | null = null
let lastHoursFetchTime = 0
const HOURS_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function Home() {
  const [popularItems, setPopularItems] = useState<MenuItem[]>([])
  const [hours, setHours] = useState<RestaurantHours[]>(cachedHours || [])
  const [loading, setLoading] = useState(true)

  // Fetch popular items and hours on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const now = Date.now()
        
        // Fetch popular items
        const items = await getPopularMenuItems()
        console.log('🌟 Popular items fetched:', items.length)
        console.log('🌟 Items:', items.map(i => ({ name: i.name, is_featured: i.is_featured, is_popular: i.is_popular })))
        setPopularItems(items.slice(0, 3)) // Show only 3 items

        // Only fetch hours if cache is empty or expired
        let fetchedHours = cachedHours || []
        if (!cachedHours || now - lastHoursFetchTime > HOURS_CACHE_DURATION) {
          const hoursResponse = await fetch('/api/restaurant-hours')
          const hoursData = await hoursResponse.json()
          fetchedHours = hoursData.hours || []
          cachedHours = fetchedHours
          lastHoursFetchTime = now
          setHours(fetchedHours)
        }

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Format time from 24h to 12h format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

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
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight mb-6 md:mb-8"
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
              className="text-lg md:text-2xl lg:text-3xl text-gray-300 max-w-3xl mx-auto font-medium mb-8 md:mb-12 px-4"
            >
              Authentic tacos made with love, served with tradition.
              <br />
              <span className="text-red-400 font-bold">¡Bienvenidos a Mami&apos;s Cocina!</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4"
            >
              <Button asChild className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-full shadow-2xl hover:scale-110 transition-all w-full sm:w-auto max-w-xs">
                <Link href="/menu">
                  <Flame className="mr-2 w-6 h-6" />
                  ORDER NOW
                  <ChevronRight className="ml-2 w-6 h-6" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 font-black text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-full transition-all w-full sm:w-auto max-w-xs">
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
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 text-white">
              <span className="bg-gradient-to-r from-red-400 via-yellow-500 to-green-500 bg-clip-text text-transparent">
                Popular Items
              </span>
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto px-4">
              From our casa to yours
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-16 col-span-3">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
              <p className="text-xl text-gray-400 mt-4">Loading popular items...</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {popularItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -12, transition: { duration: 0.3 } }}
                className="group relative h-full"
              >
                  <div className="h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-orange-500/20 rounded-2xl overflow-hidden hover:border-orange-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 flex flex-col">
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
                    </div>
                  </div>
              </motion.div>
            ))}
          </div>
          )}

          {/* Menu Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12"
          >
            <Button asChild size="lg" variant="outline" className="!text-white border-2 border-orange-500 hover:bg-orange-500 hover:!text-white text-lg px-8 py-6 bg-transparent w-full sm:w-auto">
              <Link href="/menu">
                View Full Menu
                <ChevronRight className="ml-2" />
              </Link>
            </Button>
            
            <Button 
              asChild 
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg px-8 py-6 w-full sm:w-auto"
            >
              <a href="/api/menu-pdf" download="Mamis-Cocina-Menu.pdf" className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Menu
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Visit & Order Section */}
      <section className="py-16 bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
              Visit & Order
            </h2>
            <p className="text-lg text-gray-400">Visit us in person or order through our delivery partners</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/40 rounded-xl p-6 text-center hover:border-orange-500/80 transition-all"
            >
              <Phone className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Call Us</h3>
              <a href="tel:+19089376927" className="text-lg font-bold text-orange-400 hover:text-orange-300 transition-colors">
                (908) 937-6927
              </a>
              <p className="text-xs text-gray-400 mt-2">For pickup</p>
            </motion.div>

            {/* Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-orange-500/20 rounded-xl p-6 text-center hover:border-orange-500/60 transition-all"
            >
              <MapPin className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Location</h3>
              <p className="text-gray-300 text-sm">449 N Wood Ave</p>
              <p className="text-gray-300 text-sm">Linden, NJ 07036</p>
            </motion.div>

            {/* Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-orange-500/20 rounded-xl p-6 text-center hover:border-orange-500/60 transition-all"
            >
              <Clock className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Hours</h3>
              <div className="space-y-0.5">
                {hours.length > 0 ? (
                  hours.slice(0, 3).map((hour) => (
                    <p key={hour.day} className="text-gray-300 text-xs">
                      <span className="font-medium">{hour.day}:</span>{' '}
                      {hour.is_closed ? 'Closed' : `${formatTime(hour.open_time)} - ${formatTime(hour.close_time)}`}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">Loading hours...</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Full Delivery Apps List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 bg-gradient-to-br from-gray-800 to-black border-2 border-orange-500/20 rounded-2xl p-8 max-w-2xl mx-auto"
          >
            <h3 className="text-2xl font-black text-white mb-6 text-center">Order Delivery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="https://www.doordash.com/store/mami's-cocina-linden-24308030/17317546/?srsltid=AfmBOopVllBPPKV5qtyFLuA6NixuTiFRKCCwSiwXSz7sQYQ4y5C-VVdC"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 p-4 bg-gray-900/50 rounded-xl hover:bg-orange-500/10 hover:border-orange-500/50 border-2 border-transparent transition-all group"
              >
                <div className="w-16 h-16 relative">
                  <Image src="/doordash.png" alt="DoorDash" fill className="object-contain" />
                </div>
                <span className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors">DoorDash</span>
              </a>
              <a
                href="https://www.ubereats.com/store/mamis-cocina-mexican-food/rCY4v4F3TWaxcvg1jhcChA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 p-4 bg-gray-900/50 rounded-xl hover:bg-orange-500/10 hover:border-orange-500/50 border-2 border-transparent transition-all group"
              >
                <div className="w-16 h-16 relative">
                  <Image src="/uber_eats.jpeg" alt="Uber Eats" fill className="object-contain" />
                </div>
                <span className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors">Uber Eats</span>
              </a>
              <a
                href="https://www.grubhub.com/restaurant/mamis-cocina-449-n-wood-ave-linden/3035604"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 p-4 bg-gray-900/50 rounded-xl hover:bg-orange-500/10 hover:border-orange-500/50 border-2 border-transparent transition-all group"
              >
                <div className="w-16 h-16 relative">
                  <Image src="/grubhub.png" alt="Grubhub" fill className="object-contain" />
                </div>
                <span className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors">Grubhub</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section with Animations */}
      <section className="py-24 bg-gradient-to-b from-gray-900 via-black to-gray-900 relative overflow-hidden">
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
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black">
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
              Listo Para <br className="hidden md:block" />
              Sabor Auténtico?
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-2xl lg:text-3xl text-white/95 mb-8 md:mb-12 max-w-4xl mx-auto font-medium px-4"
            >
              Order now and taste <span className="font-black text-yellow-300">authentic Mexican cuisine!</span>
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4"
            >
              <Button asChild className="bg-white text-red-600 hover:bg-gray-100 px-8 sm:px-12 py-6 sm:py-8 text-lg sm:text-xl rounded-full shadow-2xl hover:scale-110 transition-all duration-300 font-black w-full sm:w-auto max-w-xs">
                <Link href="/menu">
                  <Flame className="mr-3 w-6 h-6" />
                  Order Now
                  <ChevronRight className="ml-3 w-6 h-6" />
                </Link>
              </Button>

              <Button asChild className="bg-transparent border-4 border-white text-white hover:bg-white hover:text-red-600 px-8 sm:px-12 py-6 sm:py-8 text-lg sm:text-xl rounded-full transition-all duration-300 font-black shadow-2xl w-full sm:w-auto max-w-xs">
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
