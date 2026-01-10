import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/shared/print-button";
import Link from "next/link";
import { X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { InflowReceipt } from "@/components/inflow/inflow-receipt";
import { getStorageRecord, getCustomer, getWarehouseDetails } from "@/lib/queries";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function InflowReceiptPage({ params }: { params: Promise<{ recordId: string }> }) {
  const { recordId } = await params;
  
  const [record, warehouse] = await Promise.all([
    getStorageRecord(recordId),
    getWarehouseDetails()
  ]);
  
  const customer = record ? await getCustomer(record.customerId) : null;

  if (!record || !customer) {
    notFound();
  }
  
  return (
    <>
      <PageHeader
        title="Inflow Receipt"
        description={`Details for storage record ${record.recordNumber || record.id}`}
      >
        <PrintButton />
        <Button asChild variant="outline" size="sm" className="print:hidden gap-2">
            <Link href="/inflow">
                <X className="h-4 w-4" /> Close
            </Link>
        </Button>
      </PageHeader>
      <div className="flex justify-center">
        <InflowReceipt record={record} customer={customer} warehouse={warehouse} />
      </div>
    </>
  );
}
