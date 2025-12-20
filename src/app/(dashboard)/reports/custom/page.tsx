import { PageHeader } from "@/components/shared/page-header";
import { CustomReportGenerator } from "@/components/reports/custom-report-generator";
import { getWarehouseDetails } from "@/lib/queries";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CustomReportsPage() {
    const warehouse = await getWarehouseDetails();
    
    if (!warehouse) {
        redirect('/login');
    }

    return (
        <>
            <div className="space-y-6">
                <div>
                    <Button variant="ghost" size="sm" asChild className="mb-4">
                        <Link href="/reports">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Reports
                        </Link>
                    </Button>
                    <PageHeader
                        title="Custom Reports"
                        description="Generate detailed reports for compliance and analysis"
                    />
                </div>

                <div className="mt-8">
                    <CustomReportGenerator warehouseName={warehouse.name} />
                </div>
            </div>
        </>
    );
}
