"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppForm } from "@/components/form/form-context";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formQueryOptions } from "@/lib/client-utils";
import { getFormDefaults } from "@/lib/shared-utils";
import { useTRPC } from "@/trpc/client";
import { createPayrollPayScheduleSchema } from "../schemas/payroll.shared-schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
};

const payScheduleFrequencies = [
  { value: "Weekly", label: "Weekly" },
  { value: "Fortnightly", label: "Fortnightly" },
  { value: "Monthly", label: "Monthly" },
  { value: "AdHoc", label: "Ad hoc" },
] as const;

const employeeSelectionStrategies = [
  { value: "PayRunDefault", label: "Pay run default" },
  { value: "None", label: "None" },
  { value: "TimesheetLocations", label: "Timesheet locations" },
  {
    value: "PayRunDefaultWithTimesheets",
    label: "Pay run default with timesheets",
  },
  { value: "ActiveSubcontractors", label: "Active subcontractors" },
  { value: "EmployingEntity", label: "Employing entity" },
] as const;

type PayScheduleFormSource = {
  name?: string | null;
  frequency?:
    | (typeof payScheduleFrequencies)[number]["value"]
    | "Initial"
    | null;
  employeeSelectionStrategy?:
    | (typeof employeeSelectionStrategies)[number]["value"]
    | null;
  equalMonthlyPayments?: boolean | null;
};

function getFormValues(data?: PayScheduleFormSource | null) {
  return {
    name: data?.name ?? "",
    frequency:
      data?.frequency && data.frequency !== "Initial"
        ? data.frequency
        : "Weekly",
    employeeSelectionStrategy:
      data?.employeeSelectionStrategy ?? "PayRunDefault",
    equalMonthlyPayments: data?.equalMonthlyPayments ?? false,
  };
}

export function CreatePayrollPaySchedule({
  open,
  onOpenChange,
  itemId,
}: Props) {
  const isUpdate = !!itemId;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data } = useQuery(
    trpc.payroll.getPaySchedule.queryOptions(
      {
        id: Number(itemId),
      },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const createMutation = useMutation(
    trpc.payroll.createPaySchedule.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.payroll.listPaySchedules.queryOptions()
        );
        onOpenChange(false);
        toast.success("Pay schedule saved successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const updateMutation = useMutation(
    trpc.payroll.updatePaySchedule.mutationOptions({
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(
          trpc.payroll.listPaySchedules.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.payroll.getPaySchedule.queryOptions({
            id: variables.id,
          })
        );
        onOpenChange(false);
        toast.success("Pay schedule saved successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const form = useAppForm({
    defaultValues: getFormDefaults(
      createPayrollPayScheduleSchema,
      getFormValues(data)
    ),
    validators: {
      onChange: createPayrollPayScheduleSchema,
    },
    onSubmit: async ({ value }) => {
      const parsedValue = createPayrollPayScheduleSchema.parse(value);

      if (isUpdate && itemId) {
        await updateMutation.mutateAsync({
          id: Number(itemId),
          ...parsedValue,
        });
        return;
      }

      await createMutation.mutateAsync(parsedValue);
    },
  });

  useEffect(() => {
    form.reset(
      getFormDefaults(createPayrollPayScheduleSchema, getFormValues(data))
    );
  }, [data, form, open]);

  const isPending =
    form.state.isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isPending) {
          return;
        }

        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Pay schedules</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update an existing pay schedule."
              : "Create a new pay schedule."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.AppForm>
            <FieldGroup className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <form.AppField
                name="name"
                children={(field) => <field.TextField label="Name" />}
              />
              <form.AppField
                name="frequency"
                children={(field) => (
                  <field.SelectField
                    label="Frequency"
                    items={payScheduleFrequencies.map((frequency) => ({
                      value: frequency.value,
                      label: frequency.label,
                    }))}
                  />
                )}
              />
              <form.AppField
                name="employeeSelectionStrategy"
                children={(field) => (
                  <field.SelectField
                    label="Selection strategy"
                    items={employeeSelectionStrategies.map((strategy) => ({
                      value: strategy.value,
                      label: strategy.label,
                    }))}
                  />
                )}
              />
              <div className="flex items-end">
                <form.AppField
                  name="equalMonthlyPayments"
                  children={(field) => (
                    <field.CheckboxField label="Equal monthly payments" />
                  )}
                />
              </div>
            </FieldGroup>

            <DialogFooter>
              <Button disabled={isPending} type="submit">
                Save
              </Button>
            </DialogFooter>
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
