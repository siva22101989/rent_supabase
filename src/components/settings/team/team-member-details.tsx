'use client';

import { TeamMember } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Shield, UserX, PenBox } from "lucide-react";
import { format } from "date-fns";
import { useFormState } from "react-dom";
import { deactivateTeamMember, updateTeamMember } from "@/lib/actions";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTeamMembers } from '@/hooks/use-team-members';

interface TeamMemberDetailsProps {
    member: TeamMember;
}

export function TeamMemberDetails({ member }: TeamMemberDetailsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();
    const { refreshMembers } = useTeamMembers();

    if (isEditing) {
        return <EditMemberForm member={member} onCancel={() => setIsEditing(false)} onSuccess={refreshMembers} />;
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <span className="text-2xl font-bold text-primary">
                            {member.fullName?.substring(0, 2).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{member.fullName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">
                                {member.role}
                            </Badge>
                            {member.role !== 'suspended' && (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <PenBox className="w-4 h-4 mr-2" />
                        Edit Profile
                    </Button>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{member.email}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Account Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Joined {format(new Date(member.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{member.role} Access</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t">
                <h3 className="text-sm font-medium text-destructive mb-4">Danger Zone</h3>
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div>
                        <p className="font-medium text-destructive">Deactivate User Account</p>
                        <p className="text-sm text-muted-foreground">They will no longer be able to log in.</p>
                    </div>
                    <form action={async () => {
                         if(!confirm('Are you sure?')) return;
                         await deactivateTeamMember(member.id);
                         toast({ title: 'User Deactivated', variant: 'destructive' });
                         await deactivateTeamMember(member.id);
                         toast({ title: 'User Deactivated', variant: 'destructive' });
                         refreshMembers();
                    }}>
                        <Button variant="destructive" size="sm">
                            <UserX className="w-4 h-4 mr-2" />
                            Deactivate
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function EditMemberForm({ member, onCancel, onSuccess }: { member: TeamMember, onCancel: () => void, onSuccess: () => void }) {
    const { toast } = useToast();
    
    async function handleSubmit(formData: FormData) {
        const res = await updateTeamMember(member.id, formData);
        if (res.success) {
            toast({ title: 'Success', description: 'Member updated successfully', variant: 'success' });
            onSuccess();
            onCancel();
        } else {
            toast({ title: 'Error', description: res.message, variant: 'destructive' });
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Edit Team Member</h2>
                <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            </div>
            
            <form action={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input name="fullName" defaultValue={member.fullName} required />
                </div>
                
                <div className="grid gap-2">
                    <Label>Role</Label>
                    <Select name="role" defaultValue={member.role}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="staff">Staff</SelectItem>
                             <SelectItem value="manager">Manager</SelectItem>
                             <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        </div>
    );
}
