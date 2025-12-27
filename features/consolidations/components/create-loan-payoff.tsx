import { forwardRef, useImperativeHandle, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { CreateLoanPayoff as BaseCreateLoanPayoff } from "@/features/loans/components/create-loan-payoff";

export type CreateLoanPayoffHandle = {
    open: () => void;
    close: () => void;
};

type Props = {
    loanId: string;
    onPayoffCreated: (payoffId: string) => void;
};

export const CreateLoanPayoff = forwardRef<CreateLoanPayoffHandle, Props>(
    ({ loanId, onPayoffCreated }, ref) => {
        const [open, setOpen] = useState(false);
        const queryClient = useQueryClient();
        const trpc = useTRPC();

        useImperativeHandle(ref, () => ({
            open: () => {
                setOpen(true);
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
                trpc.loanPayoffs.list.queryOptions(queryInput)
            );
        };

        const handleCreated = (payoffId: string) => {
            invalidateLoanPayoffs();
            onPayoffCreated(payoffId);
            setOpen(false);
        };

        return (
            <BaseCreateLoanPayoff
                open={open}
                onOpenChange={setOpen}
                loanId={loanId}
                itemId={null}
                onItemCreated={handleCreated}
            />
        );
    }
);

CreateLoanPayoff.displayName = "CreateLoanPayoff";
