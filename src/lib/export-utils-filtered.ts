import { StorageRecord } from './definitions';

export interface ExportMetadata {
  totalRecords: number;
  filteredRecords: number;
  appliedFilters: { label: string; value: string }[];
  exportDate: Date;
  exportedBy?: string;
}

/**
 * Enhanced Excel Export with Filter Metadata
 */
export async function exportToExcelWithFilters<T extends Record<string, any>>(
  data: T[],
  filename: string,
  metadata: ExportMetadata,
  sheetName: string = 'Data'
) {
  // Dynamic import XLSX
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // 1. Create Metadata Sheet
  const metadataRows = [
    ['Export Summary'],
    ['Total Records', metadata.totalRecords],
    ['Filtered Records', metadata.filteredRecords],
    ['Export Date', metadata.exportDate.toLocaleString()],
    [],
    ['Applied Filters:'],
    ...metadata.appliedFilters.map(f => [f.label, f.value])
  ];

  const metadataWs = XLSX.utils.aoa_to_sheet(metadataRows);
  
  // Style metadata header
  if (!metadataWs['!cols']) metadataWs['!cols'] = [];
  metadataWs['!cols'][0] = { wch: 20 }; // Label col width
  metadataWs['!cols'][1] = { wch: 40 }; // Value col width

  XLSX.utils.book_append_sheet(wb, metadataWs, 'Summary');

  // 2. Create Data Sheet
  const dataWs = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, dataWs, sheetName);

  // 3. Generate File
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export specific helpers
 */

// Storage Records
export function exportStorageRecordsWithFilters(
  records: StorageRecord[], 
  metadata: ExportMetadata
) {
  const data = records.map(r => ({
    'Record Number': r.recordNumber || r.id.substring(0, 8),
    'Date': new Date(r.storageStartDate).toLocaleDateString(),
    'Customer': r.customerName || 'Unknown',
    'Commodity': r.commodityDescription || '-',
    'Location': r.location || '-',
    'Bags Stored': r.bagsStored,
    'Hamali Payable': r.hamaliPayable || 0,
    'Rent Billed': r.totalRentBilled || 0,
    'Status': r.storageEndDate ? 'Completed' : 'Active',
    'End Date': r.storageEndDate ? new Date(r.storageEndDate).toLocaleDateString() : '-'
  }));

  exportToExcelWithFilters(data, 'filtered-storage-records', metadata, 'Storage Records');
}

// Inflow Records (Unloading)
export function exportInflowRecordsWithFilters(
  records: any[],
  metadata: ExportMetadata
) {
    const data = records.map(r => ({
        'Date': r.unload_date ? new Date(r.unload_date).toLocaleDateString() : '-',
        'Customer': r.customer?.name || 'Unknown',
        'Commodity': r.commodity_description,
        'Lorry No': r.lorry_tractor_no || '-',
        'Bags Unloaded': r.bags_unloaded,
        'Hamali Amount': r.hamali_amount || 0,
        'Notes': r.notes || '-'
    }));
    exportToExcelWithFilters(data, 'filtered-inflow-records', metadata, 'Inflow');
}

// Outflow Records (Loading)
export function exportOutflowRecordsWithFilters(
  records: any[],
  metadata: ExportMetadata
) {
    const data = records.map(r => ({
        'Date': r.created_at ? new Date(r.created_at).toLocaleDateString() : '-',
        'Transaction ID': r.transaction_number || r.id.substring(0, 8),
        'Customer': r.customer?.name || 'Unknown',
        'Bags Out': r.quantity,
        'Type': r.transaction_type,
        'Status': r.status,
        'Notes': r.notes || '-'
    }));
    exportToExcelWithFilters(data, 'filtered-outflow-records', metadata, 'Outflow');
}

// Expenses
export function exportExpensesWithFilters(
  expenses: any[],
  metadata: ExportMetadata
) {
    const data = expenses.map(e => ({
        'Date': new Date(e.date).toLocaleDateString(),
        'Description': e.description,
        'Amount': e.amount,
        'Category': e.category,
        'Payment Mode': e.payment_mode
    }));
    exportToExcelWithFilters(data, 'filtered-expenses', metadata, 'Expenses');
}

// Customers
export function exportCustomersWithFilters(
  customers: any[],
  metadata: ExportMetadata
) {
    const data = customers.map(c => ({
        'Name': c.name,
        'Phone': c.phone,
        'Email': c.email || '-',
        'Village': c.village || '-',
        'Balance': c.balance || 0,
        'Active Records': c.active_records_count || 0
    }));
    exportToExcelWithFilters(data, 'filtered-customers', metadata, 'Customers');
}
