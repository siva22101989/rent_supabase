import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { NewStorageForm } from "@/components/storage/new-storage-form";
import { customers } from "@/lib/data";

export default function NewStoragePage() {
  return (
    <AppLayout>
      <PageHeader
        title="New Storage Entry"
        description="Create a new storage record and calculate initial rent."
      />
      <NewStorageForm customers={customers} />
    </AppLayout>
  );
}
