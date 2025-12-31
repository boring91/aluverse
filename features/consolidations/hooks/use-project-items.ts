import { useQuery } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { createConsolidationSchema } from "../schemas/consolidations.schema";
import { z } from "zod";

type SchemaType = z.infer<typeof createConsolidationSchema>;

type UnionOfArraysToArrayOfUnion<T> = T extends (infer U)[] ? U : never;

export const useProjectItems = (form: UseFormReturn<SchemaType>) => {
    const trpc = useTRPC();

    const projectId = form.watch("projectId");
    const stream = form.watch("projectStream");

    const queryInput = {
        projectId: projectId!,
        pagination: { pageSize: -1, pageIndex: 0 },
    };

    const makeOptions = (enabled: boolean) => ({
        enabled: !!projectId && enabled,
    });

    const { data: supplies } = useQuery(
        trpc.projectSupplies.list.queryOptions(
            queryInput,
            makeOptions(stream === "supplies")
        )
    );
    const { data: labors } = useQuery(
        trpc.projectLabors.list.queryOptions(
            queryInput,
            makeOptions(stream === "labors")
        )
    );
    const { data: misc } = useQuery(
        trpc.projectMisc.list.queryOptions(
            queryInput,
            makeOptions(stream === "misc")
        )
    );
    const { data: payments } = useQuery(
        trpc.projectPayments.list.queryOptions(
            queryInput,
            makeOptions(stream === "payments")
        )
    );

    const dataMap = { supplies, labors, misc, payments };

    const data = stream ? dataMap[stream]?.items : undefined;

    return data as UnionOfArraysToArrayOfUnion<typeof data>[] | undefined;
};
