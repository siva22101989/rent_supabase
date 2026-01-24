'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteOutflow } from '@/lib/actions/storage/outflow';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteOutflowButton({ 
  transactionId, 
  bags, 
  rentCollected 
}: { 
  transactionId: string;
  bags: number;
  rentCollected: number;
}) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteOutflow(transactionId);
      if (result.success) {
        toast({
          title: "Outflow Reverted",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Revert withdrawal">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revert Withdrawal?</AlertDialogTitle>
          <AlertDialogDescription>
            This will undo the withdrawal of <strong>{bags} bags</strong> and add them back to stock.
            {rentCollected > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-xs font-medium">
                    Warning: A rent charge of <strong>{rentCollected}</strong> was billed. This will be reversed from the bill, 
                    but if you collected a payment, you must delete the payment record manually.
                </div>
            )}
            <br className="mt-2"/>
            Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Reverting..." : "Revert"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
