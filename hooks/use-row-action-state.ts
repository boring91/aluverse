import { useState } from "react";

export const useRowActionState = () => {
    const [currentlyUpdatingItemId, setCurrentlyUpdatingItemId] = useState<
        string | undefined
    >(undefined);
    const [currentlyDeletingItemId, setCurrentlyDeletingItemId] = useState<
        string | undefined
    >(undefined);
    const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
        new Set()
    );

    return {
        currentlyUpdatingItemId,
        setCurrentlyUpdatingItemId,
        currentlyDeletingItemId,
        setCurrentlyDeletingItemId,
        currentlyProcessing,
        setCurrentlyProcessing,
    };
};
