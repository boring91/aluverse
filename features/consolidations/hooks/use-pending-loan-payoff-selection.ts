import { useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { createConsolidationSchema } from "../schemas/consolidation.schema";
import { z } from "zod";
import { useLoanPayoffs } from "./use-loan-payoffs";

type SchemaType = z.infer<typeof createConsolidationSchema>;

export const usePendingLoanPayoffSelection = (
    form: UseFormReturn<SchemaType>,
    loanPayoffs: ReturnType<typeof useLoanPayoffs>,
    open: boolean,
    loanId?: string
) => {
    const pendingPayoffIdRef = useRef<string | null>(null);

    const handlePayoffCreated = (payoffId: string) => {
        pendingPayoffIdRef.current = payoffId;
    };

    useEffect(() => {
        if (
            pendingPayoffIdRef.current &&
            loanPayoffs?.some(payoff => payoff.id === pendingPayoffIdRef.current)
        ) {
            form.setValue("loanPayoffId", pendingPayoffIdRef.current);
            pendingPayoffIdRef.current = null;
        }
    }, [loanPayoffs, form]);

    useEffect(() => {
        if (!open) {
            pendingPayoffIdRef.current = null;
        }
    }, [open]);

    useEffect(() => {
        pendingPayoffIdRef.current = null;
    }, [loanId]);

    return handlePayoffCreated;
};

