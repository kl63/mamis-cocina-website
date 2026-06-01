'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface RestaurantHours {
  day: string
  open_time: string
  close_time: string
  is_closed: boolean
}

interface MenuCategory {
  id: string
  name: string
  is_active: boolean
}

// Cache data in memory to avoid refetching on every page
let cachedHours: RestaurantHours[] | null = null
let cachedCategories: MenuCategory[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function Footer() {
  const [hours, setHours] = useState<RestaurantHours[]>(cachedHours || [])
  const [categories, setCategories] = useState<MenuCategory[]>(cachedCategories || [])

  useEffect(() => {
    const now = Date.now()
    
    // Only fetch if cache is empty or expired
    if (!cachedHours || !cachedCategories || now - lastFetchTime > CACHE_DURATION) {
      // Fetch hours
      fetch('/api/restaurant-hours')
        .then(res => res.json())
        .then(data => {
          const hoursData = data.hours || []
          cachedHours = hoursData
          setHours(hoursData)
        })
        .catch(() => setHours([]))

      // Fetch categories
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
          const categoriesData = data.categories?.filter((c: MenuCategory) => c.is_active) || []
          cachedCategories = categoriesData
          setCategories(categoriesData)
        })
        .catch(() => setCategories([]))
      
      lastFetchTime = now
    }
  }, [])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="relative h-32 w-80">
                <Image
                  src="/mamis_cocina_logo.png"
                  alt="Mami's Cocina Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-base text-muted-foreground max-w-sm">
              Authentic Mexican cuisine made with love and tradition.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Menu</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/menu"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse Menu
                </Link>
              </li>
              {categories.slice(0, 4).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/menu?category=${category.name.toLowerCase()}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Hours of Operation
            </h3>
            <ul className="space-y-2 text-sm">
              {hours.length > 0 ? (
                hours.map((hour) => (
                  <li key={hour.day} className="flex justify-between">
                    <span className="text-muted-foreground font-medium">{hour.day}</span>
                    <span className="text-foreground">
                      {hour.is_closed ? 'Closed' : `${formatTime(hour.open_time)} - ${formatTime(hour.close_time)}`}
                    </span>
                  </li>
                ))
              ) : (
                <li key="loading" className="text-muted-foreground">Loading hours...</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mami&apos;s Cocina. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
