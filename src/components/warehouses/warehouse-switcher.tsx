'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus, Store, UserPlus } from 'lucide-react';
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
import { getUserWarehouses, switchWarehouse, getActiveWarehouseId } from '@/lib/warehouse-actions';
import { CreateWarehouseDialog } from './create-warehouse-dialog';
import { ManageAccessDialog } from './manage-access-dialog';

type Warehouse = {
    id: string;
    role: string;
    name: string;
    location: string;
};

export function WarehouseSwitcher() {
  const [open, setOpen] = React.useState(false);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [currentWarehouse, setCurrentWarehouse] = React.useState<Warehouse | undefined>(undefined);

  React.useEffect(() => {
    const init = async () => {
        try {
            const [list, activeId] = await Promise.all([
                getUserWarehouses(),
                getActiveWarehouseId()
            ]);
            setWarehouses(list);
            if (activeId) {
                const match = list.find((w: any) => w.id === activeId);
                setCurrentWarehouse(match);
            }
        } catch (err) {
            console.error("Warehouse Switcher Error:", err);
        }
    };
    init();
  }, []);

  const onSelectWarehouse = async (id: string) => {
      setOpen(false);
      const res = await switchWarehouse(id);
      if (res.success) {
          window.location.reload(); // Hard refresh to update layout data
      }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <Store className="mr-2 h-4 w-4" />
          {currentWarehouse ? currentWarehouse.name : (warehouses.length > 0 ? "Select Warehouse" : "Loading...")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
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
                  {currentWarehouse && (currentWarehouse.role === 'owner' || currentWarehouse.role === 'admin') && (
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
