"use client";

import { useEffect, useMemo, useState } from "react";
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
import { createPayrollEmployeeFormSchema } from "../schemas/payroll.shared-schema";

type PayrollEmployeeForm = z.infer<typeof createPayrollEmployeeFormSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreatePayrollEmployee({ open, onOpenChange }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedEmploymentType, setSelectedEmploymentType] =
    useState<PayrollEmployeeForm["employmentType"]>("FullTime");

  const { data: paySchedules } = useQuery(
    trpc.payroll.listPaySchedules.queryOptions(undefined, {
      enabled: open,
      ...formQueryOptions,
    })
  );

  const payScheduleItems = useMemo(() => {
    return (paySchedules ?? []).map((paySchedule) => ({
      value: paySchedule.id.toString(),
      label: paySchedule.frequency
        ? `${paySchedule.name} (${paySchedule.frequency})`
        : (paySchedule.name ?? `Schedule ${paySchedule.id}`),
    }));
  }, [paySchedules]);

  const form = useAppForm({
    defaultValues: getFormDefaults(createPayrollEmployeeFormSchema, {
      employmentType: "FullTime",
      startDate: new Date(),
    }),
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

      await createEmployeeMutation.mutateAsync({
        firstName: parsedValue.firstName,
        surname: parsedValue.surname,
        emailAddress: parsedValue.emailAddress,
        employmentType: parsedValue.employmentType,
        paySchedule: paySchedule.name,
        startDate: parsedValue.startDate,
        rate: parsedValue.rate,
        rateUnit: normalizedRateUnit,
      });
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      getFormDefaults(createPayrollEmployeeFormSchema, {
        employmentType: "FullTime",
        startDate: new Date(),
      })
    );
  }, [form, open]);

  const createEmployeeMutation = useMutation(
    trpc.payroll.createEmployee.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.payroll.listEmployees.queryOptions()
        );
        setSelectedEmploymentType("FullTime");
        onOpenChange(false);
        toast.success("Employee created successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const isPending =
    form.state.isSubmitting ||
    createEmployeeMutation.isPending ||
    !paySchedules;
  const hasPaySchedules = (paySchedules?.length ?? 0) > 0;
  const rateLabel =
    selectedEmploymentType === "Casual" ? "Hourly rate" : "Annual salary";

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (form.state.isSubmitting || createEmployeeMutation.isPending) {
          return;
        }

        if (!value) {
          setSelectedEmploymentType("FullTime");
        }

        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Payroll employees</DialogTitle>
          <DialogDescription>
            Create a payroll employee. TFN, bank details, and super details stay
            in Employment Hero through self-service onboarding.
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
                  <field.TextField label="Email" type="email" />
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
                    onChange={(value) => {
                      setSelectedEmploymentType(
                        value as PayrollEmployeeForm["employmentType"]
                      );
                    }}
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

            {!hasPaySchedules ? (
              <p className="text-muted-foreground text-sm">
                No pay schedules are configured yet. Create the weekly and
                monthly schedules in Employment Hero before adding employees.
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
