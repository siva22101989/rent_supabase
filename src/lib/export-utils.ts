import * as XLSX from 'xlsx';
import type { StorageRecord, Customer, Payment } from './definitions';
import { formatCurrency } from './utils';

/**
 * Generate Customer Statement using browser print dialog
 * This opens a new window with a printable statement that can be saved as PDF
 */
export function generateCustomerStatement(
    customer: Customer,
    records: StorageRecord[],
    warehouseName: string = 'Warehouse'
) {
    // Calculate totals
    let totalRent = 0;
    let totalHamali = 0;
    let totalPaid = 0;
    
    records.forEach(r => {
        totalRent += r.totalRentBilled || 0;
        totalHamali += r.hamaliPayable || 0;
        const payments = r.payments || [];
        totalPaid += payments.reduce((sum, p) => sum + p.amount, 0);
    });
    
    const totalBilled = totalRent + totalHamali;
    const balance = totalBilled - totalPaid;
    
    // Generate table rows
    const tableRows = records.map(r => {
        const payments = r.payments || [];
        const paid = payments.reduce((sum, p) => sum + p.amount, 0);
        const billed = (r.totalRentBilled || 0) + (r.hamaliPayable || 0);
        
        return `
            <tr>
                <td>${r.recordNumber || r.id.substring(0, 8)}</td>
                <td>${new Date(r.storageStartDate).toLocaleDateString()}</td>
                <td>${r.commodityDescription || '-'}</td>
                <td>${r.bagsStored}</td>
                <td>${formatCurrency(billed)}</td>
                <td>${formatCurrency(paid)}</td>
                <td>${formatCurrency(billed - paid)}</td>
            </tr>
        `;
    }).join('');
    
    // Create HTML content
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Customer Statement - ${customer.name}</title>
            <style>
                @media print {
                    @page { margin: 1cm; }
                    body { margin: 0; }
                }
                
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    max-width: 210mm;
                    margin: 0 auto;
                }
                
                .header {
                    text-align: left;
                    margin-bottom: 30px;
                }
                
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #2c3e50;
                }
                
                .header h2 {
                    margin: 5px 0 0 0;
                    font-size: 18px;
                    color: #34495e;
                    font-weight: normal;
                }
                
                .customer-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    font-size: 11px;
                }
                
                .customer-details p {
                    margin: 3px 0;
                }
                
                .summary-box {
                    background: #f5f5f5;
                    border: 1px solid #ddd;
                    padding: 15px;
                    margin-bottom: 20px;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                }
                
                .summary-item {
                    text-align: center;
                }
                
                .summary-label {
                    font-size: 10px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .summary-value {
                    font-size: 14px;
                }
                
                .balance-due {
                    color: ${balance > 0 ? '#e74c3c' : '#27ae60'};
                    font-weight: bold;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 10px;
                }
                
                th {
                    background: #3498db;
                    color: white;
                    padding: 8px;
                    text-align: left;
                    font-weight: bold;
                }
                
                td {
                    padding: 6px 8px;
                    border: 1px solid #ddd;
                }
                
                tr:nth-child(even) {
                    background: #f9f9f9;
                }
                
                .footer {
                    text-align: center;
                    font-size: 9px;
                    color: #7f8c8d;
                    font-style: italic;
                    margin-top: 30px;
                }
                
                .no-print {
                    text-align: center;
                    margin: 20px 0;
                }
                
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${warehouseName}</h1>
                <h2>Customer Statement</h2>
            </div>
            
            <div class="customer-info">
                <div class="customer-details">
                    <p><strong>Customer:</strong> ${customer.name}</p>
                    <p><strong>Phone:</strong> ${customer.phone || ''}</p>
                    ${customer.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ''}
                    ${customer.village ? `<p><strong>Village:</strong> ${customer.village}</p>` : ''}
                </div>
                <div>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
            
            <div class="summary-box">
                <div class="summary-item">
                    <div class="summary-label">Total Rent</div>
                    <div class="summary-value">${formatCurrency(totalRent)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Hamali</div>
                    <div class="summary-value">${formatCurrency(totalHamali)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Paid</div>
                    <div class="summary-value">${formatCurrency(totalPaid)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Balance Due</div>
                    <div class="summary-value balance-due">${formatCurrency(balance)}</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Record #</th>
                        <th>Date</th>
                        <th>Commodity</th>
                        <th>Bags</th>
                        <th>Billed</th>
                        <th>Paid</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            
            <div class="footer">
                This is a computer-generated statement.
            </div>
            
            <div class="no-print">
                <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #3498db; color: white; border: none; border-radius: 4px;">
                    Print / Save as PDF
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #95a5a6; color: white; border: none; border-radius: 4px; margin-left: 10px;">
                    Close
                </button>
            </div>
        </body>
        </html>
    `;
    
    // Open in new window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Auto-trigger print dialog after a short delay
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }
}

/**
 * Generate Monthly Summary PDF Report
 */
/**
 * Generate Monthly Summary Report using browser print dialog
 */
export function generateMonthlySummaryPDF(
    month: string,
    data: {
        totalRevenue: number;
        rentRevenue: number;
        hamaliRevenue: number;
        totalCollected: number;
        outstanding: number;
        newInflows: number;
        completedOutflows: number;
        activeStock: number;
    },
    warehouseName: string = 'Warehouse'
) {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Monthly Summary - ${month}</title>
            <style>
                @media print {
                    @page { margin: 1.5cm; }
                    body { margin: 0; }
                    .no-print { display: none; }
                }
                
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    max-width: 210mm;
                    margin: 0 auto;
                    color: #333;
                }
                
                .header {
                    margin-bottom: 40px;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 20px;
                }
                
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #2c3e50;
                }
                
                .header h2 {
                    margin: 10px 0 0 0;
                    font-size: 18px;
                    color: #7f8c8d;
                    font-weight: normal;
                }
                
                .meta {
                    margin-top: 10px;
                    font-size: 12px;
                    color: #95a5a6;
                }
                
                .section {
                    margin-bottom: 40px;
                }
                
                .section-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #2980b9;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                    border-left: 4px solid #3498db;
                    padding-left: 10px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #eee;
                }
                
                tr:last-child td {
                    border-bottom: none;
                }
                
                .label {
                    font-weight: bold;
                    width: 60%;
                }
                
                .value {
                    text-align: right;
                    font-family: monospace;
                    font-size: 14px;
                }
                
                .sub-label {
                    padding-left: 20px;
                    color: #666;
                    font-style: italic;
                }
                
                .footer {
                    margin-top: 50px;
                    text-align: center;
                    font-size: 10px;
                    color: #bdc3c7;
                }
                
                .no-print {
                    text-align: center;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${warehouseName}</h1>
                <h2>Monthly Summary Report - ${month}</h2>
                <div class="meta">Generated: ${new Date().toLocaleString()}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Financial Summary</div>
                <table>
                    <tr>
                        <td class="label">Total Revenue</td>
                        <td class="value">${formatCurrency(data.totalRevenue)}</td>
                    </tr>
                    <tr>
                        <td class="label sub-label">- Rent Revenue</td>
                        <td class="value">${formatCurrency(data.rentRevenue)}</td>
                    </tr>
                    <tr>
                        <td class="label sub-label">- Hamali Revenue</td>
                        <td class="value">${formatCurrency(data.hamaliRevenue)}</td>
                    </tr>
                    <tr>
                        <td class="label">Total Collected</td>
                        <td class="value">${formatCurrency(data.totalCollected)}</td>
                    </tr>
                    <tr>
                        <td class="label">Outstanding Dues</td>
                        <td class="value" style="color: #e74c3c;">${formatCurrency(data.outstanding)}</td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <div class="section-title">Operational Summary</div>
                <table>
                    <tr>
                        <td class="label">New Inflows</td>
                        <td class="value">${data.newInflows}</td>
                    </tr>
                    <tr>
                        <td class="label">Completed Outflows</td>
                        <td class="value">${data.completedOutflows}</td>
                    </tr>
                    <tr>
                        <td class="label">Active Stock (Bags)</td>
                        <td class="value">${data.activeStock}</td>
                    </tr>
                </table>
            </div>
            
            <div class="footer">
                This report is computer-generated.
            </div>
            
            <div class="no-print">
                <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #3498db; color: white; border: none; border-radius: 4px;">
                    Print / Save as PDF
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #95a5a6; color: white; border: none; border-radius: 4px; margin-left: 10px;">
                    Close
                </button>
            </div>
        </body>
        </html>
    `;
    
    // Open in new window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Auto-trigger print dialog after a short delay
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }
}

/**
 * Export data to Excel
 */
export function exportToExcel<T extends Record<string, any>>(
    data: T[],
    filename: string,
    sheetName: string = 'Sheet1'
) {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export Storage Records to Excel
 */
export function exportStorageRecordsToExcel(records: StorageRecord[]) {
    const data = records.map(r => ({
        'Record Number': r.recordNumber || r.id.substring(0, 8),
        'Date': new Date(r.storageStartDate).toLocaleDateString(),
        'Commodity': r.commodityDescription || '-',
        'Location': r.location || '-',
        'Bags Stored': r.bagsStored,
        'Hamali Payable': r.hamaliPayable || 0,
        'Rent Billed': r.totalRentBilled || 0,
        'Status': r.storageEndDate ? 'Completed' : 'Active',
        'End Date': r.storageEndDate ? new Date(r.storageEndDate).toLocaleDateString() : '-'
    }));
    
    exportToExcel(data, 'storage-records', 'Storage Records');
}

/**
 * Export Customers to Excel
 */
export function exportCustomersToExcel(
    customers: Customer[],
    recordsMap: Map<string, { activeBags: number; totalDue: number }>
) {
    const data = customers.map(c => {
        const stats = recordsMap.get(c.id) || { activeBags: 0, totalDue: 0 };
        return {
            'Name': c.name,
            'Phone': c.phone,
            'Email': c.email || '-',
            'Village': c.village || '-',
            'Father Name': c.fatherName || '-',
            'Active Bags': stats.activeBags,
            'Total Due': stats.totalDue
        };
    });
    
    exportToExcel(data, 'customers', 'Customers');
}

/**
 * Export Financial Report to Excel
 */
export function exportFinancialReportToExcel(data: {
    summary: { label: string; value: number }[];
    topCustomers: { name: string; revenue: number; paid: number; outstanding: number }[];
    aging: { range: string; count: number; amount: number }[];
}) {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryWs = XLSX.utils.json_to_sheet(data.summary);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Top Customers sheet
    const customersWs = XLSX.utils.json_to_sheet(data.topCustomers);
    XLSX.utils.book_append_sheet(wb, customersWs, 'Top Customers');
    
    // Aging Analysis sheet
    const agingWs = XLSX.utils.json_to_sheet(data.aging);
    XLSX.utils.book_append_sheet(wb, agingWs, 'Aging Analysis');
    
    XLSX.writeFile(wb, `financial-report-${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Generate Custom Report PDF using browser print
 */
export function generateCustomReportPDF(
    reportType: string,
    data: any,
    warehouseName: string = 'Warehouse'
) {
    let title = '';
    let content = '';
    
    // 1. All Customers Report
    if (reportType === 'all-customers') {
        title = 'All Customers List';
        const rows = data.data.map((c: any, index: number) => {
            // Calculate active bags from stats
            const customerStats = data.stats.filter((s: any) => s.customer_id === c.id);
            const activeBags = customerStats.reduce((sum: number, s: any) => sum + s.bags_stored, 0);
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${c.name}</td>
                    <td>${c.phone}</td>
                    <td>${c.village || '-'}</td>
                    <td>${c.entry_date ? new Date(c.entry_date).toLocaleDateString() : '-'}</td>
                    <td style="text-align: right">${activeBags}</td>
                </tr>
            `;
        }).join('');
        
        content = `
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%">#</th>
                        <th style="width: 25%">Name</th>
                        <th style="width: 15%">Phone</th>
                        <th style="width: 20%">Village</th>
                        <th style="width: 15%">Join Date</th>
                        <th style="width: 10%; text-align: right">Active Bags</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }
    
    // 2. Active Inventory Report
    else if (reportType === 'active-inventory') {
        title = 'Active Inventory Report';
        const rows = data.data.map((r: any) => `
            <tr>
                <td>${r.record_number || r.id.substring(0, 8)}</td>
                <td>${new Date(r.storage_start_date).toLocaleDateString()}</td>
                <td>${r.customers?.name || 'Unknown'}</td>
                <td>${r.commodity_description || '-'}</td>
                <td>${r.location || '-'}</td>
                <td style="text-align: right">${r.bags_stored}</td>
            </tr>
        `).join('');
        
        const totalBags = data.data.reduce((sum: number, r: any) => sum + r.bags_stored, 0);
        
        content = `
            <table>
                <thead>
                    <tr>
                        <th>Record #</th>
                        <th>Date In</th>
                        <th>Customer</th>
                        <th>Commodity</th>
                        <th>Location</th>
                        <th style="text-align: right">Bags</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr style="font-weight: bold; background-color: #f0f0f0;">
                        <td colspan="5" style="text-align: right;">Total Active Stock:</td>
                        <td style="text-align: right;">${totalBags}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }
    
    // 3. Transaction History
    else if (reportType === 'transaction-history') {
        title = 'Transaction History (Last 1000 Records)';
        const rows = data.data.map((r: any) => {
            const status = r.storage_end_date ? 'Completed' : 'Active';
            const statusColor = r.storage_end_date ? '#27ae60' : '#d35400';
            
            return `
            <tr>
                <td>${r.record_number || r.id.substring(0, 8)}</td>
                <td>${new Date(r.storage_start_date).toLocaleDateString()}</td>
                <td>${r.customers?.name || 'Unknown'}</td>
                <td>${r.commodity_description || '-'}</td>
                <td style="text-align: right">${r.bags_stored}</td>
                <td style="text-align: center; color: ${statusColor}; font-weight: bold;">${status}</td>
            </tr>
            `;
        }).join('');
        
        content = `
            <table>
                <thead>
                    <tr>
                        <th>Record #</th>
                        <th>Date In</th>
                        <th>Customer</th>
                        <th>Commodity</th>
                        <th style="text-align: right">Bags</th>
                        <th style="text-align: center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }
    
    // 4. Inflow Register
    else if (reportType === 'inflow-register') {
        const dateRange = formatDateRange(data.period);
        title = `Inflow Register ${dateRange}`;
        const rows = data.data.map((r: any) => `
            <tr>
                <td>${new Date(r.storage_start_date).toLocaleDateString()}</td>
                <td>${r.record_number || r.id.substring(0, 8)}</td>
                <td>${r.customers?.name || 'Unknown'}</td>
                <td>${r.commodity_description || '-'}</td>
                <td style="text-align: right">${r.bags_stored}</td>
            </tr>
        `).join('');
        
        const totalBags = data.data.reduce((sum: number, r: any) => sum + r.bags_stored, 0);

        content = `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Receipt #</th>
                        <th>Customer</th>
                        <th>Commodity</th>
                        <th style="text-align: right">Bags In</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr style="font-weight: bold; background-color: #f0f0f0;">
                        <td colspan="4" style="text-align: right;">Total Bags In:</td>
                        <td style="text-align: right;">${totalBags}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    // 5. Outflow Register
    else if (reportType === 'outflow-register') {
        const dateRange = formatDateRange(data.period);
        title = `Outflow Register ${dateRange}`;
        const rows = data.data.map((r: any) => `
            <tr>
                <td>${new Date(r.storage_end_date).toLocaleDateString()}</td>
                <td>${r.record_number || r.id.substring(0, 8)}</td>
                <td>${r.customers?.name || 'Unknown'}</td>
                <td style="text-align: right">${r.bags_stored}</td>
                <td style="text-align: right">${formatCurrency(r.total_rent_billed)}</td>
                <td style="text-align: right">${formatCurrency(r.hamali_payable)}</td>
                <td style="text-align: right">${formatCurrency((r.total_rent_billed || 0) + (r.hamali_payable || 0))}</td>
            </tr>
        `).join('');
        
        const totalRent = data.data.reduce((sum: number, r: any) => sum + (r.total_rent_billed || 0), 0);
        const totalHamali = data.data.reduce((sum: number, r: any) => sum + (r.hamali_payable || 0), 0);
        const totalAmount = totalRent + totalHamali;

        content = `
            <table>
                <thead>
                    <tr>
                        <th>Date Out</th>
                        <th>Ref #</th>
                        <th>Customer</th>
                        <th style="text-align: right">Bags</th>
                        <th style="text-align: right">Rent</th>
                        <th style="text-align: right">Hamali</th>
                        <th style="text-align: right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr style="font-weight: bold; background-color: #f0f0f0;">
                        <td colspan="4" style="text-align: right;">Totals:</td>
                        <td style="text-align: right;">${formatCurrency(totalRent)}</td>
                        <td style="text-align: right;">${formatCurrency(totalHamali)}</td>
                        <td style="text-align: right;">${formatCurrency(totalAmount)}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    // 6. Payment Register
    else if (reportType === 'payment-register') {
        const dateRange = formatDateRange(data.period);
        title = `Payment Register ${dateRange}`;
        const rows = data.data.map((p: any) => `
            <tr>
                <td>${new Date(p.payment_date).toLocaleDateString()}</td>
                <td>${p.storage_records?.record_number || p.storage_records?.id?.substring(0, 8) || '-'}</td>
                <td>${p.customers?.name || 'Unknown'}</td>
                <td>${p.notes || '-'}</td>
                <td style="text-align: right">${formatCurrency(p.amount)}</td>
            </tr>
        `).join('');
        
        const totalCollected = data.data.reduce((sum: number, p: any) => sum + p.amount, 0);

        content = `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Ref #</th>
                        <th>Customer</th>
                        <th>Mode/Notes</th>
                        <th style="text-align: right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr style="font-weight: bold; background-color: #f0f0f0;">
                        <td colspan="4" style="text-align: right;">Total Collected:</td>
                        <td style="text-align: right;">${formatCurrency(totalCollected)}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    // 7. Pending Dues List
    else if (reportType === 'pending-dues') {
        title = 'Pending Dues List';
        const rows = data.data.map((c: any, index: number) => `
            <tr>
                <td>${index + 1}</td>
                <td>${c.name}</td>
                <td>${c.phone || '-'}</td>
                <td style="text-align: right">${formatCurrency(c.totalDues)}</td>
                <td style="text-align: right">${formatCurrency(c.totalPaid)}</td>
                <td style="text-align: right; color: #e74c3c; font-weight: bold;">${formatCurrency(c.balance)}</td>
            </tr>
        `).join('');
        
        const totalOutstanding = data.data.reduce((sum: number, c: any) => sum + c.balance, 0);

        content = `
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%">#</th>
                        <th style="width: 25%">Customer</th>
                        <th style="width: 15%">Phone</th>
                        <th style="width: 15%; text-align: right">Billed</th>
                        <th style="width: 15%; text-align: right">Paid</th>
                        <th style="width: 15%; text-align: right">Balance Due</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr style="font-weight: bold; background-color: #f0f0f0;">
                        <td colspan="5" style="text-align: right;">Total Outstanding:</td>
                        <td style="text-align: right; color: #e74c3c;">${formatCurrency(totalOutstanding)}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                @media print {
                    @page { margin: 1cm; }
                    body { margin: 0; }
                    .no-print { display: none; }
                }
                
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    max-width: 210mm;
                    margin: 0 auto;
                    color: #333;
                }
                
                .header {
                    margin-bottom: 30px;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 15px;
                }
                
                .header h1 { margin: 0; font-size: 22px; color: #2c3e50; }
                .header h3 { margin: 5px 0 0; font-size: 16px; color: #7f8c8d; font-weight: normal; }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }
                
                th {
                    background-color: #3498db;
                    color: white;
                    padding: 8px;
                    text-align: left;
                }
                
                td {
                    padding: 6px 8px;
                    border-bottom: 1px solid #ddd;
                }
                
                tr:nth-child(even) { background-color: #f9f9f9; }
                
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 10px;
                    color: #bdc3c7;
                }
                
                .no-print {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                }
                
                button {
                    padding: 10px 20px;
                    font-size: 14px;
                    cursor: pointer;
                    border: none;
                    border-radius: 4px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" style="background: #3498db; color: white; margin-right: 10px;">Print PDF</button>
                <button onclick="window.close()" style="background: #e74c3c; color: white;">Close</button>
            </div>
            
            <div class="header">
                <h1>${warehouseName}</h1>
                <h3>${title}</h3>
                <div style="font-size: 11px; color: #95a5a6; margin-top: 5px;">Generated: ${new Date().toLocaleString()}</div>
            </div>
            
            ${content}
            
            <div class="footer">
                Page 1 of 1 (approx) - Computer Generated Report
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
    }
}

/**
 * Export Custom Report to Excel
 */
export function exportCustomReportToExcel(
    reportType: string, 
    data: any
) {
    let exportData: any[] = [];
    let filename = '';

    if (reportType === 'all-customers') {
        filename = 'all-customers';
        exportData = data.data.map((c: any) => {
            const customerStats = data.stats.filter((s: any) => s.customer_id === c.id);
            const activeBags = customerStats.reduce((sum: number, s: any) => sum + s.bags_stored, 0);
            return {
                'Name': c.name,
                'Phone': c.phone,
                'Village': c.village,
                'Join Date': c.entry_date ? new Date(c.entry_date).toLocaleDateString() : '-',
                'Active Bags': activeBags
            };
        });
    } else if (reportType === 'active-inventory') {
        filename = 'active-inventory';
        exportData = data.data.map((r: any) => ({
            'Record #': r.record_number || r.id.substring(0,8),
            'Date In': new Date(r.storage_start_date).toLocaleDateString(),
            'Customer': r.customers?.name || 'Unknown',
            'Commodity': r.commodity_description,
            'Location': r.location,
            'Bags': r.bags_stored
        }));
    } else if (reportType === 'transaction-history') {
        filename = 'transaction-history';
        exportData = data.data.map((r: any) => ({
            'Record #': r.record_number || r.id.substring(0,8),
            'Date In': new Date(r.storage_start_date).toLocaleDateString(),
            'Date Out': r.storage_end_date ? new Date(r.storage_end_date).toLocaleDateString() : '-',
            'Customer': r.customers?.name || 'Unknown',
            'Commodity': r.commodity_description,
            'Bags': r.bags_stored,
            'Status': r.storage_end_date ? 'Completed' : 'Active'
        }));
    } else if (reportType === 'inflow-register') {
        filename = 'inflow-register';
        exportData = data.data.map((r: any) => ({
            'Date': new Date(r.storage_start_date).toLocaleDateString(),
            'Receipt #': r.record_number || r.id.substring(0,8),
            'Customer': r.customers?.name || 'Unknown',
            'Commodity': r.commodity_description,
            'Bags In': r.bags_stored
        }));
    } else if (reportType === 'outflow-register') {
        filename = 'outflow-register';
        exportData = data.data.map((r: any) => ({
            'Date Out': new Date(r.storage_end_date).toLocaleDateString(),
            'Ref #': r.record_number || r.id.substring(0,8),
            'Customer': r.customers?.name || 'Unknown',
            'Bags': r.bags_stored,
            'Rent': r.total_rent_billed || 0,
            'Hamali': r.hamali_payable || 0,
            'Total Amount': (r.total_rent_billed || 0) + (r.hamali_payable || 0)
        }));
    } else if (reportType === 'payment-register') {
        filename = 'payment-register';
        exportData = data.data.map((p: any) => ({
            'Date': new Date(p.payment_date).toLocaleDateString(),
            'Ref #': p.storage_records?.record_number || p.storage_records?.id?.substring(0, 8) || '-',
            'Customer': p.customers?.name || 'Unknown',
            'Mode/Notes': p.notes || '-',
            'Amount': p.amount
        }));
    } else if (reportType === 'pending-dues') {
        filename = 'pending-dues';
        exportData = data.data.map((c: any) => ({
            'Customer': c.name,
            'Phone': c.phone,
            'Billed Total': c.totalDues,
            'Paid Total': c.totalPaid,
            'Balance Due': c.balance
        }));
    }

    exportToExcel(exportData, filename, 'Report Data');
}


/**
 * Format Date Range Helper
 */
function formatDateRange(period?: { startDate?: string, endDate?: string }) {
    if (!period?.startDate && !period?.endDate) return '(All Time)';
    const start = period.startDate ? new Date(period.startDate).toLocaleDateString() : '...';
    const end = period.endDate ? new Date(period.endDate).toLocaleDateString() : '...';
    return `(${start} - ${end})`;
}
