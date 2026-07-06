import type { z } from "zod";
import { useEffect, useMemo } from "react";
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
import { useTRPC } from "@/trpc";
import { createPayrollPayRunFormSchema } from "../schemas/payroll.shared-schema";

type PayrollPayRunForm = z.infer<typeof createPayrollPayRunFormSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activePayScheduleId: number | null;
};

function getFormValues(
  payScheduleId: number | null,
  fallbackPayScheduleId: string | undefined,
) {
  return {
    payScheduleId: payScheduleId?.toString() ?? fallbackPayScheduleId ?? "",
    periodEndingDate: new Date(),
  } satisfies PayrollPayRunForm;
}

export function CreatePayrollPayRun({
  open,
  onOpenChange,
  activePayScheduleId,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: paySchedules } = useQuery(
    trpc.payroll.listPaySchedules.queryOptions(undefined, {
      enabled: open,
      ...formQueryOptions,
    }),
  );

  const payScheduleItems = useMemo(() => {
    return (paySchedules ?? []).map((paySchedule) => ({
      value: paySchedule.id.toString(),
      label: paySchedule.frequency
        ? `${paySchedule.name} (${paySchedule.frequency})`
        : (paySchedule.name ?? `Schedule ${paySchedule.id}`),
    }));
  }, [paySchedules]);

  const createAction = useMutation(
    trpc.payroll.createPayRun.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(
            trpc.payroll.listPayRuns.queryOptions({}),
          ),
          queryClient.invalidateQueries(
            trpc.payroll.listPayRuns.queryOptions({
              payScheduleId: activePayScheduleId ?? undefined,
            }),
          ),
        ]);
        onOpenChange(false);
        toast.success("Pay run created successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useAppForm({
    defaultValues: getFormDefaults(
      createPayrollPayRunFormSchema,
      getFormValues(activePayScheduleId, payScheduleItems[0]?.value),
    ),
    validators: {
      onChange: createPayrollPayRunFormSchema,
    },
    onSubmit: async ({ value }) => {
      const parsedValue = createPayrollPayRunFormSchema.parse(value);

      await createAction.mutateAsync({
        payScheduleId: Number(parsedValue.payScheduleId),
        periodEndingDate: parsedValue.periodEndingDate,
      });
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      getFormDefaults(
        createPayrollPayRunFormSchema,
        getFormValues(activePayScheduleId, payScheduleItems[0]?.value),
      ),
    );
  }, [activePayScheduleId, form, open, payScheduleItems]);

  const hasPaySchedules = (paySchedules?.length ?? 0) > 0;
  const isPending =
    form.state.isSubmitting || createAction.isPending || !paySchedules;

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
          <DialogTitle>New pay run</DialogTitle>
          <DialogDescription>
            Create a draft pay run. The paid date defaults to the period ending
            date.
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
              <form.AppField
                name="periodEndingDate"
                children={(field) => (
                  <field.DatePickerField label="Period ending date" />
                )}
              />
            </FieldGroup>

            {!hasPaySchedules ? (
              <p className="text-muted-foreground text-sm">
                No pay schedules are configured yet. Create the weekly and
                monthly schedules before creating pay runs.
              </p>
            ) : null}

            <DialogFooter>
              <Button disabled={isPending || !hasPaySchedules} type="submit">
                Create pay run
              </Button>
            </DialogFooter>
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
