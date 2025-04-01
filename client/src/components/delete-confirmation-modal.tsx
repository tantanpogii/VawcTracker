import { Case } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  caseToDelete: Case | null | undefined;
  isPending: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  caseToDelete,
  isPending
}: DeleteConfirmationModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-4 text-destructive">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <AlertDialogTitle className="text-center text-destructive">Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Are you sure you want to delete this case? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {caseToDelete && (
          <div className="py-2 text-center">
            <p className="font-semibold mb-1">Case: {caseToDelete.victimName}</p>
            <p className="text-sm text-muted-foreground">
              Case ID: #{caseToDelete.id.toString().padStart(3, '0')}
            </p>
          </div>
        )}
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-destructive hover:bg-destructive/90"
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete Permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
