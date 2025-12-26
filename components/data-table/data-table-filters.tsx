"use client";

import { ReactNode } from "react";
import { Button } from "../ui/button";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
    children: ReactNode;
    onReset?: () => void;
    hasActiveFilters?: boolean;
};

export const DataTableFilters = ({
    children,
    onReset,
    hasActiveFilters,
}: Props) => {
    const tc = useTranslations("Common");

    return (
        <div className="flex flex-wrap items-end gap-3">
            {children}
            {hasActiveFilters && onReset && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="h-9"
                >
                    <XIcon className="size-4" />
                    {tc("resetFilters")}
                </Button>
            )}
        </div>
    );
};

