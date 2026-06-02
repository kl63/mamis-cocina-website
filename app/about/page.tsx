'use client'

import { motion } from 'framer-motion'
import { Flame, Heart, Users, Award, Zap, Target } from 'lucide-react'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Dramatic Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-950 via-black to-gray-900 py-20 md:py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(255,100,0,.05) 50px, rgba(255,100,0,.05) 51px)',
          }} />
        </div>
        
        {/* Animated glows */}
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ opacity: [0.2, 0.3, 0.2], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block rounded-full bg-gradient-to-r from-red-500/20 to-yellow-500/20 px-6 py-3 text-sm font-bold text-red-500 border-2 border-red-500/40 mb-8"
            >
              <Heart className="w-4 h-4 inline mr-2" />
              NUESTRA HISTORIA
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black mb-8">
              <span className="bg-gradient-to-r from-red-400 via-yellow-500 to-green-500 bg-clip-text text-transparent">
                Authentic Mexican
              </span>
              <br />
              <span className="text-white">Tradition</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Bringing generations of Mexican culinary tradition to your table with love and authenticity
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-b from-gray-900 via-black to-gray-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '25K+', label: 'Happy Customers', icon: Users },
              { number: '100%', label: 'Handmade Tortillas', icon: Heart },
              { number: '20min', label: 'Avg Delivery Time', icon: Zap },
              { number: '4.8★', label: 'Customer Rating', icon: Award },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500/20 to-yellow-600/20 border-2 border-red-500/30 rounded-2xl mb-4">
                  <stat.icon className="w-8 h-8 text-red-500" />
                </div>
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-red-400 to-yellow-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-gradient-to-b from-gray-900 via-black to-gray-900 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                <span className="bg-gradient-to-r from-red-400 via-yellow-500 to-green-500 bg-clip-text text-transparent">
                  Family Connection
                </span>
              </h2>
              <div className="space-y-6 text-lg text-gray-300">
                <p>
                  Mami&apos;s Cocina is more than just a restaurant; it&apos;s our family&apos;s kitchen, shared with you. 
                  For over 7 years, we&apos;ve been passing down cherished family recipes, the kind we grew up with 
                  and love to eat. We&apos;ve poured our heart and soul into every dish, using flavors and traditions 
                  that have been in our family for generations.
                </p>
                <p>
                  We want you to feel the same warmth and joy we do when we sit down for a big family meal. 
                  From our Casa to yours.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-orange-500/30 rounded-3xl overflow-hidden">
                <div className="relative h-[500px]">
                  <Image
                    src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop&q=80"
                    alt="Authentic Mexican tacos"
                    fill
                    className="object-cover opacity-80"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Dark overlay for contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
                
                {/* Chili pepper effect */}
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute bottom-8 right-8 text-6xl z-10"
                >
                  🌶️
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="bg-gradient-to-b from-gray-900 via-black to-gray-900 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-red-400 via-yellow-500 to-green-500 bg-clip-text text-transparent">
                Our Values
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Family Tradition',
                description: 'Authentic recipes passed down through generations, made with love and care.',
                gradient: 'from-red-500/20 to-yellow-600/20',
              },
              {
                icon: Flame,
                title: 'Fresh & Authentic',
                description: 'Handmade tortillas daily, fresh ingredients, and traditional cooking methods.',
                gradient: 'from-yellow-500/20 to-green-600/20',
              },
              {
                icon: Target,
                title: 'Community First',
                description: 'Serving our community with warmth, hospitality, and the flavors of home.',
                gradient: 'from-green-600/20 to-red-500/20',
              },
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-red-500/20 rounded-2xl p-8 hover:border-red-500/60 transition-all hover:shadow-2xl hover:shadow-red-500/20"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${value.gradient} border-2 border-red-500/30 rounded-xl flex items-center justify-center mb-6`}>
                  <value.icon className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4">{value.title}</h3>
                <p className="text-gray-400 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="bg-gradient-to-br from-red-600 via-yellow-600 to-green-700 py-20 relative overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(255,255,255,.1) 50px, rgba(255,255,255,.1) 51px)',
          }}
        />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8">
              Nuestra Misión
            </h2>
            <p className="text-xl md:text-2xl text-white/95 leading-relaxed">
              To share the authentic flavors and warmth of Mexican tradition with our community. 
              Every taco we make, every salsa we prepare, and every customer we serve is welcomed 
              like family. ¡Bienvenidos a Mami&apos;s Cocina!
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
