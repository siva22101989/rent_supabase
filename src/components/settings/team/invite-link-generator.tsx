'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Link2, Copy, Check, Loader2 } from 'lucide-react';
import { generateInviteLink } from '@/lib/warehouse-actions';

export function InviteLinkGenerator() {
    const [role, setRole] = useState('staff');
    const [inviteLink, setInviteLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [warehouseId, setActiveWarehouseId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    // Auto-fetch active warehouse
    useState(() => {
        import('@/lib/warehouse-actions').then(async (mod) => {
             const id = await mod.getActiveWarehouseId();
             setActiveWarehouseId(id);
        });
    });

    const handleGenerate = async () => {
        if (!warehouseId) {
             toast({ title: "Error", description: "No active warehouse found.", variant: "destructive" });
             return;
        }

        setLoading(true);
        try {
            const res = await generateInviteLink(role as any); // Uses server-side warehouse context anyway
            if (res.success && res.data?.token) {
                // Construct full URL (assuming client-side for Origin)
                const origin = window.location.origin;
                const link = `${origin}/invite/${res.data.token}`;
                setInviteLink(link);
                toast({ title: "Link Generated", description: "Share this link with your team." });
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to generate link", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Copied!", description: "Link copied to clipboard." });
    };

    return (
        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Invite via Link
            </h3>
            
            <div className="flex gap-2">
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-[130px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
                
                <Button onClick={handleGenerate} disabled={loading || !warehouseId}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Link"}
                </Button>
            </div>

            {inviteLink && (
                <div className="flex gap-2 animate-in fade-in-50 slide-in-from-top-2">
                    <Input readOnly value={inviteLink} className="font-mono text-xs" />
                    <Button size="icon" variant="outline" onClick={copyToClipboard}>
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                </div>
            )}
        </div>
    );
}
