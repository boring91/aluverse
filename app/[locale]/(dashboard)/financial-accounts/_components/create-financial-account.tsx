"use client";

import { Button } from "@/components/ui/button";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
    id: z.string(),
    name: z.string().min(3),
});

type SchemaType = z.infer<typeof schema>;

type Props = {
    open: boolean;
    onOpenChange: (isOpen: boolean) => void;
    itemId?: string;
};

export const CreateFinancialAccount = ({
    open,
    onOpenChange,
    itemId,
}: Props) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");

    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const isUpdate = !!itemId;

    const { data } = useQuery(
        trpc.financialAccounts.get.queryOptions(
            { id: itemId! },
            { enabled: isUpdate }
        )
    );

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            id: "",
            name: "",
        },
    });

    type CreateMutationOptions = Parameters<
        typeof trpc.financialAccounts.create.mutationOptions
    >[number];

    const mutationOptions = useMemo<CreateMutationOptions>(() => {
        return {
            onSuccess: () => {
                queryClient.invalidateQueries(
                    trpc.financialAccounts.list.queryOptions()
                );
                if (isUpdate) {
                    queryClient.invalidateQueries(
                        trpc.financialAccounts.get.queryOptions({ id: itemId })
                    );
                }
                form.reset();
                onOpenChange(false);
                toast.success(tc("savedSuccessfully"));
            },
            onError: e => {
                toast.error(e.message);
            },
        } as const;
    }, [queryClient, trpc, isUpdate, itemId, form, onOpenChange, tc]);

    trpc.financialAccounts.update.mutationOptions(mutationOptions);

    const mutation = useMutation(
        isUpdate
            ? trpc.financialAccounts.update.mutationOptions(mutationOptions)
            : trpc.financialAccounts.create.mutationOptions(mutationOptions)
    );

    const handleSubmit = (data: SchemaType) => {
        mutation.mutate(data);
    };

    useEffect(() => {
        if (!isUpdate || !data) return;
        form.reset({
            id: data.id,
            name: data.name,
        });
    }, [isUpdate, data, form]);

    return (
        <Sheet
            open={open}
            onOpenChange={value => {
                if (mutation.isPending) return;
                onOpenChange(value);
            }}
        >
            <SheetContent>
                <SheetHeader>
                    <SheetTitle className="font-bold text-xl">
                        {t("createNewFinancialAccount")}
                    </SheetTitle>
                </SheetHeader>

                <form
                    id="create-financial-account"
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="flex flex-col gap-8 px-4"
                >
                    <FieldGroup>
                        <Controller
                            control={form.control}
                            name="name"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{tc("name")}</FieldLabel>
                                        <Input {...field} />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                );
                            }}
                        />
                    </FieldGroup>
                </form>
                <SheetFooter>
                    <Button
                        form="create-financial-account"
                        disabled={mutation.isPending}
                        type="submit"
                    >
                        {mutation.isPending && (
                            <Loader2 className="animate-spin" />
                        )}
                        <span>{tc("save")}</span>
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
