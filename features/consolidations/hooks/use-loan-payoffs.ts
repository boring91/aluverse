import { useQuery } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { createConsolidationSchema } from "../schemas/consolidation.schema";
import { z } from "zod";

type SchemaType = z.infer<typeof createConsolidationSchema>;

export const useLoanPayoffs = (form: UseFormReturn<SchemaType>) => {
    const trpc = useTRPC();

    const loanId = form.watch("loanId");

    const queryInput = {
        loanId: loanId!,
        pagination: { pageSize: -1, pageIndex: 0 },
    };

    const { data: payoffs } = useQuery(
        trpc.loanPayoffs.list.queryOptions(
            queryInput,
            {
                enabled: !!loanId,
            }
        )
    );

    return payoffs?.items;
};

