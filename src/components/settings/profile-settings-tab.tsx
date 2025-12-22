'use client';

import { useActionState, useEffect, useRef } from "react";
import { updateUserProfile, changePassword, type FormState } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from "@/components/ui/submit-button";

function ChangePasswordForm() {
    const [state, formAction] = useActionState(changePassword, { message: '', success: false });
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
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="password" name="password" type="password" className="pl-9" required minLength={6} placeholder="••••••" />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="confirmPassword" name="confirmPassword" type="password" className="pl-9" required minLength={6} placeholder="••••••" />
                </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
                <SubmitButton>Update Password</SubmitButton>
            </div>
        </form>
    );
}

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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                         <div className="space-y-1">
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Manage your personal details and account settings.</CardDescription>
                         </div>
                         <Badge variant="secondary" className="text-sm px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 w-fit">
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
                                <Input id="fullName" name="fullName" defaultValue={state.data?.fullName || profile?.full_name || ''} className="pl-9" placeholder="John Doe" />
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

            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Update your password and security settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChangePasswordForm />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Appearance & Layout</CardTitle>
                    <CardDescription>Customize how the application looks and feels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                            className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors flex items-start gap-3"
                            onClick={() => {
                                localStorage.setItem('bagbill-layout-mode', 'header');
                                window.location.reload();
                            }}
                        >
                            <div className="h-20 w-32 bg-slate-100 rounded-md border-2 border-slate-200 flex flex-col p-1 gap-1">
                                <div className="h-3 w-full bg-slate-300 rounded-sm" />
                                <div className="flex-1 w-full bg-white rounded-sm" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">Top Navigation</h4>
                                <p className="text-xs text-muted-foreground">Classic top header with centered content. Best for simple workflows.</p>
                            </div>
                        </div>

                        <div 
                            className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors flex items-start gap-3"
                            onClick={() => {
                                localStorage.setItem('bagbill-layout-mode', 'sidebar');
                                window.location.reload();
                            }}
                        >
                            <div className="h-20 w-32 bg-slate-100 rounded-md border-2 border-slate-200 flex p-1 gap-1">
                                <div className="h-full w-8 bg-slate-300 rounded-sm" />
                                <div className="flex-1 h-full bg-white rounded-sm" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">Sidebar Navigation</h4>
                                <p className="text-xs text-muted-foreground">Collapsible side menu with maximizing workspace. Best for power users.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
