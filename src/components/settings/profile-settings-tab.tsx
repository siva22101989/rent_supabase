'use client';

import { useActionState, useEffect, useRef } from "react";
import { updateUserProfile, type FormState } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from "@/components/ui/submit-button";

type ProfileTabProps = {
    profile: any;
};

const initialState: FormState = {
  message: '',
  success: false
};

export function ProfileSettingsTab({ profile }: ProfileTabProps) {
    const [state, formAction] = useActionState(updateUserProfile, initialState);
    const { toast } = useToast();
    const lastHandledRef = useRef<any>(null);

    useEffect(() => {
        if (state.message && state !== lastHandledRef.current) {
             lastHandledRef.current = state;
             toast({
                title: state.success ? "Success" : "Error",
                description: state.message,
                variant: state.success ? "default" : "destructive"
            });
        }
    }, [state, toast]);

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Manage your personal details and account settings.</CardDescription>
                         </div>
                         <Badge variant="secondary" className="text-sm px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                            <Shield className="w-3 h-3 mr-1 inline-block" />
                            {profile?.role || 'Staff'}
                         </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="grid gap-4 md:grid-cols-2">
                         <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="fullName" name="fullName" defaultValue={profile?.full_name || ''} className="pl-9" placeholder="John Doe" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                             <Label htmlFor="email">Email Address</Label>
                             <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="email" value={profile?.email || ''} disabled className="pl-9 bg-muted" />
                             </div>
                             <p className="text-[0.8rem] text-muted-foreground">Email cannot be changed.</p>
                        </div>
                        
                        <div className="md:col-span-2 flex justify-end">
                            <SubmitButton>Update Profile</SubmitButton>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
