import { useMemo, useRef } from "react";
import { useStore } from "@tanstack/react-form";
import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";
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
import { useConsolidationForm } from "../hooks/use-consolidation-form";
import {
  AmountField,
  BudgetCategoryField,
  ConsolidationGroupField,
  DescriptionField,
  IsGstField,
  LoanFields,
  LoanFieldsHandle,
  ProjectFields,
  ProjectFieldsHandle,
} from "./consolidation-form-fields";
import type { ConsolidationPrefillData } from "./consolidation-form-fields";

type Transaction =
  inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

type Props = {
  transaction: Transaction;
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateConsolidation({
  transaction,
  itemId,
  open,
  onOpenChange,
}: Props) {
  const { form, isPending } = useConsolidationForm({
    transactionId: transaction.id,
    itemId,
    open,
    onOpenChange,
  });

  const selectedGroup = useStore(
    form.store,
    (state) => state.values.consolidationGroup
  );
  const consolidationAmount = useStore(
    form.store,
    (state) => state.values.amount
  );
  const consolidationDescription = useStore(
    form.store,
    (state) => state.values.description
  );

  const prefillData = useMemo<ConsolidationPrefillData>(
    () => ({
      date: transaction.date,
      amount: consolidationAmount,
      description: consolidationDescription ?? transaction.description,
    }),
    [
      transaction.date,
      transaction.description,
      consolidationAmount,
      consolidationDescription,
    ]
  );

  const projectFieldsRef = useRef<ProjectFieldsHandle>(null);
  const loanFieldsRef = useRef<LoanFieldsHandle>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isPending) return;
        if (!value) {
          form.reset();
          projectFieldsRef.current?.closeAll();
          loanFieldsRef.current?.closeAll();
        }
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consolidate transaction</DialogTitle>
          <DialogDescription>
            Assign this transaction to a consolidation group and categorize it
            accordingly.
          </DialogDescription>
        </DialogHeader>

        <form
          id="consolidate-transaction-form"
          className="flex flex-col gap-8 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.AppForm>
            <fieldset disabled={isPending}>
              <FieldGroup>
                <DescriptionField form={form} />
                <AmountField form={form} />
                <ConsolidationGroupField form={form} />

                {selectedGroup === "budget" && (
                  <BudgetCategoryField form={form} />
                )}

                {selectedGroup === "project" && (
                  <ProjectFields
                    ref={projectFieldsRef}
                    form={form}
                    prefillData={prefillData}
                  />
                )}

                {selectedGroup === "loan" && (
                  <LoanFields
                    ref={loanFieldsRef}
                    form={form}
                    prefillData={prefillData}
                  />
                )}

                <IsGstField form={form} />
              </FieldGroup>
            </fieldset>
          </form.AppForm>
        </form>

        <DialogFooter>
          <Button
            disabled={isPending}
            type="submit"
            form="consolidate-transaction-form"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
