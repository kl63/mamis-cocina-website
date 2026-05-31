/**
 * Utility functions for exporting data
 */

export function exportToCSV(data: unknown[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Get headers from first object
  const headers = Object.keys(data[0] as Record<string, unknown>)
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = (row as Record<string, unknown>)[header]
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToJSON(data: unknown[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.json`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Format analytics data for export
export function formatRevenueDataForExport(data: { date: string; revenue: number }[]) {
  return data.map(item => ({
    Date: item.date,
    Revenue: `$${item.revenue.toFixed(2)}`,
    'Revenue (Raw)': item.revenue
  }))
}

export function formatPopularItemsForExport(data: { name: string; quantity: number; revenue: number }[]) {
  return data.map((item, index) => ({
    Rank: index + 1,
    'Item Name': item.name,
    'Units Sold': item.quantity,
    Revenue: `$${item.revenue.toFixed(2)}`,
    'Revenue (Raw)': item.revenue
  }))
}

export function formatPeakHoursForExport(data: { hour: string; orders: number }[]) {
  return data.map(item => ({
    Hour: item.hour,
    'Number of Orders': item.orders
  }))
}
