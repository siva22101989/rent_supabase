'use client';

import Link from "next/link";
import { ArrowDownToDot, ArrowUpFromDot, IndianRupee, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function QuickActions() {
  const actions = [
    {
      label: "Inflow",
      href: "/inflow",
      icon: ArrowDownToDot,
      color: "bg-green-100 text-green-700 hover:bg-green-200",
      description: "Receive Stock"
    },
    {
      label: "Outflow",
      href: "/outflow",
      icon: ArrowUpFromDot,
      color: "bg-red-100 text-red-700 hover:bg-red-200",
      description: "Dispatch Stock"
    },
    {
      label: "Payment",
      href: "/payments/pending",
      icon: IndianRupee,
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
      description: "Record Payment"
    },
    {
      label: "Customer",
      href: "/customers",
      icon: Users,
      color: "bg-purple-100 text-purple-700 hover:bg-purple-200",
      description: "Manage Clients"
    }
  ];

  return (
    <div className="flex flex-col space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
            <TooltipProvider>
            {actions.map((action) => (
                <Tooltip key={action.label}>
                    <TooltipTrigger asChild>
                        <Button 
                            key={action.label} 
                            variant="outline" 
                            className="h-24 w-24 flex-col gap-2 rounded-xl border-dashed border-2 hover:border-solid hover:shadow-md transition-all"
                            asChild
                        >
                            <Link href={action.href}>
                                <div className={`p-2 rounded-full ${action.color}`}>
                                    <action.icon className="h-6 w-6" />
                                </div>
                                <span className="font-medium text-xs">{action.label}</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{action.description}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
            </TooltipProvider>
        </div>
    </div>
  );
}
