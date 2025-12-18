import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/app-layout';

export default function NotFound() {
  return (
    <AppLayout>
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-4xl font-bold">404 Not Found</h2>
        <p className="text-muted-foreground">Could not find the requested resource.</p>
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </AppLayout>
  );
}
