
'use client';

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { StorageRecord } from "@/lib/definitions";
import { EditBillingDialog } from "@/components/billing/edit-billing-dialog";
import { DeleteBillingDialog } from "@/components/billing/delete-billing-dialog";

export function ActionsMenu({ record }: { record: StorageRecord }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <EditBillingDialog record={record}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditBillingDialog>
                <DeleteBillingDialog recordId={record.id}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                        Delete
                    </DropdownMenuItem>
                </DeleteBillingDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
