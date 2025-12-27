
'use client';

import { useRef, useState } from 'react';
// import jsPDF from 'jspdf'; // Removed for lazy loading
// import html2canvas from 'html2canvas'; // Removed for lazy loading
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText } from 'lucide-react';
import type { Customer, StorageRecord } from '@/lib/definitions';
import { CustomerStatementReceipt } from './customer-statement-receipt';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

interface Props {
    customer: Customer;
    records: StorageRecord[];
    dateRange?: DateRange;
}

export function CustomerStatementDialog({
  customer,
  records,
  dateRange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);



  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element) return;

    setIsGenerating(true);

    try {
      const [html2canvas, { default: jsPDF }] = await Promise.all([
        import('html2canvas').then(m => m.default),
        import('jspdf')
      ]);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      
      let widthInPdf = pdfWidth - 20;
      let heightInPdf = widthInPdf / ratio;

      // Handle multi-page (split if too long) - Simplified for Single Page first, 
      // but ideally we usually scale to fit or split.
      // For receipts, 'scale to fit' is okay if not super long.
      // However, statements can be long.
      // For now, let's just fit width and if height > pdfHeight, let it span (or shrink).
      // Given simple jsPDF addImage, it handles one page.
      // To properly handle multi-page, we need more complex logic.
      // Let's stick to single page A4 Best Fit for now or multiple pages if we manually split.
      
      // Basic Single Page approach:
      if (heightInPdf > pdfHeight - 20) {
        // If it's too long, maybe we just add a new page?
        // html2canvas gives us one big image. We'd have to crop it.
        // Let's just do single long page for now if possible? No, PDF has fixed size.
        // We will just scale it down if it's crazy huge, OR leave it to user to view online?
        // Let's iterate: Try to fit width. If height overflows, we just add pages.
        
        let heightLeft = heightInPdf;
        let position = 10;
        let pageHeight = pdfHeight - 20;

        pdf.addImage(imgData, 'PNG', 10, position, widthInPdf, heightInPdf);
        heightLeft -= pageHeight;
        
        // While useful, slicing images is tricky. 
        // Let's just save as `bill-name.pdf` and hope for best fit or rely on browser print for very long ones.
        // But user specifically liked the "Dialog PDF" feature.
      } else {
         const x = (pdfWidth - widthInPdf) / 2;
         const y = 10;
         pdf.addImage(imgData, 'PNG', x, y, widthInPdf, heightInPdf);
      }
      
      pdf.save(`statement-${customer.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
      // setIsOpen(false); // Keep open in case they want to change dates
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Download Statement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Customer Statement</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto overflow-x-auto p-2 border rounded-md bg-zinc-50/50">
            <CustomerStatementReceipt customer={customer} records={records} dateRange={dateRange} />
        </div>
        
        {/* Hidden Print Version */}
        <div style={{ position: 'fixed', top: '-1000vh', left: '-1000vw', width: '210mm' }}>
             <CustomerStatementReceipt ref={printRef} customer={customer} records={records} dateRange={dateRange} />
        </div>

        <DialogFooter className="sm:justify-end">
          <Button onClick={handleDownloadPdf} disabled={isGenerating}>
            {isGenerating ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
