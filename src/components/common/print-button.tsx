'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { ReceiptTemplate } from '@/components/reports/receipt-template';

interface PrintButtonProps {
    data: any; // Type strictly later if needed, but 'any' allows flexibility for different record types
    type: 'inflow' | 'outflow' | 'bill';
    buttonText?: string;
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    icon?: React.ReactNode;
}

export function PrintButton({ data, type, buttonText = "Print", className, variant = "outline", size = "sm", icon }: PrintButtonProps) {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Receipt-${data.recordNumber || data.id}-${type}`,
    });

    return (
        <>
            <div className="hidden">
                <ReceiptTemplate ref={componentRef} data={data} type={type} />
            </div>
            <Button onClick={() => handlePrint()} variant={variant} size={size} className={className}>
                {icon ? (
                    <>
                        {icon}
                        {buttonText && <span className="ml-2">{buttonText}</span>}
                    </>
                ) : (
                    <>
                        <Printer className="mr-2 h-4 w-4" />
                        {buttonText}
                    </>
                )}
            </Button>
        </>
    );
}
