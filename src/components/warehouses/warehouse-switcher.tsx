'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { switchWarehouse } from '@/lib/warehouse-actions';
import { CreateWarehouseDialog } from './create-warehouse-dialog';
import { ManageAccessDialog } from './manage-access-dialog';
import { useRouter } from 'next/navigation';
import { useWarehouses } from '@/contexts/warehouse-context';

export function WarehouseSwitcher() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { warehouses, currentWarehouse, setCurrentWarehouse, isLoading } = useWarehouses();

  const onSelectWarehouse = async (id: string) => {
      setOpen(false);
      const res = await switchWarehouse(id);
      if (res.success) {
          // Update current warehouse immediately
          const match = warehouses.find(w => w.id === id);
          setCurrentWarehouse(match);
          
          // Refresh the page data
          router.refresh();
      }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Switch warehouse"
          className="w-9 h-9 p-0 md:w-[200px] md:h-auto md:px-3 md:py-2 md:justify-between"
        >
          {/* Mobile: Show warehouse initial in a circle */}
          <div className="flex md:hidden items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-xs">
            {currentWarehouse?.name?.[0]?.toUpperCase() || 'W'}
          </div>
          
          {/* Desktop: Show full warehouse selector */}
          <div className="hidden md:flex items-center w-full">
            <Store className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate flex-1 text-left">
              {currentWarehouse ? currentWarehouse.name : (isLoading ? "Loading..." : "Select Warehouse")}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="end" sideOffset={8}>
        <Command>
          <CommandInput placeholder="Search warehouse..." />
          <CommandList>
            <CommandEmpty>No warehouse found.</CommandEmpty>
            <CommandGroup heading="My Warehouses">
              {warehouses.map((framework) => (
                <CommandItem
                  key={framework.id}
                  value={framework.name} // Search by name
                  onSelect={() => onSelectWarehouse(framework.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentWarehouse?.id === framework.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {framework.name}
                  {framework.role === 'owner' && <span className="ml-auto text-xs text-muted-foreground">(Owner)</span>}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
               <div className="p-1 gap-1 flex flex-col">
                  {/* Create Dialog inside Popover triggers nested dialog issues usually, 
                      but since we used DialogTrigger as Child above, maybe separate? 
                      Actually better to separate them from CommandItem to avoid click conflicts.
                  */}
                  <CreateWarehouseDialog />
                  {currentWarehouse && (currentWarehouse.role === 'owner' || currentWarehouse.role === 'admin' || currentWarehouse.role === 'super_admin') && (
                      <ManageAccessDialog />
                  )}
               </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
