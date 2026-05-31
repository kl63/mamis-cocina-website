import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  exportToCSV, 
  exportToJSON,
  formatRevenueDataForExport,
  formatPopularItemsForExport,
  formatPeakHoursForExport
} from '@/lib/utils/export'

describe('Export Utilities', () => {
  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('formatRevenueDataForExport', () => {
    it('formats revenue data correctly', () => {
      const data = [
        { date: '2024-01-01', revenue: 123.45 },
        { date: '2024-01-02', revenue: 678.90 }
      ]

      const result = formatRevenueDataForExport(data)

      expect(result).toEqual([
        { Date: '2024-01-01', Revenue: '$123.45', 'Revenue (Raw)': 123.45 },
        { Date: '2024-01-02', Revenue: '$678.90', 'Revenue (Raw)': 678.90 }
      ])
    })
  })

  describe('formatPopularItemsForExport', () => {
    it('formats popular items with ranking', () => {
      const data = [
        { name: 'Burger', quantity: 50, revenue: 250.00 },
        { name: 'Fries', quantity: 30, revenue: 90.00 }
      ]

      const result = formatPopularItemsForExport(data)

      expect(result).toEqual([
        { Rank: 1, 'Item Name': 'Burger', 'Units Sold': 50, Revenue: '$250.00', 'Revenue (Raw)': 250.00 },
        { Rank: 2, 'Item Name': 'Fries', 'Units Sold': 30, Revenue: '$90.00', 'Revenue (Raw)': 90.00 }
      ])
    })
  })

  describe('formatPeakHoursForExport', () => {
    it('formats peak hours data correctly', () => {
      const data = [
        { hour: '12:00 PM', orders: 25 },
        { hour: '6:00 PM', orders: 40 }
      ]

      const result = formatPeakHoursForExport(data)

      expect(result).toEqual([
        { Hour: '12:00 PM', 'Number of Orders': 25 },
        { Hour: '6:00 PM', 'Number of Orders': 40 }
      ])
    })
  })

  describe('exportToCSV', () => {
    it('handles empty data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      exportToCSV([], 'test')
      
      expect(consoleSpy).toHaveBeenCalledWith('No data to export')
    })

    it('creates CSV with proper headers and data', () => {
      const data = [
        { name: 'Item 1', price: 10 },
        { name: 'Item 2', price: 20 }
      ]

      const createElementSpy = vi.spyOn(document, 'createElement')
      
      exportToCSV(data, 'test')
      
      expect(createElementSpy).toHaveBeenCalledWith('a')
    })
  })

  describe('exportToJSON', () => {
    it('handles empty data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      exportToJSON([], 'test')
      
      expect(consoleSpy).toHaveBeenCalledWith('No data to export')
    })

    it('creates JSON file with proper data', () => {
      const data = [
        { name: 'Item 1', price: 10 },
        { name: 'Item 2', price: 20 }
      ]

      const createElementSpy = vi.spyOn(document, 'createElement')
      
      exportToJSON(data, 'test')
      
      expect(createElementSpy).toHaveBeenCalledWith('a')
    })
  })
})
