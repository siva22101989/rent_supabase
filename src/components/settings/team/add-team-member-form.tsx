'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createTeamMember, type FormState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useTeamMembers } from '@/hooks/use-team-members';

const initialState: FormState = { message: '', success: false };

export function AddTeamMemberForm({ onSuccess }: { onSuccess?: () => void }) {
    const [state, formAction, isPending] = useActionState(createTeamMember, initialState);
    const { toast } = useToast();
    const { refreshMembers } = useTeamMembers();
    const lastHandledRef = useRef<any>(null);

    useEffect(() => {
        if (state.message && state !== lastHandledRef.current) {
            lastHandledRef.current = state;
            toast({
                title: state.success ? 'Success' : 'Error',
                description: state.message,
                variant: state.success ? 'success' : 'destructive',
            });
            
            if (state.success && onSuccess) {
                onSuccess();
            }
            if (state.success) {
                refreshMembers();
            }
        }
    }, [state, toast, onSuccess, refreshMembers]);

    return (
        <form action={formAction} className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="jane@example.com" required />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="staff">
                    <SelectTrigger>
                        <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="staff">Staff - Can manage records</SelectItem>
                        <SelectItem value="manager">Manager - Can manage team</SelectItem>
                        <SelectItem value="admin">Admin - Full Access</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="password">Initial Password</Label>
                <Input id="password" name="password" type="password" required minLength={6} placeholder="******" />
                <p className="text-[0.8rem] text-muted-foreground">
                    They can change this after logging in.
                </p>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                </Button>
            </div>
        </form>
    );
}
