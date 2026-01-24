
'use client';

import { useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteStorageRecordAction, restoreStorageRecordAction } from '@/lib/actions/storage/records';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { ToastAction } from '@/components/ui/toast';

export function DeleteRecordDialog({
  recordId,
  children,
}: {
  recordId: string;
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRestore = async () => {
      const result = await restoreStorageRecordAction(recordId);
      if (result.success) {
          toast({ title: "Restored", description: "Record restored successfully.", variant: "default" });
      } else {
          toast({ title: "Error", description: "Failed to restore record.", variant: "destructive" });
      }
  };

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteStorageRecordAction(recordId);
      if (result.success) {
        setIsOpen(false);
        toast({ 
            title: 'Moved to Trash', 
            description: "The record has been deleted.",
            action: (
                <ToastAction altText="Undo" onClick={handleRestore}>Undo</ToastAction>
            )
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the record from the active list. You can undo this action immediately after.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
