'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

interface RecordQRCodeProps {
  recordId: string;
  size?: number;
  showActions?: boolean;
  label?: string;
}

export function RecordQRCode({ 
  recordId, 
  size = 128, 
  showActions = true,
  label 
}: RecordQRCodeProps) {
  
  const downloadQR = () => {
    const svg = document.getElementById(`qr-${recordId}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size * 2;
      canvas.height = size * 2;
      ctx?.drawImage(img, 0, 0, size * 2, size * 2);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `record-${recordId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };
  
  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${recordId}</title>
          <style>
            @page { margin: 1cm; }
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 2px dashed #ccc;
            }
            .label {
              margin-top: 10px;
              font-size: 14px;
              font-weight: bold;
            }
            .record-id {
              margin-top: 5px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${document.getElementById(`qr-${recordId}`)?.outerHTML || ''}
            ${label ? `<div class="label">${label}</div>` : ''}
            <div class="record-id">Record: ${recordId}</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card className="p-4 flex flex-col items-center gap-3">
      <QRCodeSVG 
        id={`qr-${recordId}`}
        value={recordId}
        size={size}
        level="H"
        includeMargin
      />
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground font-mono">{recordId}</p>
        {label && <p className="text-sm font-medium mt-1">{label}</p>}
      </div>
      
      {showActions && (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={downloadQR}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={printQR}
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      )}
    </Card>
  );
}

// Compact version for cards
export function RecordQRCodeCompact({ recordId }: { recordId: string }) {
  return (
    <div className="relative group">
      <QRCodeSVG 
        value={recordId}
        size={64}
        level="M"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-xs">Scan to view</span>
      </div>
    </div>
  );
}
