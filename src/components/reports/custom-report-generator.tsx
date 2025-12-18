'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { fetchReportData } from '@/lib/report-actions';
import { generateCustomReportPDF, exportCustomReportToExcel } from '@/lib/export-utils';
import { useToast } from '@/hooks/use-toast';

interface CustomReportGeneratorProps {
    warehouseName: string;
}

export function CustomReportGenerator({ warehouseName }: CustomReportGeneratorProps) {
    const [reportType, setReportType] = useState('all-customers');
    const [format, setFormat] = useState('pdf');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const isDateRangeRequired = [
        'inflow-register', 
        'outflow-register', 
        'payment-register'
    ].includes(reportType);

    const handleGenerate = async () => {
        if (isDateRangeRequired && (!startDate || !endDate)) {
            toast({
                title: "Dates Required",
                description: "Please select both start and end dates for this report.",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        try {
            // 1. Fetch Data
            const data = await fetchReportData(reportType, {
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            
            if (!data) {
                toast({
                    title: "Error",
                    description: "Failed to fetch report data",
                    variant: "destructive",
                });
                return;
            }

            // 2. Generate Export
            if (format === 'pdf') {
                generateCustomReportPDF(reportType, data, warehouseName);
                toast({
                    title: "Success",
                    description: "PDF Generated successfully",
                });
            } else {
                exportCustomReportToExcel(reportType, data);
                toast({
                    title: "Success",
                    description: "Excel Generated successfully",
                });
            }
        } catch (error) {
            console.error('Report generation error:', error);
            toast({
                title: "Error",
                description: "Failed to generate report",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Custom Report Generator</CardTitle>
                <CardDescription>
                    Select the report type and format to generate a detailed analysis.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2 md:col-span-2">
                        <Label>Report Type</Label>
                        <Select value={reportType} onValueChange={setReportType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all-customers">All Customers List</SelectItem>
                                <SelectItem value="active-inventory">Active Inventory (Stock)</SelectItem>
                                <SelectItem value="pending-dues">Pending Dues List</SelectItem>
                                <SelectItem value="inflow-register">Inflow Register (Date Range)</SelectItem>
                                <SelectItem value="outflow-register">Outflow Register (Date Range)</SelectItem>
                                <SelectItem value="payment-register">Payment Register (Date Range)</SelectItem>
                                <SelectItem value="transaction-history">Recent Transactions (Last 1000)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            {reportType === 'all-customers' && 'List of all registered customers with their active bag counts.'}
                            {reportType === 'active-inventory' && 'Detailed list of currently stored items in the warehouse.'}
                            {reportType === 'pending-dues' && 'List of customers with outstanding balances.'}
                            {reportType === 'inflow-register' && 'Log of items received during the selected period.'}
                            {reportType === 'outflow-register' && 'Log of items withdrawn during the selected period.'}
                            {reportType === 'payment-register' && 'Log of payments received during the selected period.'}
                            {reportType === 'transaction-history' && 'Log of recent inflows and outflows (last 1000 records).'}
                        </p>
                    </div>

                    {isDateRangeRequired && (
                        <>
                            <div className="space-y-2">
                                <Label>From Date</Label>
                                <Input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>To Date</Label>
                                <Input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} 
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label>Export Format</Label>
                        <Select value={format} onValueChange={setFormat}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pdf">PDF Document</SelectItem>
                                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button 
                        onClick={handleGenerate} 
                        disabled={isLoading}
                        className="w-full md:w-auto min-w-[200px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                {format === 'pdf' ? <FileText className="mr-2 h-4 w-4" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                                Generate Report
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
