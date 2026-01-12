
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
  Search,
  LayoutDashboard,
  Sun,
  Moon
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

import { useTheme } from "next-themes";

export function CommandSearch() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const [customers, setCustomers] = React.useState<any[]>([]);
  const { setTheme } = useTheme();

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

  const [records, setRecords] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);

  React.useEffect(() => {
      if (open) {
          const fetchData = async () => {
              const supabase = createClient();
              const [
                { data: customersData },
                { data: recordsData },
                { data: paymentsData }
              ] = await Promise.all([
                 supabase.from('customers').select('id, name, phone, village').limit(50).order('name'),
                 supabase.from('storage_records').select('id, record_number, commodity_description').limit(20).order('record_number', { ascending: false }),
                 supabase.from('payments').select('id, payment_number, amount, type').limit(20).order('payment_number', { ascending: false })
              ]);
              
              if (customersData) setCustomers(customersData);
              if (recordsData) setRecords(recordsData);
              if (paymentsData) setPayments(paymentsData);
          }
          fetchData();
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
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/inflow'))}>
              <ArrowDownToDot className="mr-2 h-4 w-4" />
              <span>New Inflow</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/outflow'))}>
                <ArrowUpFromDot className="mr-2 h-4 w-4" />
              <span>New Outflow</span>
            </CommandItem>
             <CommandItem onSelect={() => runCommand(() => router.push('/storage'))}>
              <Package className="mr-2 h-4 w-4" />
              <span>Storage</span>
            </CommandItem>
             <CommandItem onSelect={() => runCommand(() => router.push('/payments/pending'))}>
              <IndianRupee className="mr-2 h-4 w-4" />
              <span>Pending Payments</span>
            </CommandItem>
             <CommandItem onSelect={() => runCommand(() => router.push('/reports'))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Reports</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          
          <CommandGroup heading="Customers">
            {customers.map(c => (
                <CommandItem key={c.id} onSelect={() => runCommand(() => router.push(`/customers/${c.id}`))}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{c.name}</span>
                    {c.phone && <span className="ml-2 text-xs text-muted-foreground">({c.phone})</span>}
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
             <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Theme</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Theme</span>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          <CommandGroup heading="Recent Records">
            {records.map(r => (
                <CommandItem key={r.id} onSelect={() => runCommand(() => router.push(`/storage?id=${r.id}`))}>
                    <Package className="mr-2 h-4 w-4" />
                    <span>#{r.record_number || r.id.substring(0,8)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({r.commodity_description})</span>
                </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Recent Payments">
             {payments.map(p => (
                <CommandItem key={p.id} onSelect={() => runCommand(() => router.push(`/payments/history?id=${p.id}`))}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>RCPT #{p.payment_number}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({p.type} - ₹{p.amount})</span>
                </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
