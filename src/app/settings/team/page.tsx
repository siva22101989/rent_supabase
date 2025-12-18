'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { useFormState } from 'react-dom';
import { createTeamMember, type FormState } from '@/lib/actions'; 
import { PageHeader } from '@/components/shared/page-header';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const initialState: FormState = { message: '', success: false };

export default function TeamSettingsPage() {
  const [state, formAction] = useFormState(createTeamMember, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <AppLayout>
      <PageHeader title="Team Management" description="Create accounts for your staff." />
      
      <div className="grid gap-6 max-w-2xl px-4 md:px-0">
        <Card>
          <CardHeader>
            <CardTitle>Add New Team Member</CardTitle>
            <CardDescription>
              Create a new user. They can log in immediately with these credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="grid gap-4">
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
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required minLength={6} placeholder="******" />
              </div>

              <Button type="submit" className="w-full md:w-auto">
                Create User
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
