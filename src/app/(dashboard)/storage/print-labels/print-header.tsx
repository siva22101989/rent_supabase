'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export function PrintHeader({ count }: { count: number }) {
    return (
        <div className="print:hidden p-4 border-b bg-white flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <Link href="/storage">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <h1 className="font-semibold text-lg">
                    Print Labels ({count})
                </h1>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => typeof window !== 'undefined' && window.print()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Sheets
                </Button>
            </div>
        </div>
    );
}
