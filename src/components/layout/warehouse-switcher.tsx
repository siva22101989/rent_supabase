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
import { UserWarehouse } from '@/lib/definitions';
import { switchWarehouse } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface WarehouseSwitcherProps {
  warehouses: UserWarehouse[];
  currentWarehouseId: string;
}

export function WarehouseSwitcher({ warehouses, currentWarehouseId }: WarehouseSwitcherProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const currentWarehouse = warehouses.find(w => w.warehouseId === currentWarehouseId);

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
                 <span className="truncate">{currentWarehouse.warehouse?.name}</span>
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
            key={wh.warehouseId}
            onSelect={() => handleSwitch(wh.warehouseId)}
            className="cursor-pointer"
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">{wh.warehouse?.name}</span>
            <Check
              className={cn(
                "ml-auto h-4 w-4",
                currentWarehouseId === wh.warehouseId ? "opacity-100" : "opacity-0"
              )}
            />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
            className="cursor-pointer text-muted-foreground"
            onSelect={() => {
                toast({ title: "Coming Soon", description: "Create Warehouse feature is under development." });
            }}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Warehouse
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
