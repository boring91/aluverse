import { useMemo, useRef } from "react";
import { useStore } from "@tanstack/react-form";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/router";
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
import { useReconciliationForm } from "../hooks/use-reconciliation-form";
import {
  AmountField,
  BudgetCategoryField,
  ReconciliationGroupField,
  DescriptionField,
  IsGstField,
  LoanFields,
  ProjectFields,
  GstPaymentFields,
} from "./reconciliation-form-fields";
import type {
  LoanFieldsHandle,
  ProjectFieldsHandle,
  GstPaymentFieldsHandle,
  ReconciliationPrefillData,
} from "./reconciliation-form-fields";

type Transaction =
  inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

type Props = {
  transaction: Transaction;
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateReconciliation({
  transaction,
  itemId,
  open,
  onOpenChange,
}: Props) {
  const { form, isPending } = useReconciliationForm({
    transactionId: transaction.id,
    itemId,
    open,
    onOpenChange,
  });

  const selectedGroup = useStore(
    form.store,
    (state) => state.values.reconciliationGroup,
  );
  const reconciliationAmount = useStore(
    form.store,
    (state) => state.values.amount,
  );
  const reconciliationDescription = useStore(
    form.store,
    (state) => state.values.description,
  );

  const prefillData = useMemo<ReconciliationPrefillData>(
    () => ({
      date: transaction.date,
      amount: reconciliationAmount,
      description: reconciliationDescription ?? transaction.description,
    }),
    [
      transaction.date,
      transaction.description,
      reconciliationAmount,
      reconciliationDescription,
    ],
  );

  const projectFieldsRef = useRef<ProjectFieldsHandle>(null);
  const loanFieldsRef = useRef<LoanFieldsHandle>(null);
  const gstPaymentFieldsRef = useRef<GstPaymentFieldsHandle>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isPending) return;
        if (!value) {
          form.reset();
          projectFieldsRef.current?.closeAll();
          loanFieldsRef.current?.closeAll();
          gstPaymentFieldsRef.current?.closeAll();
        }
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reconcile transaction</DialogTitle>
          <DialogDescription>
            Assign this transaction to a reconciliation group and categorize it
            accordingly.
          </DialogDescription>
        </DialogHeader>

        <form
          id="reconcile-transaction-form"
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
                <ReconciliationGroupField form={form} />

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

                {selectedGroup === "gst_payable" && (
                  <GstPaymentFields
                    ref={gstPaymentFieldsRef}
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
            form="reconcile-transaction-form"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
