import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { WithdrawGoodsForm } from "@/components/storage/withdraw-goods-form";
import { storageRecords } from "@/lib/data";

export default function WithdrawPage() {
  const activeRecords = storageRecords.filter(r => !r.storageEndDate);
  return (
    <AppLayout>
      <PageHeader
        title="Withdraw Goods"
        description="Mark a storage record as completed and set the withdrawal date."
      />
      <WithdrawGoodsForm records={activeRecords} />
    </AppLayout>
  );
}
