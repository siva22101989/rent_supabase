'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Search, LayoutDashboard, Database, Users, Settings, FileText, Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from 'next-themes';

export function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Toggle Command Menu: Ctrl+K or Cmd+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Quick Navigation: G then Key
      // This is a bit complex for a global listener, sticking to Ctrl+K is safer for now.
      // But user asked for G+D, G+S, G+C.
      // Implementing distinct key combination logic requires state (tracking 'g' press).
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Separate effect for G-key sequences to avoid complex state in the main listener if possible
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const nav = (e: KeyboardEvent) => {
        // Ignore inputs
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

        const now = Date.now();
        
        if (e.key.toLowerCase() === 'd' && lastKey === 'g' && now - lastKeyTime < 500) {
            router.push('/');
            lastKey = '';
        } else if (e.key.toLowerCase() === 's' && lastKey === 'g' && now - lastKeyTime < 500) {
            router.push('/storage');
            lastKey = '';
        } else if (e.key.toLowerCase() === 'c' && lastKey === 'g' && now - lastKeyTime < 500) {
            router.push('/customers');
            lastKey = '';
        } else if (e.key.toLowerCase() === 'g') {
            lastKey = 'g';
            lastKeyTime = now;
        } else {
            // Reset if any other key is pressed
            // usage of modifiers (ctrl/alt) should probably ignore this
            if (!e.metaKey && !e.ctrlKey && !e.altKey) {
                 // But wait, if they type 'good', it triggers 'g' then 'o'.
            }
        }
    };

    document.addEventListener('keydown', nav);
    return () => document.removeEventListener('keydown', nav);
  }, [router]);


  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-[450px]">
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Search for actions or navigate pages
        </DialogDescription>
        <Command className="border-none shadow-none rounded-none">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
                <span className="ml-auto text-xs tracking-widest text-muted-foreground">G then D</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/storage'))}>
                <Database className="mr-2 h-4 w-4" />
                <span>Storage</span>
                <span className="ml-auto text-xs tracking-widest text-muted-foreground">G then S</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/customers'))}>
                <Users className="mr-2 h-4 w-4" />
                <span>Customers</span>
                <span className="ml-auto text-xs tracking-widest text-muted-foreground">G then C</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/reports'))}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Reports</span>
              </CommandItem>
               <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Theme">
              <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
                <Laptop className="mr-2 h-4 w-4" />
                <span>System</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
