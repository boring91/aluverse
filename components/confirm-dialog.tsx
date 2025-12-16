"use client";

import { useState } from "react";
import { isPromise } from "@/lib/utils";
import { useTranslations } from "next-intl";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

type Props = {
    title: string;
    description?: string;
    onConfirm: () => unknown | Promise<unknown>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};
export const ConfirmDialog = ({
    title,
    description,
    onConfirm,
    open,
    onOpenChange,
}: Props) => {
    const tc = useTranslations("Common");
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        const result = onConfirm();

        if (isPromise(result)) {
            setIsLoading(true);
            await result;
            setIsLoading(false);
        }

        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description && (
                        <AlertDialogDescription>
                            {description}
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction asChild>
                        <Button
                            disabled={isLoading}
                            onClick={() => handleConfirm()}
                        >
                            {tc("confirm")}
                        </Button>
                    </AlertDialogAction>
                    <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
