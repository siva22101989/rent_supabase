'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Mail, Smartphone, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getNotificationPreferences, updateNotificationPreferences, type NotificationPreferences } from '@/lib/notification-actions';
import { Separator } from '@/components/ui/separator';

interface NotificationSettingsProps {
    warehouseId: string;
}

export function NotificationSettings({ warehouseId }: NotificationSettingsProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

    useEffect(() => {
        loadPreferences();
    }, [warehouseId]);

    const loadPreferences = async () => {
        setLoading(true);
        const prefs = await getNotificationPreferences(warehouseId);
        setPreferences(prefs);
        setLoading(false);
    };

    const handleToggle = (field: keyof NotificationPreferences, value: boolean) => {
        if (!preferences) return;
        setPreferences({ ...preferences, [field]: value });
    };

    const handleSave = async () => {
        if (!preferences) return;

        setSaving(true);
        const result = await updateNotificationPreferences(warehouseId, {
            payment_received: preferences.payment_received,
            low_stock_alert: preferences.low_stock_alert,
            pending_dues: preferences.pending_dues,
            new_inflow: preferences.new_inflow,
            new_outflow: preferences.new_outflow,
            in_app: preferences.in_app,
            email: preferences.email,
            sms: preferences.sms
        });

        setSaving(false);

        if (result.error) {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive'
            });
        } else {
            toast({
                title: 'Saved',
                description: 'Notification preferences updated successfully'
            });
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription>Loading your preferences...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!preferences) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Failed to load preferences</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                </CardTitle>
                <CardDescription>
                    Control which notifications you receive and how
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Event Type Preferences */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Event Types</h3>
                    
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="payment_received">Payment Received</Label>
                            <p className="text-sm text-muted-foreground">
                                Get notified when customers make payments
                            </p>
                        </div>
                        <Switch
                            id="payment_received"
                            checked={preferences.payment_received}
                            onCheckedChange={(checked) => handleToggle('payment_received', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="low_stock_alert">High Capacity Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                                Get notified when a lot is 90% full
                            </p>
                        </div>
                        <Switch
                            id="low_stock_alert"
                            checked={preferences.low_stock_alert}
                            onCheckedChange={(checked) => handleToggle('low_stock_alert', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="pending_dues">Pending Dues</Label>
                            <p className="text-sm text-muted-foreground">
                                Notify about outstanding customer balances
                            </p>
                        </div>
                        <Switch
                            id="pending_dues"
                            checked={preferences.pending_dues}
                            onCheckedChange={(checked) => handleToggle('pending_dues', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="new_inflow">New Inflow</Label>
                            <p className="text-sm text-muted-foreground">
                                Notify when new storage records are created
                            </p>
                        </div>
                        <Switch
                            id="new_inflow"
                            checked={preferences.new_inflow}
                            onCheckedChange={(checked) => handleToggle('new_inflow', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="new_outflow">New Outflow</Label>
                            <p className="text-sm text-muted-foreground">
                                Notify when storage records are closed
                            </p>
                        </div>
                        <Switch
                            id="new_outflow"
                            checked={preferences.new_outflow}
                            onCheckedChange={(checked) => handleToggle('new_outflow', checked)}
                        />
                    </div>
                </div>

                <Separator />

                {/* Delivery Method Preferences */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Delivery Methods</h3>
                    
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex items-center gap-2">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <Label htmlFor="in_app">In-App Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Show notifications in the bell icon
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="in_app"
                            checked={preferences.in_app}
                            onCheckedChange={(checked) => handleToggle('in_app', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between opacity-50">
                        <div className="space-y-0.5 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <Label htmlFor="email">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Coming soon - email delivery
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="email"
                            checked={preferences.email}
                            onCheckedChange={(checked) => handleToggle('email', checked)}
                            disabled
                        />
                    </div>

                    <div className="flex items-center justify-between opacity-50">
                        <div className="space-y-0.5 flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <Label htmlFor="sms">SMS Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Coming soon - SMS delivery
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="sms"
                            checked={preferences.sms}
                            onCheckedChange={(checked) => handleToggle('sms', checked)}
                            disabled
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Preferences
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
