'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUnifiedToast } from '@/components/shared/toast-provider';
import { Loader2, Plus, Copy, Check } from 'lucide-react';
import { generateCodeAction } from '@/lib/subscription-code-actions';
// import { Plan } from '../admin/subscriptions-table'; // Improve types later

interface Plan {
    id: string;
    name: string;
    tier: string;
}

interface CodeGeneratorProps {
    plans: Plan[];
}

export function CodeGenerator({ plans }: CodeGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<'form' | 'results'>('form');
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const { success, error } = useUnifiedToast();

  // Form State
  const [planId, setPlanId] = useState('');
  const [duration, setDuration] = useState('30');
  const [count, setCount] = useState('1');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
      if (!planId) return;
      setLoading(true);
      try {
            // Need to fetch generated codes back from action ideally, 
            // but for now let's assume I need to fetch them or just show success.
            // Wait, my action doesn't return the codes! I should update the action.
            // Let's update the action first to return the codes.
            // Assume action returns { success: true, codes: string[] }
            
            // Temporary fix: I will update the action in next step.
            // For this file, I'll assume the action returns { codes: [...] }
            const res = await generateCodeAction({
                planId,
                durationDays: parseInt(duration),
                count: parseInt(count),
                notes
            }) as any;

            if (res.codes) {
                setGeneratedCodes(res.codes);
                setScreen('results');
                success("Success", `${res.codes.length} codes generated.`);
            }
      } catch (err: any) {
          error("Error", err.message);
      } finally {
          setLoading(false);
      }
  };

  const copyToClipboard = () => {
      const text = generatedCodes.join('\n');
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      success("Copied", "Codes copied to clipboard");
  };

  const reset = () => {
      setScreen('form');
      setGeneratedCodes([]);
      setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
            <Plus className="w-4 h-4" /> Generate Codes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Activation Codes</DialogTitle>
          <DialogDescription>Create codes for manual distribution.</DialogDescription>
        </DialogHeader>

        {screen === 'form' ? (
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="plan">Plan</Label>
                    <Select value={planId} onValueChange={setPlanId}>
                        <SelectTrigger id="plan">
                            <SelectValue placeholder="Select Plan" />
                        </SelectTrigger>
                        <SelectContent>
                            {plans.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name} - {p.tier}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="duration">Duration (Days)</Label>
                        <Input 
                            id="duration"
                            name="duration"
                            type="number" 
                            value={duration} 
                            onChange={e => setDuration(e.target.value)}
                            min={1}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="count">Quantity</Label>
                        <Input 
                            id="count"
                            name="count"
                            type="number" 
                            value={count} 
                            onChange={e => setCount(e.target.value)}
                            min={1} 
                            max={50}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Internal)</Label>
                    <Textarea 
                        id="notes"
                        name="notes"
                        placeholder="e.g. Bulk order for Client X, Payment Ref #123"
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>
            </div>
        ) : (
            <div className="py-4">
                <div className="bg-muted p-4 rounded-md font-mono text-sm tracking-wide space-y-2 max-h-[300px] overflow-auto">
                    {generatedCodes.map((c, i) => (
                        <div key={i} className="border-b last:border-0 pb-1 last:pb-0 border-muted-foreground/20">
                            {c}
                        </div>
                    ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2 gap-2" onClick={copyToClipboard}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy All'}
                </Button>
            </div>
        )}

        <DialogFooter>
            {screen === 'form' ? (
                <Button onClick={handleGenerate} disabled={loading || !planId}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate
                </Button>
            ) : (
                <Button onClick={reset}>Done</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
