'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getFriendlyErrorMessage } from '@/lib/error-utils';
import { createTrialSubscription } from '@/lib/auth-actions';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
        const { error: signUpError, data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                    phone_number: phone,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (signUpError) {
            setError(getFriendlyErrorMessage(signUpError));
        } else if (data.user) {
            // Auto-create trial subscription
            try {
                const searchParams = new URLSearchParams(window.location.search);
                const selectedPlan = searchParams.get('plan') || 'starter';
                
                await createTrialSubscription(data.user.id, selectedPlan);
            } catch (e) {
                console.error("Trial creation failed, but user created:", e);
                // Continue anyway, user can fix subscription later or admin can help
            }

            toast({
                title: "14-Day Free Trial Started!",
                description: "Your account has been created. Redirecting...",
            });
            // Short delay to let the toast show
            setTimeout(() => {
                 router.push('/dashboard');
                 router.refresh();
            }, 1000);
        }
    } catch (err: any) {
        setError(getFriendlyErrorMessage(err));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-blue-500/5" />
      
      {/* Animated glow orbs (same as landing page) */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="absolute top-8 left-8 z-10">
        <Logo href="/" />
      </div>

      <Card className="w-full max-w-sm z-10 shadow-2xl border-muted/60 backdrop-blur-sm bg-background/95">
        <CardHeader>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Enter your details below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={loading}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
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
              <Label htmlFor="phone">Mobile Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="9876543210"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                We'll use this to find your existing records.
              </p>
            </div>
            
            {error && (
              <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={loading}>
              Sign Up
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 bg-muted/50 rounded-b-xl">
            <div className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="underline text-primary hover:text-primary/80 font-medium">
                    Log in
                </Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
