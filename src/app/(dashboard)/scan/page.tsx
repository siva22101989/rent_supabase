import { PageHeader } from '@/components/shared/page-header';
import { QRScanner } from '@/components/storage/qr-scanner';

export const metadata = {
  title: 'Scan QR Code',
  description: 'Scan storage record QR codes for quick access',
};

export default function QRScanPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="QR Scanner"
        description="Scan storage record QR codes to instantly access records"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Scan QR' },
        ]}
      />
      
      <QRScanner />
    </div>
  );
}
