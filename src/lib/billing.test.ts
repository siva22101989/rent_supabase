import { describe, it, expect } from 'vitest'
import { calculateFinalRent } from './billing'
import { addMonths } from 'date-fns'
import type { StorageRecord } from '@/lib/definitions'

const mockRecord = (startDate: Date): StorageRecord => ({
  id: 'rec_1',
  customerId: 'cust_1',
  commodityDescription: 'Paddy',
  storageStartDate: startDate,
  bagsStored: 100,
  bagsIn: 100,
  bagsOut: 0,
  hamaliPayable: 1000,
  billingCycle: '6m',
  location: 'Lot A',
  lorryTractorNo: '',
  inflowType: 'purchase',
  totalRentBilled: 0,
  storageEndDate: null,
  payments: []
})

describe('calculateFinalRent', () => {
  const pricing = { price6m: 36, price1y: 55 }

  it('should charge 6-month rate for 0-6 months', () => {
    const start = new Date(2023, 0, 1) // Jan 1
    const end = addMonths(start, 3)     // April 1
    
    const result = calculateFinalRent(mockRecord(start), end, 100, pricing)
    expect(result.rent).toBe(36 * 100)
    expect(result.monthsStored).toBe(3)
  })

  it('should charge 1-year rate for 6-12 months', () => {
    const start = new Date(2023, 0, 1)
    const end = addMonths(start, 9)
    
    const result = calculateFinalRent(mockRecord(start), end, 100, pricing)
    expect(result.rent).toBe(55 * 100)
    expect(result.monthsStored).toBe(9)
  })

  it('should charge 1-year + 6-month rate for 13 months', () => {
    const start = new Date(2023, 0, 1)
    const end = addMonths(start, 13)
    
    const result = calculateFinalRent(mockRecord(start), end, 100, pricing)
    // 1 year (55) + 1st month of next cycle (36) = 91
    expect(result.rentPerBag).toBe(91)
    expect(result.rent).toBe(9100)
  })

  it('should charge 2 x 1-year rate for 24 months', () => {
    const start = new Date(2023, 0, 1)
    const end = addMonths(start, 24)
    
    const result = calculateFinalRent(mockRecord(start), end, 100, pricing)
    // fullYearsPastFirst = floor(23/12) = 1
    // rentPerBag = 1 * 55 = 55
    // remainingMonths = 24 - 12 = 12
    // remainingMonths > 6 -> 55 + 55 = 110
    expect(result.rentPerBag).toBe(110)
    expect(result.rent).toBe(11000)
  })

  it('should handle same day withdrawal as 6-month minimum', () => {
    const start = new Date(2023, 0, 1)
    const end = start
    
    const result = calculateFinalRent(mockRecord(start), end, 100, pricing)
    expect(result.rentPerBag).toBe(0)
  })
})
