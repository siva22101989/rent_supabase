import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function PricingPage() {
    const plans = [
        {
            name: 'Free',
            price: '₹0',
            description: 'Essential tools for small businesses just starting out.',
            features: [
                'Basic Inventory (Inflow/Outflow)',
                'Customer Management',
                'Basic Reports',
                '1 User Limit',
                '100 Storage Records'
            ],
            tier: 'free',
            cta: 'Current Plan',
            popular: false
        },
        {
            name: 'Starter',
            price: '₹499/mo',
            description: 'For growing warehouses.',
            features: [
                'Everything in Free',
                'Advanced Reports Export (PDF/Excel)',
                'WhatsApp Notifications',
                '3 Users Limit',
                '10,000 Storage Records'
            ],
            tier: 'starter',
            cta: 'Contact Sales',
            popular: true
        },
        {
            name: 'Professional',
            price: '₹1,499/mo',
            description: 'Power features for established businesses.',
            features: [
                'Everything in Starter',
                'Analytics Dashboard',
                'Multiple Warehouses',
                '10 Users Limit',
                '100,000 Storage Records'
            ],
            tier: 'professional',
            cta: 'Contact Sales',
            popular: false
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            description: 'Tailored solutions for large-scale operations.',
            features: [
                'Everything in Professional',
                'API Access',
                'Dedicated Account Manager',
                '50+ Users',
                '1,000,000+ Records'
            ],
            tier: 'enterprise',
            cta: 'Contact Sales',
            popular: false
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <header className="px-6 h-16 flex items-center border-b">
                <Link href="/" className="font-bold text-xl flex items-center gap-2">
                    <img src="/icon.svg" alt="Logo" className="w-8 h-8" />
                    Grain Flow
                </Link>
                <div className="ml-auto flex gap-4">
                    <Button variant="ghost" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                </div>
            </header>

            <main className="py-20 px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Choose the plan that's right for your warehouse. All plans include a 14-day free trial.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan) => (
                        <Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                            <CardHeader>
                                {plan.popular && (
                                    <div className="text-primary text-sm font-semibold tracking-wide uppercase mb-2">
                                        Most Popular
                                    </div>
                                )}
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-4xl font-bold mb-6">
                                    {plan.price}
                                </div>
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" size="lg" variant={plan.popular ? 'default' : 'outline'} asChild>
                                    <Link href="https://wa.me/919999999999">Contact Sales</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                
                <div className="mt-20 text-center">
                    <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                         To subscribe, please contact our sales team to receive an activation code. 
                         We accept UPI, Bank Transfer, and Cash.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button size="lg" onClick={() => window.open('https://wa.me/919999999999', '_blank')}>
                            Contact Sales via WhatsApp
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/login">Log In to Redeem Code</Link>
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
