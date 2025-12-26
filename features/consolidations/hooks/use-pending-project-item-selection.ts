import { useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { createConsolidationSchema } from "../schemas/consolidation.schema";
import { z } from "zod";
import { useProjectItems } from "./use-project-items";

type SchemaType = z.infer<typeof createConsolidationSchema>;

export const usePendingProjectItemSelection = (
    form: UseFormReturn<SchemaType>,
    projectItems: ReturnType<typeof useProjectItems>,
    open: boolean,
    projectId?: string,
    projectStream?: SchemaType["projectStream"]
) => {
    const pendingItemIdRef = useRef<string | null>(null);

    const handleItemCreated = (itemId: string) => {
        // Store the pending item ID - we'll set it once it appears in the list
        pendingItemIdRef.current = itemId;
    };

    // Watch for when the newly created item appears in the list
    useEffect(() => {
        if (
            pendingItemIdRef.current &&
            projectItems?.some(item => item.id === pendingItemIdRef.current)
        ) {
            form.setValue("projectItemId", pendingItemIdRef.current);
            pendingItemIdRef.current = null;
        }
    }, [projectItems, form]);

    // Clear pending item ID when dialog closes or project/stream changes
    useEffect(() => {
        if (!open) {
            pendingItemIdRef.current = null;
        }
    }, [open]);

    useEffect(() => {
        pendingItemIdRef.current = null;
    }, [projectId, projectStream]);

    return handleItemCreated;
};

