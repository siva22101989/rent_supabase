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
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    
    // Check if input looks like a mobile number (10 digits)
    let loginEmail = email.trim();
    const isMobile = /^\d{10}$/.test(loginEmail);
    
    if (isMobile) {
        loginEmail = `${loginEmail}@rentapp.local`;
        console.log("Logging in via mobile:", loginEmail);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute top-8 left-8">
            <Logo />
        </div>
        <Card className="w-full max-w-sm">
        <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
            Enter your email below to login to your account.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <form onSubmit={handleLogin} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email or Mobile Number</Label>
                    <Input
                    id="email"
                    name="email"
                    type="text"
                    placeholder="Mobile Number or Email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link 
                            href="/forgot-password" 
                            className="text-xs text-muted-foreground underline hover:text-primary transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    />
                </div>
                 {error && (
                    <div className="text-sm font-medium text-destructive">{error}</div>
                )}
                <Button type="submit" className="w-full" isLoading={loading}>
                    Login
                </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <Link href="/signup" className="underline text-primary hover:text-primary/80 font-medium">
                    Sign up
                </Link>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
