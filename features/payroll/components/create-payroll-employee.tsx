"use client";

import { useEffect, useMemo } from "react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
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
import { employmentTypeLabels, employmentTypes } from "@/lib/constants";
import { getFormDefaults } from "@/lib/shared-utils";
import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { createPayrollEmployeeFormSchema } from "../schemas/payroll.shared-schema";

type PayrollEmployeeForm = z.infer<typeof createPayrollEmployeeFormSchema>;

type PayrollEmployee = inferRouterOutputs<AppRouter>["payroll"]["getEmployee"];

type PayrollPaySchedule =
  inferRouterOutputs<AppRouter>["payroll"]["listPaySchedules"][number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
};

function getFormValues(
  employee: PayrollEmployee | undefined,
  paySchedules: PayrollPaySchedule[] | undefined
): Partial<PayrollEmployeeForm> {
  if (!employee) {
    return {
      employmentType: "FullTime",
      startDate: new Date(),
    };
  }

  const paySchedule = paySchedules?.find(
    (item) => item.name === employee.paySchedule
  );

  return {
    firstName: employee.firstName ?? "",
    surname: employee.surname ?? "",
    emailAddress: employee.emailAddress ?? "",
    employmentType: employee.employmentType ?? "FullTime",
    payScheduleId: paySchedule?.id.toString() ?? "",
    startDate: employee.startDate ? new Date(employee.startDate) : new Date(),
    rate: employee.rateInCents != null ? employee.rateInCents / 100 : undefined,
  };
}

export function CreatePayrollEmployee({ open, onOpenChange, itemId }: Props) {
  const isUpdate = !!itemId;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: paySchedules } = useQuery(
    trpc.payroll.listPaySchedules.queryOptions(undefined, {
      enabled: open,
      ...formQueryOptions,
    })
  );

  const { data: employee } = useQuery(
    trpc.payroll.getEmployee.queryOptions(
      { id: Number(itemId) },
      {
        enabled: open && isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const payScheduleItems = useMemo(() => {
    return (paySchedules ?? []).map((paySchedule) => ({
      value: paySchedule.id.toString(),
      label: paySchedule.frequency
        ? `${paySchedule.name} (${paySchedule.frequency})`
        : (paySchedule.name ?? `Schedule ${paySchedule.id}`),
    }));
  }, [paySchedules]);

  const createEmployeeMutation = useMutation(
    trpc.payroll.createEmployee.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.payroll.listEmployees.queryOptions()
        );
        onOpenChange(false);
        toast.success("Employee created successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const updateEmployeeMutation = useMutation(
    trpc.payroll.updateEmployee.mutationOptions({
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(
          trpc.payroll.listEmployees.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.payroll.getEmployee.queryOptions({ id: variables.id })
        );
        onOpenChange(false);
        toast.success("Employee updated successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const form = useAppForm({
    defaultValues: getFormDefaults(
      createPayrollEmployeeFormSchema,
      getFormValues(employee, paySchedules)
    ),
    validators: {
      onChange: createPayrollEmployeeFormSchema,
    },
    onSubmit: async ({ value }) => {
      const parsedValue = createPayrollEmployeeFormSchema.parse(value);
      const paySchedule = paySchedules?.find(
        (item) => item.id.toString() === parsedValue.payScheduleId
      );

      if (!paySchedule?.name) {
        throw new Error("Please choose a valid pay schedule.");
      }

      const normalizedRateUnit =
        parsedValue.employmentType === "Casual" ? "Hourly" : "Annually";

      const payload = {
        firstName: parsedValue.firstName,
        surname: parsedValue.surname,
        emailAddress: parsedValue.emailAddress,
        employmentType: parsedValue.employmentType,
        paySchedule: paySchedule.name,
        startDate: parsedValue.startDate,
        rate: parsedValue.rate,
        rateUnit: normalizedRateUnit,
      };

      if (isUpdate && itemId) {
        await updateEmployeeMutation.mutateAsync({
          id: Number(itemId),
          ...payload,
        });
        return;
      }

      await createEmployeeMutation.mutateAsync(payload);
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      getFormDefaults(
        createPayrollEmployeeFormSchema,
        getFormValues(employee, paySchedules)
      )
    );
  }, [employee, form, open, paySchedules]);

  const selectedEmploymentType = useStore(
    form.store,
    (state) => state.values.employmentType
  );

  const isPending =
    form.state.isSubmitting ||
    createEmployeeMutation.isPending ||
    updateEmployeeMutation.isPending ||
    !paySchedules ||
    (isUpdate && !employee);
  const hasPaySchedules = (paySchedules?.length ?? 0) > 0;
  const rateLabel =
    selectedEmploymentType === "Casual" ? "Hourly rate" : "Annual salary";

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
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Payroll employees</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update this payroll employee."
              : "Create a payroll employee."}
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
                name="firstName"
                children={(field) => <field.TextField label="First name" />}
              />
              <form.AppField
                name="surname"
                children={(field) => <field.TextField label="Last name" />}
              />
              <form.AppField
                name="emailAddress"
                children={(field) => (
                  <field.TextField label="Email (optional)" type="email" />
                )}
              />
              <form.AppField
                name="startDate"
                children={(field) => (
                  <field.DatePickerField label="Start date" />
                )}
              />
              <form.AppField
                name="employmentType"
                children={(field) => (
                  <field.SelectField
                    label="Employment type"
                    items={employmentTypes.map((type) => ({
                      value: type,
                      label: employmentTypeLabels[type],
                    }))}
                  />
                )}
              />
              <form.AppField
                name="payScheduleId"
                children={(field) => (
                  <field.SelectField
                    label="Pay schedule"
                    items={payScheduleItems}
                    placeholder={
                      hasPaySchedules
                        ? "Select a pay schedule"
                        : "No pay schedules found"
                    }
                  />
                )}
              />
              <div className="md:col-span-2">
                <form.AppField
                  name="rate"
                  children={(field) => <field.NumberField label={rateLabel} />}
                />
              </div>
            </FieldGroup>

            {paySchedules && !hasPaySchedules ? (
              <p className="text-muted-foreground text-sm">
                No pay schedules are configured yet. Create the weekly and
                monthly schedules before adding employees.
              </p>
            ) : null}

            <DialogFooter>
              <Button disabled={isPending || !hasPaySchedules} type="submit">
                Save
              </Button>
            </DialogFooter>
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
