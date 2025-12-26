import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConsolidationForm } from "../hooks/use-consolidation-form";
import {
    DescriptionField,
    AmountField,
    ConsolidationGroupField,
    BudgetCategoryField,
    ProjectFields,
    IsGstField,
    ProjectFieldsHandle,
} from "./consolidation-form-fields";
import { useRef } from "react";

type Props = {
    transactionId: string;
    itemId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const CreateConsolidation = ({
    transactionId,
    itemId,
    open,
    onOpenChange,
}: Props) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");

    const { form, handleSubmit, isPending } = useConsolidationForm({
        transactionId,
        itemId,
        open,
        onOpenChange,
    });

    const selectedGroup = form.watch("consolidationGroup");

    const projectFieldsRef = useRef<ProjectFieldsHandle>(null);

    return (
        <Dialog
            open={open}
            onOpenChange={value => {
                if (isPending) return;
                if (!value) {
                    form.reset();
                    projectFieldsRef.current?.closeAll();
                }
                onOpenChange(value);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("consolidateTransaction")}</DialogTitle>
                    <DialogDescription>
                        {t("consolidateTransactionDetails")}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="consolidate-transaction-form"
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="flex flex-col gap-8 px-4"
                >
                    <fieldset disabled={isPending}>
                        <FieldGroup>
                            <DescriptionField control={form.control} />

                            <AmountField control={form.control} />

                            <ConsolidationGroupField
                                control={form.control}
                                form={form}
                            />

                            {selectedGroup === "budget" && (
                                <BudgetCategoryField control={form.control} />
                            )}

                            {selectedGroup === "project" && (
                                <ProjectFields
                                    ref={projectFieldsRef}
                                    control={form.control}
                                    form={form}
                                    createConsolidationOpen={open}
                                />
                            )}

                            <IsGstField control={form.control} />
                        </FieldGroup>
                    </fieldset>
                </form>

                <DialogFooter>
                    <Button
                        disabled={isPending}
                        type="submit"
                        form="consolidate-transaction-form"
                    >
                        {isPending && <Loader2 className="animate-spin" />}
                        <span>{tc("save")}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
