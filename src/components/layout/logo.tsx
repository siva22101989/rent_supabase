import { Package } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3 px-4 h-14">
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <Package size={24} />
      </div>
      <span className="font-headline font-semibold text-xl text-primary">BagBill</span>
    </div>
  );
}
