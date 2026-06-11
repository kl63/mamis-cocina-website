'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Flame, Star, Minus, Plus, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { getMenuItemById } from '@/lib/supabase/database'
import type { MenuItem } from '@/types'
import { useCart } from '@/contexts/CartContext'

// Emoji mapping for categories (temporary until we have real images)
const categoryEmojis: Record<string, string> = {
  'Burgers': '🍔',
  'Sides': '�',
  'Drinks': '🥤',
  'Desserts': '🍰',
}

export default function MenuItemPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = params.id as string
  const { addToCart } = useCart()
  
  const [item, setItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  
  const [quantity, setQuantity] = useState(1)
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, string>>({})
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [selectedSauces, setSelectedSauces] = useState<string[]>([])
  
  // Fetch menu item on mount
  useEffect(() => {
    async function fetchItem() {
      try {
        setLoading(true)
        const data = await getMenuItemById(itemId)
        setItem(data)
        
        // Set default customizations
        if (data.customization_options) {
          const defaults: Record<string, string> = {}
          data.customization_options.forEach(option => {
            if (option.options.length > 0) {
              defaults[option.name] = option.options[0].label
            }
          })
          setSelectedCustomizations(defaults)
        }
      } catch (error) {
        console.error('Error fetching menu item:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [itemId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-xl text-gray-400">Loading item...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">Item Not Found</h1>
          <Button asChild className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
            <Link href="/menu">Back to Menu</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleCustomizationChange = (optionName: string, value: string) => {
    setSelectedCustomizations(prev => ({
      ...prev,
      [optionName]: value
    }))
  }

  const toggleTopping = (topping: string) => {
    setSelectedToppings(prev => {
      if (prev.includes(topping)) {
        return prev.filter(t => t !== topping)
      } else {
        return [...prev, topping]
      }
    })
  }

  const toggleSauce = (sauce: string) => {
    setSelectedSauces(prev => {
      if (prev.includes(sauce)) {
        return prev.filter(s => s !== sauce)
      } else {
        return [...prev, sauce]
      }
    })
  }

  // Price modifiers for premium options
  const priceModifiers: Record<string, number> = {
    // Patty upgrades
    'Double': 2.00,
    'Triple': 4.00,
    
    // Size upgrades (for fries, sides, drinks)
    'Large': 1.50,
    'Medium': 0.50,
    'Small': 0.00, // Small is often default price
    
    // Cheese upgrades (premium cheeses)
    'Blue Cheese': 1.50,
    'Gruyere': 1.50,
    // Standard cheeses are FREE: Cheddar, Swiss, American, Pepper Jack
    
    // Premium toppings (costs extra)
    'Bacon': 1.50,
    'Extra Bacon': 2.00,
    'Extra Cheese': 1.00,
    'Avocado': 1.00,
    'Fried Egg': 1.00,
    'Caramelized Onions': 0.75,
    'Sautéed Mushrooms': 0.75,
    'Onion Rings': 1.00,
    'Jalapeños': 0.50,
    'Guacamole': 1.50,
    'Green Onions': 0.25,
    // Standard toppings are FREE: Lettuce, Tomato, Onion, Pickles
    
    // Premium sauces (costs extra)
    'Truffle Aioli': 1.00,
    'Chipotle Aioli': 0.75,
    'Chipotle Mayo': 0.50,
    'Garlic Aioli': 0.50,
    'Pesto Mayo': 0.75,
    'Sriracha Mayo': 0.50,
    'Buffalo Sauce': 0.50,
    'Horseradish Cream': 0.75,
    'Marshmallow Dip': 0.50,
    'Cinnamon Sugar': 0.25,
    // Standard sauces are FREE: Ketchup, Mayo, Mustard, BBQ, ByteBurger Sauce, Ranch, Honey Mustard, Marinara, Sour Cream, Sweet Chili
    
    // Drink customizations
    // Premium milkshake flavors
    'Oreo': 0.75,
    'Peanut Butter': 0.75,
    'Salted Caramel': 0.75,
    'Mint Chocolate Chip': 0.75,
    // Standard flavors FREE: Vanilla, Chocolate, Strawberry
    
    // Milkshake toppings (multi-select)
    'Whipped Cream': 0.50,
    'Chocolate Syrup': 0.25,
    'Caramel Drizzle': 0.25,
    'Sprinkles': 0.25,
    'Oreo Crumbles': 0.50,
    'Cherry': 0.25,
    'Extra Thick': 0.50,
    
    // Premium coffee drinks
    'Latte': 1.50,
    'Cappuccino': 1.50,
    'Mocha': 2.00,
    'Cold Brew': 1.00,
    'Espresso': 0.75,
    'Americano': 0.50,
    // Regular Coffee is base price
    
    // Premium milk alternatives
    'Almond Milk': 0.75,
    'Oat Milk': 0.75,
    'Soy Milk': 0.50,
    // Whole/Skim milk FREE
    
    // Coffee add-ons (multi-select)
    'Vanilla Syrup': 0.50,
    'Caramel Syrup': 0.50,
    'Hazelnut Syrup': 0.50,
    'Extra Shot': 1.00,
    // Sugar/Sweetener FREE
    
    // Premium lemonade/tea flavors
    'Strawberry': 0.50,
    'Raspberry': 0.50,
    'Mango': 0.50,
    'Peach': 0.50,
    'Blueberry': 0.50,
    // Classic/Regular FREE
  }

  // Calorie modifiers
  const calorieModifiers: Record<string, number> = {
    // Patty upgrades
    'Double': 250,
    'Triple': 500,
    
    // Size upgrades
    'Large': 150,
    
    // Cheese (all add calories)
    'Cheddar': 100,
    'Swiss': 100,
    'American': 100,
    'Pepper Jack': 100,
    'Blue Cheese': 110,
    'Gruyere': 110,
    'Extra Cheese': 100,
    
    // Toppings (all add some calories)
    'Lettuce': 5,
    'Tomato': 10,
    'Onion': 15,
    'Pickles': 5,
    'Bacon': 150,
    'Extra Bacon': 300,
    'Avocado': 80,
    'Fried Egg': 90,
    'Caramelized Onions': 35,
    'Sautéed Mushrooms': 25,
    'Onion Rings': 120,
    'Jalapeños': 5,
    'Guacamole': 90,
    'Green Onions': 5,
    
    // Sauces (minimal to moderate calories)
    'Ketchup': 20,
    'Mayo': 90,
    'Mustard': 5,
    'BBQ': 30,
    'ByteBurger Sauce': 40,
    'Ranch': 75,
    'Honey Mustard': 60,
    'Truffle Aioli': 100,
    'Chipotle Aioli': 95,
    'Chipotle Mayo': 85,
    'Garlic Aioli': 90,
    'Pesto Mayo': 85,
    'Sriracha Mayo': 80,
    'Buffalo Sauce': 25,
    'Sour Cream': 60,
    'Marinara': 30,
    'Sweet Chili': 40,
    'Horseradish Cream': 70,
    'Marshmallow Dip': 100,
    'Cinnamon Sugar': 50,
    
    // Drink calories
    // Soft drink flavors (vary by type)
    'Coca-Cola': 140,
    'Sprite': 140,
    'Fanta Orange': 160,
    'Dr Pepper': 150,
    'Root Beer': 160,
    'Diet Coke': 0,
    'Sprite Zero': 0,
    
    // Milkshake toppings
    'Whipped Cream': 50,
    'Chocolate Syrup': 60,
    'Caramel Drizzle': 60,
    'Sprinkles': 20,
    'Oreo Crumbles': 70,
    'Cherry': 10,
    'Extra Thick': 30,
    
    // Coffee types (base calories)
    'Latte': 120,
    'Cappuccino': 80,
    'Mocha': 200,
    'Cold Brew': 5,
    'Espresso': 5,
    'Americano': 10,
    
    // Milk options
    'Whole Milk': 40,
    'Skim Milk': 20,
    'Almond Milk': 15,
    'Oat Milk': 50,
    'Soy Milk': 30,
    
    // Coffee add-ons
    'Sugar': 15,
    'Sweetener': 0,
    'Vanilla Syrup': 80,
    'Caramel Syrup': 80,
    'Hazelnut Syrup': 80,
    'Extra Shot': 5,
    
    // Drink sizes (additional calories for larger sizes)
    'Medium': 50,
    'Small': 0,
  }

  // Calculate additional price from customizations
  const calculateAdditionalPrice = () => {
    let additionalPrice = 0
    // Add prices from single-select customizations
    Object.values(selectedCustomizations).forEach(value => {
      if (priceModifiers[value]) {
        additionalPrice += priceModifiers[value]
      }
    })
    // Add prices from multi-select toppings
    selectedToppings.forEach(topping => {
      if (priceModifiers[topping]) {
        additionalPrice += priceModifiers[topping]
      }
    })
    // Add prices from multi-select sauces
    selectedSauces.forEach(sauce => {
      if (priceModifiers[sauce]) {
        additionalPrice += priceModifiers[sauce]
      }
    })
    return additionalPrice
  }

  // Calculate additional calories from customizations
  // Show ALL selected customizations in the breakdown
  const calculateAdditionalCalories = () => {
    let additionalCalories = 0
    
    // Add calories from ALL single-select customizations
    // (Patty, Cheese, Bun, Size, etc.)
    Object.entries(selectedCustomizations).forEach(([optionName, value]) => {
      // Skip bun (already in base) unless it's a premium bun
      if (optionName.toLowerCase().includes('bun') && (!priceModifiers[value] || priceModifiers[value] === 0)) {
        return // Don't add base bun calories
      }
      
      // Add calories for everything else
      if (calorieModifiers[value]) {
        additionalCalories += calorieModifiers[value]
      }
    })
    
    // Add calories from multi-select toppings (these are all EXTRAS)
    selectedToppings.forEach(topping => {
      if (calorieModifiers[topping]) {
        additionalCalories += calorieModifiers[topping]
      }
    })
    
    // Add calories from multi-select sauces (these are all EXTRAS)
    selectedSauces.forEach(sauce => {
      if (calorieModifiers[sauce]) {
        additionalCalories += calorieModifiers[sauce]
      }
    })
    
    return additionalCalories
  }

  const additionalPrice = calculateAdditionalPrice()
  const itemPrice = item.price + additionalPrice
  const totalPrice = itemPrice * quantity
  
  const baseCalories = item.calories || 0
  const additionalCalories = calculateAdditionalCalories()
  const totalCalories = baseCalories + additionalCalories

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!item) return
    
    setAdding(true)
    try {
      await addToCart(
        item,
        quantity,
        selectedCustomizations,
        selectedToppings,
        selectedSauces,
        itemPrice
      )
      
      // Reset to defaults after adding
      setQuantity(1)
      
      // Success feedback (cart drawer will open automatically)
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-300 hover:text-white mb-6"
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back to Menu
          </Button>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Left: Product Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="sticky top-8">
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-orange-500/30 rounded-3xl p-12 relative overflow-hidden">
                {/* Popular Badge */}
                {item.is_popular && (
                  <div className="absolute top-6 right-6 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold z-10 shadow-lg flex items-center gap-2">
                    <Star className="w-4 h-4 fill-current" />
                    Popular
                  </div>
                )}

                {/* Large Product Image */}
                {item.image_url && (item.image_url.startsWith('http') || item.image_url.startsWith('/')) ? (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="flex items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.image_url.includes('unsplash.com') 
                        ? `${item.image_url.split('?')[0]}?w=800&q=80&auto=format`
                        : item.image_url
                      }
                      alt={item.name}
                      className="w-full h-auto max-h-[400px] object-cover rounded-2xl"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-[200px] text-center filter drop-shadow-2xl"
                  >
                    {item.image_url || categoryEmojis[item.category?.name || 'Burgers'] || '🍔'}
                  </motion.div>
                )}

                {/* Flame Effects */}
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute bottom-8 right-8 text-6xl"
                >
                  🔥
                </motion.div>
              </div>

              {/* Nutritional Info Card */}
              {item.calories && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-orange-500/20 rounded-2xl p-6 backdrop-blur-sm"
                >
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Nutritional Info
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-black/30 rounded-xl p-4 text-center">
                      <p className="text-gray-400 text-sm">Base Calories</p>
                      <p className="text-2xl font-black text-white">{baseCalories}</p>
                    </div>
                    {additionalCalories > 0 && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
                        <p className="text-gray-400 text-sm">From Customizations</p>
                        <p className="text-2xl font-black text-orange-500">+{additionalCalories}</p>
                      </div>
                    )}
                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 rounded-xl p-4 text-center">
                      <p className="text-gray-400 text-sm font-bold">Total Calories</p>
                      <p className="text-3xl font-black text-orange-500">{totalCalories}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right: Product Details & Customization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Product Info */}
            <div>
              <h1 className="text-5xl md:text-6xl font-black mb-4">
                <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
                  {item.name}
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-4">{item.description}</p>
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl text-gray-400">Base Price:</span>
                  <span className="text-3xl font-black text-white">${item.price.toFixed(2)}</span>
                </div>
                {additionalPrice > 0 && (
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl text-gray-400">Customizations:</span>
                    <span className="text-3xl font-black text-orange-500">+${additionalPrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-baseline gap-3 pt-2 border-t-2 border-orange-500/30">
                  <span className="text-2xl text-gray-400">Item Total:</span>
                  <span className="text-4xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">${itemPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customization Options */}
            {item.customization_options && item.customization_options.length > 0 && (
              <div className="space-y-6">
                {item.customization_options.map((customOption) => {
                  const isToppings = customOption.name.toLowerCase().includes('topping')
                  const isSauces = customOption.name.toLowerCase().includes('sauce')
                  const isAddOns = customOption.name.toLowerCase().includes('add')
                  const isMultiSelect = isToppings || isSauces || isAddOns
                  
                  return (
                    <div key={customOption.name}>
                      <h3 className="text-xl font-black text-white mb-3">
                        {customOption.name}
                        {isMultiSelect && (
                          <span className="text-sm font-normal text-gray-400 ml-2">(Select Multiple)</span>
                        )}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {customOption.options.map((option) => {
                          const extraCost = priceModifiers[option.label] || 0
                          const extraCalories = calorieModifiers[option.label] || 0
                          
                          let isSelected = false
                          let handleClick = () => {}
                          
                          if (isToppings || isAddOns) {
                            isSelected = selectedToppings.includes(option.label)
                            handleClick = () => toggleTopping(option.label)
                          } else if (isSauces) {
                            isSelected = selectedSauces.includes(option.label)
                            handleClick = () => toggleSauce(option.label)
                          } else {
                            isSelected = selectedCustomizations[customOption.name] === option.label
                            handleClick = () => handleCustomizationChange(customOption.name, option.label)
                          }
                          
                          return (
                            <button
                              key={option.label}
                              onClick={handleClick}
                              className={`px-4 py-3 rounded-xl font-bold transition-all relative ${
                                isSelected
                                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                              }`}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <span>{option.label}</span>
                                {extraCost > 0 && (
                                  <span className="text-xs text-orange-400 font-bold">+${extraCost.toFixed(2)}</span>
                                )}
                                {extraCost === 0 && isMultiSelect && (
                                  <span className="text-xs text-green-400 font-bold">FREE</span>
                                )}
                                {extraCalories > 0 && (
                                  <span className="text-xs text-gray-400">+{extraCalories} cal</span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="sticky bottom-0 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-orange-500/30 rounded-2xl p-6 space-y-4">
              {/* Price Breakdown */}
              <div className="bg-black/40 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Price ({quantity}x)</span>
                  <span className="text-white font-bold">${(item.price * quantity).toFixed(2)}</span>
                </div>
                {additionalPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Customizations ({quantity}x)</span>
                    <span className="text-orange-400 font-bold">+${(additionalPrice * quantity).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-orange-500/30">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-2xl font-black text-orange-500">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white">Quantity</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white font-bold transition-all"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-black text-white w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white font-bold transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <Button 
                onClick={handleAddToCart}
                disabled={adding}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black text-xl py-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-6 h-6 mr-2" />
                {adding ? 'Adding...' : `Add to Cart - $${totalPrice.toFixed(2)}`}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
