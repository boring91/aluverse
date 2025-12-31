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
import { createProjectSupplySchema } from "../schemas/project-items.schema";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type SchemaType = z.infer<typeof createProjectSupplySchema>;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    itemId: string | null;
    onItemCreated?: (itemId: string) => void;
};

export const CreateSupply = ({
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
        resolver: zodResolver(createProjectSupplySchema),
        defaultValues: {
            name: "",
            quantity: 0,
            unitPrice: 0,
        },
    });

    const queryClient = useQueryClient();
    const trpc = useTRPC();

    const { data } = useQuery(
        trpc.projectSupplies.get.queryOptions(
            { id: itemId! },
            {
                enabled: isUpdate,
            }
        )
    );

    const onSuccess = (data: { id: string }) => {
        queryClient.invalidateQueries(
            trpc.projectSupplies.list.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        queryClient.invalidateQueries(
            trpc.projects.get.queryOptions({ id: projectId })
        );
        if (isUpdate) {
            queryClient.invalidateQueries(
                trpc.projectSupplies.get.queryOptions({ id: itemId })
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
        trpc.projectSupplies.create.mutationOptions({ onSuccess, onError })
    );

    const updateMutation = useMutation(
        trpc.projectSupplies.update.mutationOptions({ onSuccess, onError })
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

        fillForm(form, { ...data, unitPrice: data.unitPrice / 100 });
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
                    <DialogTitle>{t("supplies")}</DialogTitle>
                    <DialogDescription>
                        {isUpdate
                            ? t("updateExistingSupply")
                            : t("createNewSupply")}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="create-supply-form"
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="flex flex-col gap-8 px-4 overflow-y-auto"
                >
                    <FieldGroup>
                        {/* Name */}
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

                        {/* Quantity */}
                        <Controller
                            control={form.control}
                            name="quantity"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{t("quantity")}</FieldLabel>
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

                        {/* Unit Price */}
                        <Controller
                            control={form.control}
                            name="unitPrice"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>
                                            {t("unitPrice")}
                                        </FieldLabel>
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
                        form="create-supply-form"
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
