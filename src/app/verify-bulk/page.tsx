'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { runBulkVerification } from '@/lib/actions/verify-bulk';

export default function VerifyPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const run = async () => {
        setLoading(true);
        setLogs(['Running verification...']);
        try {
            const result = await runBulkVerification();
            setLogs(result.logs);
        } catch (e: any) {
            setLogs(prev => [...prev, `Error invoking action: ${e.message}`]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Bulk Outflow Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        This tool will create dummy records, perform partial and full bulk outflows, 
                        and verify the database state strictly matches the FIFO logic.
                    </p>
                    
                    <Button onClick={run} disabled={loading} className="w-full">
                        {loading ? 'Running Tests...' : 'Run Verification Suite'}
                    </Button>

                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm max-h-[400px] overflow-auto">
                        {logs.length === 0 ? (
                            <span className="text-slate-500">Logs will appear here...</span>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className={`mb-1 ${log.includes('❌') || log.includes('💥') ? 'text-red-400' : (log.includes('✅') ? 'text-green-400' : '')}`}>
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
