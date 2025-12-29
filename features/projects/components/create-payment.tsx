import { DatePickerInput } from "@/components/date-picker-input";
import { Button } from "@/components/ui/button";
import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { fillForm } from "@/lib/client-utils";
import { createProjectPaymentSchema } from "../schemas/project-item.schema";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type SchemaType = z.infer<typeof createProjectPaymentSchema>;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    itemId: string | null;
    onItemCreated?: (itemId: string) => void;
};

export const CreatePayment = ({
    open,
    onOpenChange,
    projectId,
    itemId,
    onItemCreated,
}: Props) => {
    const t = useTranslations("Projects");
    const tc = useTranslations("Common");

    const isUpdate = !!itemId;

    const form = useForm({
        resolver: zodResolver(createProjectPaymentSchema),
        defaultValues: {
            amount: 0,
        },
    });

    const queryClient = useQueryClient();
    const trpc = useTRPC();

    const { data } = useQuery(
        trpc.projectPayments.get.queryOptions(
            { id: itemId! },
            {
                enabled: isUpdate,
            }
        )
    );

    const onSuccess = (data: { id: string }) => {
        queryClient.invalidateQueries(
            trpc.projectPayments.list.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        queryClient.invalidateQueries(
            trpc.projects.get.queryOptions({ id: projectId })
        );
        if (isUpdate) {
            queryClient.invalidateQueries(
                trpc.projectPayments.get.queryOptions({ id: itemId })
            );
        } else {
            // Call onItemCreated callback with the newly created item ID
            const createdItem = data;
            if (createdItem && onItemCreated) {
                onItemCreated(createdItem.id);
            }
        }
        form.reset();
        onOpenChange(false);
        toast.success(tc("savedSuccessfully"));
    };

    const onError = (error: { message: string }) => {
        toast.error(error.message);
    };

    const createMutation = useMutation(
        trpc.projectPayments.create.mutationOptions({ onSuccess, onError })
    );

    const updateMutation = useMutation(
        trpc.projectPayments.update.mutationOptions({ onSuccess, onError })
    );

    const handleSubmit = (data: SchemaType) => {
        if (isUpdate && itemId) {
            updateMutation.mutate({ id: itemId, ...data });
        } else {
            createMutation.mutate({ projectId, ...data });
        }
    };

    useEffect(() => {
        if (!data || !isUpdate) return;

        fillForm(form, { ...data, amount: data.amount / 100 });
    }, [data, form, isUpdate]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog
            open={open}
            onOpenChange={value => {
                if (isPending) return;
                if (!value) form.reset();
                onOpenChange(value);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("payments")}</DialogTitle>
                    <DialogDescription>
                        {isUpdate
                            ? t("updateExistingPayment")
                            : t("createNewPayment")}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="create-payment-form"
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="flex flex-col gap-8 px-4 overflow-y-auto"
                >
                    <FieldGroup>
                        {/* Date */}
                        <Controller
                            control={form.control}
                            name="date"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{tc("date")}</FieldLabel>
                                        <DatePickerInput {...field} />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                );
                            }}
                        />

                        {/* Amount */}
                        <Controller
                            control={form.control}
                            name="amount"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{t("amount")}</FieldLabel>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={v =>
                                                field.onChange(
                                                    v.target.value
                                                        ? parseFloat(
                                                              v.target.value
                                                          )
                                                        : ""
                                                )
                                            }
                                        />
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

                <DialogFooter>
                    <Button
                        disabled={isPending}
                        type="submit"
                        form="create-payment-form"
                    >
                        {(createMutation.isPending ||
                            updateMutation.isPending) && (
                            <Loader2 className="animate-spin" />
                        )}
                        {tc("save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
