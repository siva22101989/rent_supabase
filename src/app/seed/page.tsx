'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resetAndSeedDatabase } from '@/lib/seed-actions';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SeedPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleReset = async () => {
        if (!confirm('ARE YOU SURE? This will DELETE ALL DATA (except users/warehouses) and reset the database. This cannot be undone.')) {
            return;
        }

        setIsLoading(true);
        try {
            const res = await resetAndSeedDatabase();
            if (res.success) {
                setResult(res.message);
                toast({
                    title: 'Success',
                    description: 'Database has been reset and seeded.',
                });
            } else {
                setResult('Error: ' + res.message);
                toast({
                    title: 'Error',
                    description: res.message,
                    variant: 'destructive',
                });
            }
        } catch (e: any) {
            setResult('Error: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 flex justify-center">
            <Card className="w-full max-w-md border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <Trash2 className="h-6 w-6" />
                        DANGER ZONE: Database Reset
                    </CardTitle>
                    <CardDescription>
                        This tool will flush the database (preserving Users & Warehouses) and seed it with test data:
                        <ul className="list-disc ml-5 mt-2 text-xs">
                            <li>5 Lots (1500 Capacity)</li>
                            <li>5 Standard Crops</li>
                            <li>20 Random Customers</li>
                            <li>50 Storage Records</li>
                        </ul>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-md">
                        <strong>Warning:</strong> All existing records, payments, expenses, and customers will be permanently deleted.
                    </div>

                    <Button 
                        variant="destructive" 
                        size="lg" 
                        className="w-full" 
                        onClick={handleReset}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting & Seeding...
                            </>
                        ) : (
                            'FLUSH DB & START FRESH'
                        )}
                    </Button>

                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full" 
                        onClick={() => {
                            if (confirm('Clear local storage and reload?')) {
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.reload();
                            }
                        }}
                    >
                        Clean Local Cache & Reload
                    </Button>

                    {result && (
                        <div className="mt-4 p-4 border rounded bg-muted text-sm whitespace-pre-wrap font-mono">
                            {result}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
