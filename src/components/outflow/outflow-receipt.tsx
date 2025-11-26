
'use client';

import { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Customer, StorageRecord } from '@/lib/definitions';
import { format, differenceInDays, differenceInMonths } from 'date-fns';
import { Button } from '../ui/button';
import { Download, Loader2 } from 'lucide-react';
import { calculateFinalRent } from '@/lib/billing';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
}

type OutflowReceiptProps = {
  record: StorageRecord;
  customer: Customer;
  withdrawnBags: number;
  finalRent: number;
};

export function OutflowReceipt({ record, customer, withdrawnBags, finalRent }: OutflowReceiptProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [formattedStartDate, setFormattedStartDate] = useState('');
    const [formattedEndDate, setFormattedEndDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [duration, setDuration] = useState({ days: 0, months: 0 });
    const [rentBreakdown, setRentBreakdown] = useState({ totalOwed: 0 });
    const [hamaliPending, setHamaliPending] = useState(0);

    useEffect(() => {
        const startDate = new Date(record.storageStartDate);
        const endDate = record.storageEndDate ? new Date(record.storageEndDate) : new Date();
        
        setFormattedStartDate(format(startDate, 'dd MMM yyyy'));
        setFormattedEndDate(format(endDate, 'dd MMM yyyy, hh:mm a'));

        setDuration({
            days: differenceInDays(endDate, startDate),
            months: differenceInMonths(endDate, startDate)
        });

        const { totalRentOwedPerBag } = calculateFinalRent(record, endDate, withdrawnBags);
        setRentBreakdown({ totalOwed: totalRentOwedPerBag });

        const pending = record.hamaliPayable - record.amountPaid;
        setHamaliPending(pending > 0 ? pending : 0);
        
    }, [record, withdrawnBags]);

    const totalPayable = finalRent + hamaliPending;

    const handleDownloadPdf = async () => {
        const element = receiptRef.current;
        if (!element) return;

        setIsGenerating(true);

        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            let widthInPdf = pdfWidth - 20;
            let heightInPdf = widthInPdf / ratio;

            if (heightInPdf > pdfHeight - 20) {
                heightInPdf = pdfHeight - 20;
                widthInPdf = heightInPdf * ratio;
            }

            const x = (pdfWidth - widthInPdf) / 2;
            const y = 10;

            pdf.addImage(imgData, 'PNG', x, y, widthInPdf, heightInPdf);
            pdf.save(`outflow-bill-${record.id}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div ref={receiptRef} className="printable-area bg-white p-4">
                <Card className="w-full shadow-none border-0">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Srilakshmi Warehouse</CardTitle>
                        <CardDescription>Outflow Bill / Final Statement</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <h3 className="font-semibold mb-2">Customer Details</h3>
                                <p>{customer.name}</p>
                                <p>{customer.address}</p>
                                <p>Phone: {customer.phone}</p>
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2">Withdrawal Details</h3>
                                <p><span className="font-medium">Date Out:</span> {formattedEndDate}</p>
                                <p><span className="font-medium">Date In:</span> {formattedStartDate}</p>
                                <p><span className="font-medium">Commodity:</span> {record.commodityDescription}</p>
                                <p><span className="font-medium">Bags Withdrawn:</span> {withdrawnBags}</p>
                            </div>
                        </div>
                        
                        <div>
                             <h3 className="font-semibold mb-2">Storage Duration</h3>
                             <div className="flex justify-between text-sm">
                                <span>Total Days</span>
                                <span>{duration.days} days</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span>Total Months</span>
                                <span>{duration.months} months</span>
                             </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="font-semibold mb-2">Final Billing Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Total Rent Due</span>
                                    <span>{formatCurrency(finalRent)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground pl-4">
                                     <span className="text-xs">
                                        ({withdrawnBags} bags &times; {formatCurrency(rentBreakdown.totalOwed)}/bag)
                                     </span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="font-medium">Pending Hamali Charges</span>
                                    <span>{formatCurrency(hamaliPending)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total Paid Now</span>
                                    <span>{formatCurrency(totalPayable)}</span>
                                </div>
                            </div>
                        </div>

                         <Separator />

                        <div className="text-xs text-muted-foreground space-y-2">
                           <p>
                                <strong>Notes:</strong>
                                This bill reflects the final settlement for the withdrawal of goods. Thank you for your business.
                            </p>
                            <p>This is a computer-generated receipt and does not require a signature.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="mt-6 flex justify-center print-hide">
                <Button onClick={handleDownloadPdf} disabled={isGenerating}>
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Downloading...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
