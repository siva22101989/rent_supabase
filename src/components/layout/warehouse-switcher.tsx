'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Building2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWarehouses } from '@/contexts/warehouse-context';
import { switchWarehouse } from '@/lib/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CreateWarehouseDialog } from '@/components/warehouses/create-warehouse-dialog';

export function WarehouseSwitcher() {
  const { warehouses, currentWarehouse } = useWarehouses();
  const currentWarehouseId = currentWarehouse?.id || '';
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleSwitch = async (warehouseId: string) => {
    if (warehouseId === currentWarehouseId) return;

    setLoading(true);
    try {
        const result = await switchWarehouse(warehouseId);
        if (result.success) {
            toast({
                title: "Success",
                description: "Switched warehouse context",
            });
            // Force hard refresh to ensure all server components update if revalidatePath misses some
            router.refresh(); 
        } else {
            toast({
                variant: 'destructive',
                title: "Error",
                description: result.message
            });
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: "Error",
            description: "Failed to switch warehouse"
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-[200px] justify-between hidden md:flex"
          disabled={loading}
        >
          {loading ? (
             <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 animate-pulse" />
                Switching...
             </span>
          ) : currentWarehouse ? (
            <span className="flex items-center gap-2 truncate">
                 <Building2 className="h-4 w-4 text-muted-foreground" />
                 <span className="truncate">{currentWarehouse.name}</span>
            </span>
          ) : (
            "Select Warehouse"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        <DropdownMenuLabel>My Warehouses</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {warehouses.map((wh) => (
          <DropdownMenuItem
            key={wh.id}
            onSelect={() => handleSwitch(wh.id)}
            className="cursor-pointer"
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">{wh.name}</span>
            <Check
              className={cn(
                "ml-auto h-4 w-4",
                currentWarehouseId === wh.id ? "opacity-100" : "opacity-0"
              )}
            />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
            className="cursor-pointer text-muted-foreground"
            onSelect={() => setIsDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Warehouse
        </DropdownMenuItem>
      </DropdownMenuContent>
      <CreateWarehouseDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </DropdownMenu>
  );
}
