'use client';

import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import type { Customer, StorageRecord } from "@/lib/definitions";
import { EditStorageDialog } from "./edit-storage-dialog";

export function ActionsMenu({ record, customers }: { record: StorageRecord, customers: Customer[] }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <EditStorageDialog record={record} customers={customers}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditStorageDialog>
                {/* We can add a delete option here in the future if needed */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
