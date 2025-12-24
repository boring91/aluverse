"use client";

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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { fillForm } from "@/lib/client-utils";
import { createProjectSchema } from "@/lib/trpc-schemas";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type SchemaType = z.infer<typeof createProjectSchema>;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemId: string | null;
};

export const CreateProject = ({ open, onOpenChange, itemId }: Props) => {
    const t = useTranslations("Projects");
    const tc = useTranslations("Common");

    const isUpdate = !!itemId;

    const form = useForm<SchemaType>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            client: "",
            title: "",
            address: "",
            meters: 0,
            price: 0,
        },
    });

    const queryClient = useQueryClient();
    const trpc = useTRPC();

    const { data } = useQuery(
        trpc.projects.get.queryOptions(
            { id: itemId! },
            {
                enabled: isUpdate,
            }
        )
    );

    const onSuccess = () => {
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        if (isUpdate) {
            queryClient.invalidateQueries(
                trpc.projects.get.queryOptions({ id: itemId })
            );
        }
        form.reset();
        onOpenChange(false);
        toast.success(tc("savedSuccessfully"));
    };

    const onError = (error: { message: string }) => {
        toast.error(error.message);
    };

    const createMutation = useMutation(
        trpc.projects.create.mutationOptions({ onSuccess, onError })
    );

    const updateMutation = useMutation(
        trpc.projects.update.mutationOptions({ onSuccess, onError })
    );

    const handleSubmit = (data: SchemaType) => {
        if (isUpdate && itemId) {
            updateMutation.mutate({ id: itemId, ...data });
        } else {
            createMutation.mutate(data);
        }
    };

    useEffect(() => {
        if (!data || !isUpdate) return;

        fillForm(form, { ...data, price: data.price / 100 });
    }, [data, form, isUpdate]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog
            open={open}
            onOpenChange={value => {
                if (isPending) return;
                if (!value) {
                    form.reset();
                }
                onOpenChange(value);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("projects")}</DialogTitle>
                    <DialogDescription>
                        {isUpdate
                            ? t("updateExistingProject")
                            : t("createNewProject")}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="create-project-form"
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="flex flex-col gap-8 px-4 overflow-y-auto"
                >
                    <FieldGroup>
                        {/* Client */}
                        <Controller
                            control={form.control}
                            name="client"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{t("client")}</FieldLabel>
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

                        {/* Title */}
                        <Controller
                            control={form.control}
                            name="title"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{t("title")}</FieldLabel>
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

                        {/* Visit Date */}
                        <Controller
                            control={form.control}
                            name="visitDate"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>
                                            {t("visitDate")}
                                        </FieldLabel>
                                        <DatePickerInput
                                            value={field.value ?? undefined}
                                            onChange={field.onChange}
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

                        {/* Start Date */}
                        <Controller
                            control={form.control}
                            name="startDate"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>
                                            {t("startDate")}
                                        </FieldLabel>
                                        <DatePickerInput
                                            value={field.value ?? undefined}
                                            onChange={field.onChange}
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

                        {/* End Date */}
                        <Controller
                            control={form.control}
                            name="endDate"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{t("endDate")}</FieldLabel>
                                        <DatePickerInput
                                            value={field.value ?? undefined}
                                            onChange={field.onChange}
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

                        {/* Address */}
                        <Controller
                            control={form.control}
                            name="address"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{t("address")}</FieldLabel>
                                        <Input
                                            {...field}
                                            value={field.value ?? undefined}
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

                        {/* Meters */}
                        <Controller
                            control={form.control}
                            name="meters"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{t("meters")}</FieldLabel>
                                        <Input
                                            type="number"
                                            {...field}
                                            value={field.value ?? undefined}
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

                        {/* Price */}
                        <Controller
                            control={form.control}
                            name="price"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{t("price")}</FieldLabel>
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
                        form="create-project-form"
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
