import { describe, it, expect } from 'vitest'
import { generateWarehouseCode, formatInvoiceNumber } from './sequence-utils'

describe('generateWarehouseCode', () => {
  it('should generate basic codes', () => {
    expect(generateWarehouseCode('Bangalore Main')).toBe('BAMA')
    expect(generateWarehouseCode('Warehouse 1')).toBe('WA1')
    expect(generateWarehouseCode('Main')).toBe('MAIN')
  })

  it('should handle empty or null values', () => {
    expect(generateWarehouseCode('')).toBe('WH')
    // @ts-ignore
    expect(generateWarehouseCode(null)).toBe('WH')
  })

  it('should handle single names less than 4 chars', () => {
    expect(generateWarehouseCode('ABC')).toBe('ABC')
  })
})

describe('formatInvoiceNumber', () => {
  it('should format inflow correctly', () => {
    expect(formatInvoiceNumber('BLMA', 'inflow', 1)).toBe('BLMA-IN-1001')
  })

  it('should format outflow correctly', () => {
    expect(formatInvoiceNumber('BLMA', 'outflow', 55)).toBe('BLMA-OUT-1055')
  })

  it('should handle 0 correctly', () => {
    expect(formatInvoiceNumber('WH', 'inflow', 0)).toBe('WH-IN-1000')
  })
})
