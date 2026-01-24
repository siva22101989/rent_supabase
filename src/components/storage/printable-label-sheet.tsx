'use client';

import { QRCodeSVG } from 'qrcode.react';
import { StorageRecord, Customer } from '@/lib/definitions';
import { format } from 'date-fns';

interface PrintableLabelSheetProps {
  records: (StorageRecord & { customer?: Customer })[];
  warehouseName: string;
}

export function PrintableLabelSheet({ records, warehouseName }: PrintableLabelSheetProps) {
  return (
    <div className="w-full bg-white">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          /* Hide everything else when printing */
          body > *:not(.print-container) {
            display: none !important;
          }
          .print-container {
            display: block !important;
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
          }
        }
      `}</style>

      <div className="print-container grid grid-cols-2 gap-4 p-4 print:p-0">
        {records.map((record) => (
          <div 
            key={record.id} 
            className="border-2 border-black p-4 flex flex-col justify-between h-[95mm] break-inside-avoid"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-2">
              <h2 className="font-bold text-lg uppercase tracking-wider">{warehouseName}</h2>
              <p className="text-xs font-mono">STORAGE LABEL</p>
            </div>

            {/* Main Content */}
            <div className="flex gap-4 items-center flex-1">
              {/* QR Code */}
              <div className="bg-white p-1 border-2 border-black">
                <QRCodeSVG 
                  value={record.id}
                  size={120}
                  level="H"
                />
              </div>

              {/* Details */}
              <div className="flex-1 space-y-2">
                <div>
                  <label className="text-xs font-bold uppercase block">Record ID</label>
                  <span className="font-mono text-xl font-bold">{record.recordNumber || 'N/A'}</span>
                </div>
                
                <div>
                  <label className="text-xs font-bold uppercase block">Customer</label>
                  <span className="text-lg font-semibold leading-tight block">
                    {record.customer?.name || 'Unknown'}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase block">Commodity</label>
                  <span className="text-md">{record.commodityDescription}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-black pt-2 mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <label className="text-xs font-bold block">DATE IN</label>
                  <span>{format(new Date(record.storageStartDate), 'dd MMM yyyy')}</span>
                </div>
                <div>
                    <label className="text-xs font-bold block">BAGS</label>
                    <span className="font-mono font-bold text-lg">{record.bagsStored}</span>
                </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty state filler to visualize A4 size on screen */}
      {records.length === 0 && (
          <div className="text-center p-10 text-gray-500">
              No records selected for printing.
          </div>
      )}
    </div>
  );
}
