'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(255,100,0,.05) 50px, rgba(255,100,0,.05) 51px)',
        }} />
      </div>

      {/* Animated Glows */}
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

      <div className="max-w-2xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* 404 with Logo */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8 flex items-center justify-center"
          >
            <h1 className="text-[150px] md:text-[200px] font-black leading-none">
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
                4
              </span>
            </h1>
            <div className="relative w-[150px] h-[150px] md:w-[200px] md:h-[200px]">
              <Image
                src="/mamis_cocina_logo.png"
                alt="Mami's Cocina Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-[150px] md:text-[200px] font-black leading-none">
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
                4
              </span>
            </h1>
          </motion.div>

          {/* Burger Emoji */}
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="text-8xl mb-8"
          >
            🍔
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Page Not Found
            </h2>
            <p className="text-xl text-gray-400 max-w-md mx-auto">
              Looks like this burger got lost on the way to your table. Let&apos;s get you back on track!
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button asChild className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black text-lg px-8 py-6 rounded-xl">
              <Link href="/">
                <Home className="mr-2 w-5 h-5" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-2 border-orange-500/30 !text-white hover:bg-orange-500/10 hover:!text-white font-bold text-lg px-8 py-6 rounded-xl bg-transparent">
              <Link href="/menu">
                <Search className="mr-2 w-5 h-5" />
                Browse Menu
              </Link>
            </Button>
          </motion.div>

          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8"
          >
            <button
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go back to previous page
            </button>
          </motion.div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-10 left-10 text-5xl opacity-50 hidden md:block"
        >
          🍟
        </motion.div>
        <motion.div
          animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          className="absolute -bottom-10 right-10 text-5xl opacity-50 hidden md:block"
        >
          🥤
        </motion.div>
      </div>
    </div>
  )
}
