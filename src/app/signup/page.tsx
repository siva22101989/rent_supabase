'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up Disabled</CardTitle>
          <CardDescription>
            Public registration is currently closed. Please contact your administrator or manager to create an account for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
             <Button asChild className="w-full">
                <Link href="/login">Back to Login</Link>
             </Button>
        </CardContent>
      </Card>
    </div>
  );
}
