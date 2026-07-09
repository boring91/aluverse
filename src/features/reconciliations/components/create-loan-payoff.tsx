import { forwardRef, useImperativeHandle, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc";
import { CreateLoanPayoff as BaseCreateLoanPayoff } from "@/features/loans/components/create-loan-payoff";

type LoanPayoffPrefillData = {
  date: string;
  amount: number;
  description: string;
};

export type CreateLoanPayoffHandle = {
  open: () => void;
  close: () => void;
};

type Props = {
  loanId: string;
  onPayoffCreated: (payoffId: string) => void;
  prefillData?: LoanPayoffPrefillData;
  canCreate: boolean;
};

export const CreateLoanPayoff = forwardRef<CreateLoanPayoffHandle, Props>(
  ({ loanId, onPayoffCreated, prefillData, canCreate }, ref) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    useImperativeHandle(ref, () => ({
      open: () => {
        if (canCreate) {
          setOpen(true);
        }
      },
      close: () => {
        setOpen(false);
      },
    }));

    const invalidateLoanPayoffs = () => {
      const queryInput = {
        loanId,
        pagination: { pageSize: -1, pageIndex: 0 },
      };
      queryClient.invalidateQueries(
        trpc.loanPayoffs.list.queryOptions(queryInput),
      );
    };

    const handleCreated = (payoffId: string) => {
      invalidateLoanPayoffs();
      onPayoffCreated(payoffId);
      setOpen(false);
    };

    return canCreate ? (
      <BaseCreateLoanPayoff
        open={open}
        onOpenChange={setOpen}
        loanId={loanId}
        itemId={null}
        onItemCreated={handleCreated}
        prefillData={
          prefillData
            ? {
                date: prefillData.date,
                amount: prefillData.amount,
                notes: prefillData.description,
              }
            : undefined
        }
      />
    ) : null;
  },
);

CreateLoanPayoff.displayName = "CreateLoanPayoff";
