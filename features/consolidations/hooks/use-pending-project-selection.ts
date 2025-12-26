import { useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { createConsolidationSchema } from "../schemas/consolidation.schema";
import { z } from "zod";

type SchemaType = z.infer<typeof createConsolidationSchema>;

export const usePendingProjectSelection = (
    form: UseFormReturn<SchemaType>,
    projects: { id: string }[] | undefined,
    open: boolean
) => {
    const pendingProjectIdRef = useRef<string | null>(null);

    const handleProjectCreated = (projectId: string) => {
        pendingProjectIdRef.current = projectId;
    };

    useEffect(() => {
        if (
            pendingProjectIdRef.current &&
            projects?.some(
                project => project.id === pendingProjectIdRef.current
            )
        ) {
            form.setValue("projectId", pendingProjectIdRef.current);
            form.setValue("projectStream", undefined);
            form.setValue("projectItemId", undefined);
            pendingProjectIdRef.current = null;
        }
    }, [projects, form]);

    useEffect(() => {
        if (!open) pendingProjectIdRef.current = null;
    }, [open]);

    return handleProjectCreated;
};

