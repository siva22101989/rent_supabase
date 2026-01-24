'use client';

import { useState } from 'react';
import { generateInviteLink } from '@/lib/warehouse-actions';
import { UserRole } from '@/types/db';
import { useUnifiedToast } from '@/components/shared/toast-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Copy, Link as LinkIcon, Loader2, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function ManageAccessDialog() {
  const { toast } = useUnifiedToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.STAFF);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
      setInviteLoading(true);
      const res = await generateInviteLink(inviteRole);
      setInviteLoading(false);
      
      if (res.success && res.data) {
          const url = `${window.location.origin}/invite/${res.data.token}`;
          setInviteLink(url);
      } else {
          toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied!', description: 'Invite link copied to clipboard.' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
         <Button variant="ghost" className="w-full justify-start text-sm font-normal">
            <UserPlus className="mr-2 h-4 w-4" />
            Manage Access
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Access</DialogTitle>
            <DialogDescription>
              Invite team members or manage existing staff.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="invite" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invite">Invite</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>
            <TabsContent value="invite" className="space-y-4 py-4">
                <div className="flex flex-col items-center justify-center space-y-4 text-center border-2 border-dashed rounded-lg p-6 bg-muted/20">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <LinkIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-medium">Magic Link</h3>
                        <p className="text-sm text-muted-foreground">Share this link to let anyone join as Staff.</p>
                    </div>
                    
                    <div className="w-full text-left space-y-2">
                        <Label>Member Role</Label>
                        <Select value={inviteRole} onValueChange={(val: any) => {
                            setInviteRole(val);
                            setInviteLink(''); // Clear link if role changes
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="staff">Staff (Can manage records)</SelectItem>
                                <SelectItem value="manager">Manager (Can manage team)</SelectItem>
                                <SelectItem value="admin">Admin (Full Access)</SelectItem>
                                <SelectItem value="owner">Owner (Full Warehouse Access)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {!inviteLink ? (
                        <Button className="w-full" onClick={handleGenerateLink} disabled={inviteLoading}>
                            {inviteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Generate Invite Link
                        </Button>
                    ) : (
                        <div className="flex w-full max-w-sm items-center space-x-2">
                            <Input value={inviteLink} readOnly />
                            <Button size="icon" onClick={copyToClipboard}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="members">
                <div className="text-center py-8 text-muted-foreground">
                    Member list feature coming soon.
                </div>
            </TabsContent>
          </Tabs>
      </DialogContent>
    </Dialog>
  );
}
