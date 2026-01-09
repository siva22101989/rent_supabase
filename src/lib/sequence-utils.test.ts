

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateWarehouseCode, formatInvoiceNumber, getNextInvoiceNumber } from './sequence-utils'

// Hoist mocks to allow access inside vi.mock
const { mockRpc, mockCreateClient, mockGetUserWarehouse } = vi.hoisted(() => {
  const mockRpc = vi.fn()
  const mockCreateClient = vi.fn(() => ({
    rpc: mockRpc
  }))
  const mockGetUserWarehouse = vi.fn()
  return { mockRpc, mockCreateClient, mockGetUserWarehouse }
})

// Mock Supabase
vi.mock('@/utils/supabase/server', () => ({
  createClient: mockCreateClient
}))

// Mock Data Utils
vi.mock('@/lib/data', () => ({
  getUserWarehouse: () => mockGetUserWarehouse()
}))

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

describe('getNextInvoiceNumber', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the invoice number from DB', async () => {
    mockGetUserWarehouse.mockResolvedValue('warehouse-123')
    mockRpc.mockResolvedValue({ data: 'IN-202401-00001', error: null })

    const result = await getNextInvoiceNumber('inflow')

    expect(mockGetUserWarehouse).toHaveBeenCalled()
    expect(mockRpc).toHaveBeenCalledWith('generate_invoice_number', {
      p_warehouse_id: 'warehouse-123',
      p_type: 'inflow'
    })
    expect(result).toBe('IN-202401-00001')
  })

  it('should throw error if no warehouse assigned', async () => {
    mockGetUserWarehouse.mockResolvedValue(null)

    await expect(getNextInvoiceNumber('inflow')).rejects.toThrow('No warehouse assigned')
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('should throw error if DB call fails', async () => {
    mockGetUserWarehouse.mockResolvedValue('warehouse-123')
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB Error' } })

    await expect(getNextInvoiceNumber('outflow')).rejects.toThrow('Failed to generate outflow invoice number')
  })
})

