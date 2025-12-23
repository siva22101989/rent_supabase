'use client';

import { useState, useEffect } from 'react';
import type { Customer, StorageRecord } from '@/lib/definitions';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { FileText } from 'lucide-react';
import { toDate } from '@/lib/utils';

interface InflowReceiptProps {
    record: StorageRecord;
    customer: Customer;
    warehouse: any;
}

export function InflowReceipt({ record, customer, warehouse }: InflowReceiptProps) {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        const startDate = toDate(record.storageStartDate);
        setFormattedDate(format(startDate, 'dd/MM/yy'));
    }, [record.storageStartDate]);

    const handlePrint = () => {
        const warehouseName = warehouse?.name || 'Sri Lakshmi Warehouse';
        const warehouseAddress = warehouse?.location || 'Survey No. 165,237/2, Owk - Koilakuntla Road, OWK - 518 122';
        const warehousePhone = warehouse?.phone || '9703503423, 9160606633';
        const warehouseEmail = warehouse?.email || '';
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Godown Receipt - ${record.recordNumber || record.id}</title>
                <style>
                    @media print {
                        @page { margin: 1cm; }
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                    
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        padding: 20px;
                        max-width: 210mm;
                        margin: 0 auto;
                    }
                    
                    .receipt {
                        border: 2px solid #1e40af;
                        padding: 20px;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    
                    .header h1 {
                        margin: 5px 0;
                        font-size: 24px;
                        color: #1e3a8a;
                    }
                    
                    .header .contact {
                        font-size: 11px;
                        margin: 3px 0;
                    }
                    
                    .title {
                        font-weight: bold;
                        text-decoration: underline;
                        margin: 15px 0;
                    }
                    
                    .info-row {
                        display: flex;
                        margin: 8px 0;
                    }
                    
                    .label {
                        font-weight: bold;
                        width: 35%;
                    }
                    
                    .value {
                        width: 65%;
                    }
                    
                    .serial-date {
                        display: flex;
                        justify-between;
                        margin: 15px 0;
                    }
                    
                    .no-print {
                        text-align: center;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <div class="contact">Cell: ${warehousePhone}</div>
                        <h1>${warehouseName.toUpperCase()}</h1>
                        <div class="contact">${warehouseAddress}</div>
                        ${warehouseEmail ? `<div class="contact">${warehouseEmail}</div>` : ''}
                    </div>
                    
                    <div class="title">GODOWN RECEIPT</div>
                    
                    <div class="serial-date">
                        <div><span class="label">Receipt #</span> ${record.recordNumber || record.id}</div>
                        <div><span class="label">Date:</span> ${formattedDate}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="label">LORRY / TRACTOR No.</div>
                        <div class="value">: ${record.lorryTractorNo || 'N/A'}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="label">NAME OF THE FARMER</div>
                        <div class="value">: ${customer.name}</div>
                    </div>
                    
                    ${customer.fatherName ? `
                    <div class="info-row">
                        <div class="label">FATHER'S NAME</div>
                        <div class="value">: ${customer.fatherName}</div>
                    </div>
                    ` : ''}
                    
                    <div class="info-row">
                        <div class="label">VILLAGE</div>
                        <div class="value">: ${customer.village || 'N/A'}</div>
                    </div>
                    
                    ${record.inflowType === 'Plot' && record.plotBags ? `
                    <div class="info-row">
                        <div class="label">PLOT BAGS</div>
                        <div class="value">: ${record.plotBags}</div>
                    </div>
                    ` : ''}
                    
                    <div class="info-row">
                        <div class="label">COMMODITY</div>
                        <div class="value">: ${record.commodityDescription || 'N/A'}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="label">NO. OF BAGS</div>
                        <div class="value">: ${record.bagsStored}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="label">LOT NO.</div>
                        <div class="value">: ${record.location || 'N/A'}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="label">HAMALI PAYABLE</div>
                        <div class="value">: ₹${record.hamaliPayable || 0}</div>
                    </div>
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
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-background p-4 sm:p-6">
            <div className="bg-white p-6 border-2 border-blue-800 font-mono text-sm">
                <div className="text-center mb-4">
                    <div className="text-xs">Cell: {warehouse?.phone || '9703503423, 9160606633'}</div>
                    <h1 className="text-2xl font-bold text-blue-900">{warehouse?.name?.toUpperCase() || 'SRI LAKSHMI WAREHOUSE'}</h1>
                    <p className="text-xs">{warehouse?.location || 'Survey No. 165,237/2, Owk - Koilakuntla Road, OWK - 518 122'}</p>
                    {warehouse?.email && <p className="text-xs">{warehouse.email}</p>}
                </div>
                
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold underline">GODOWN RECEIPT</h2>
                </div>

                <div className="flex justify-between items-baseline mb-4">
                    <div><span className="font-bold">Receipt #</span> {record.recordNumber || record.id}</div>
                    <div><span className="font-bold">Date:</span> {formattedDate}</div>
                </div>

                <div className="space-y-2">
                    <div className="flex">
                        <span className="w-1/3 font-bold">LORRY / TRACTOR No.</span>
                        <span>: {record.lorryTractorNo || 'N/A'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-1/3 font-bold">NAME OF THE FARMER</span>
                        <span>: {customer.name}</span>
                    </div>
                    {customer.fatherName && (
                        <div className="flex">
                            <span className="w-1/3 font-bold">FATHER'S NAME</span>
                            <span>: {customer.fatherName}</span>
                        </div>
                    )}
                    <div className="flex">
                        <span className="w-1/3 font-bold">VILLAGE</span>
                        <span>: {customer.village || 'N/A'}</span>
                    </div>
                    {record.inflowType === 'Plot' && (
                        <div className="flex">
                            <span className="w-1/3 font-bold">PLOT BAGS</span>
                            <span>: {record.plotBags}</span>
                        </div>
                    )}
                    <div className="flex">
                        <span className="w-1/3 font-bold">COMMODITY</span>
                        <span>: {record.commodityDescription || 'N/A'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-1/3 font-bold">NO. OF BAGS</span>
                        <span>: {record.bagsStored}</span>
                    </div>
                    <div className="flex">
                        <span className="w-1/3 font-bold">LOT NO.</span>
                        <span>: {record.location || 'N/A'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-1/3 font-bold">HAMALI PAYABLE</span>
                        <span>: ₹{record.hamaliPayable || 0}</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 flex justify-center">
                <Button onClick={handlePrint}>
                    <FileText className="mr-2 h-4 w-4" />
                    Print / Download PDF
                </Button>
            </div>
        </div>
    );
}
