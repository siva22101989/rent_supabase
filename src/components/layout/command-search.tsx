
'use client';

import * as React from 'react';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Package,
  ArrowDownToDot,
  ArrowUpFromDot,
  Warehouse,
  IndianRupee,
  Users,
  FileText,
  Search
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function CommandSearch() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const [customers, setCustomers] = React.useState<any[]>([]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch Customers needed for search
  React.useEffect(() => {
      if (open) {
          const fetchCustomers = async () => {
              const supabase = createClient();
              const { data } = await supabase.from('customers').select('id, name, phone, village').limit(20);
              if (data) setCustomers(data);
          }
          fetchCustomers();
      }
  }, [open]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9 md:w-auto md:px-4 md:py-2 relative md:justify-start text-sm text-muted-foreground"
      >
        <Search className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline-flex">Search website...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search customers..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => runCommand(() => router.push('/inflow'))}>
              <ArrowDownToDot className="mr-2 h-4 w-4" />
              <span>New Inflow</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/outflow'))}>
                <ArrowUpFromDot className="mr-2 h-4 w-4" />
              <span>Outflow</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/storage'))}>
              <Warehouse className="mr-2 h-4 w-4" />
              <span>Storage</span>
            </CommandItem>
             <CommandItem onSelect={() => runCommand(() => router.push('/payments/pending'))}>
              <IndianRupee className="mr-2 h-4 w-4" />
              <span>Payments</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          
          <CommandGroup heading="Customers">
            {customers.map(c => (
                <CommandItem key={c.id} onSelect={() => runCommand(() => router.push(`/customers`))}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{c.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({c.village})</span>
                </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
