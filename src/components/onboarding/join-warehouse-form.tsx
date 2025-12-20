'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, Send } from "lucide-react";
import { requestJoinWarehouse } from '@/lib/warehouse-actions';

export function JoinWarehouseForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleJoin(formData: FormData) {
    setLoading(true);
    const email = formData.get('email') as string;

    try {
        const result = await requestJoinWarehouse(email);
        if (result.success) {
            toast({ 
                title: "Request Sent", 
                description: "The warehouse admin has been notified." 
            });
            // Show success state or disable form?
        } else {
            toast({ 
                title: "Error", 
                description: result.message, 
                variant: "destructive" 
            });
        }
    } catch (e) {
         toast({ title: "Error", description: "Failed to send request.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
        <div className="max-w-md w-full space-y-6">
             <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 shadow-sm">
                    <Users className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Join a Warehouse</h1>
                <p className="text-muted-foreground">You are not currently assigned to any warehouse. Ask your admin to invite you, or request access below.</p>
            </div>

            <Card className="border-muted/60 shadow-lg">
                <CardHeader>
                    <CardTitle>Request Access</CardTitle>
                    <CardDescription>Enter the email address of the Warehouse Admin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleJoin} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Admin Email</Label>
                            <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
                        </div>
                        <Button type="submit" className="w-full mt-2" isLoading={loading}>
                            <Send className="w-4 h-4 mr-2" />
                            Send Request
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
