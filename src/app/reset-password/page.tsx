'use client';

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
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/logo';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/error-utils';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
    }

    if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
    }

    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      const friendlyMsg = getFriendlyErrorMessage(error);
      setError(friendlyMsg);
      toast({
        title: "Error",
        description: friendlyMsg,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Your password has been updated successfully.",
      });
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute top-8 left-8">
            <Logo href="/" />
        </div>
        <Card className="w-full max-w-sm">
        <CardHeader>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
            Enter your new password below.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <form onSubmit={handleUpdatePassword} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                        <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        minLength={6}
                        className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                                {showPassword ? "Hide password" : "Show password"}
                            </span>
                        </button>
                    </div>
                     {/* Password Strength Indicator */}
                    {password && (
                        <div className="space-y-1 transition-all duration-300 ease-in-out">
                            <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-secondary">
                                <div 
                                    className={`h-full transition-all duration-300 ${
                                        password.length < 6 ? "w-1/3 bg-destructive" : 
                                        password.length < 8 ? "w-2/3 bg-yellow-500" : 
                                        "w-full bg-green-500"
                                    }`} 
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">
                                {password.length < 6 ? "Weak" : password.length < 8 ? "Fair" : "Strong"}
                            </p>
                        </div>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                        <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        minLength={6}
                        className="pr-10"
                        />
                         <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            tabIndex={-1}
                             aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                                {showConfirmPassword ? "Hide password" : "Show password"}
                            </span>
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="text-sm font-medium text-destructive">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                </Button>
            </form>
        </CardContent>
        </Card>
    </div>
  );
}
