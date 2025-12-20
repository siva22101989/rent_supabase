'use client';

import { createWarehouse } from "@/lib/warehouse-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function WelcomeOnboarding() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleCreate(formData: FormData) {
    setLoading(true);
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const capacity = Number(formData.get('capacity'));
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;

    try {
        const result = await createWarehouse(name, location, capacity, email, phone);
        if (result.success) {
            toast({ title: "Welcome aboard!", description: "Your warehouse is ready." });
            // Force reload to update Layout/TopBar contexts which depend on the new profile state
            window.location.reload();
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    } catch (e) {
         toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30 animate-in fade-in duration-500">
        <div className="max-w-md w-full space-y-6">
            <div className="text-center space-y-2 animate-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-backwards">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 shadow-sm">
                    <Warehouse className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome to RENT</h1>
                <p className="text-muted-foreground">You don&#39;t have any warehouses yet. Let&#39;s set up your first one to get started.</p>
            </div>
            
            <Card className="border-muted/60 shadow-lg animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-backwards">
                <CardHeader>
                    <CardTitle>Create Warehouse</CardTitle>
                    <CardDescription>Enter the details of your facility.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleCreate} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Warehouse Name</Label>
                            <Input id="name" name="name" placeholder="e.g. Main Godown" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" placeholder="City, State" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" placeholder="+91..." />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email (Optional)</Label>
                                <Input id="email" name="email" type="email" placeholder="warehouse@example.com" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="capacity">Total Capacity (Bags)</Label>
                            <Input id="capacity" name="capacity" type="number" placeholder="5000" required />
                        </div>
                        <Button type="submit" className="w-full mt-2" isLoading={loading}>
                            Get Started
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
