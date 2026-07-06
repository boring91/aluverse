import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DataTable, useDataTable } from "@/components/data-table";
import { useConfirm } from "@/lib/confirm-context";
import { useTRPC } from "@/trpc";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { usePayrollPaySchedulesColumns } from "../hooks/use-payroll-pay-schedules-columns";
import { CreatePayrollPaySchedule } from "./create-payroll-pay-schedule";

const expectedScheduleFrequencies = ["Weekly", "Monthly"] as const;

export function PayrollPaySchedulesList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { hasPermission } = useRbacAccess();
  const canWrite = hasPermission("payroll.write");
  const dataTable = useDataTable({
    pageSize: 20,
  });
  const [itemId, setItemId] = useQueryState("itemId", parseAsString);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set(),
  );

  const { data: paySchedules } = useQuery(
    trpc.payroll.listPaySchedules.queryOptions(),
  );

  const deleteAction = useMutation(
    trpc.payroll.deletePaySchedule.mutationOptions({
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(
          trpc.payroll.listPaySchedules.queryOptions(),
        );
        queryClient.invalidateQueries(
          trpc.payroll.getPaySchedule.queryOptions({
            id,
          }),
        );
        setCurrentlyProcessing((current) => {
          const next = new Set(current);
          next.delete(id.toString());
          return next;
        });
        toast.success("Pay schedule deleted successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
      onSettled: (_, __, { id }) => {
        setCurrentlyProcessing((current) => {
          const next = new Set(current);
          next.delete(id.toString());
          return next;
        });
      },
    }),
  );

  const frequencies = new Set(
    (paySchedules ?? []).map((schedule) => schedule.frequency).filter(Boolean),
  );
  const missingFrequencies = paySchedules
    ? expectedScheduleFrequencies.filter(
        (frequency) => !frequencies.has(frequency),
      )
    : [];
  const columns = usePayrollPaySchedulesColumns(
    canWrite
      ? (targetItemId) => {
          setItemId(targetItemId);
        }
      : undefined,
    canWrite
      ? (targetItemId) => {
          confirm({
            title: "Delete",
            description: "Are you sure you want to delete this pay schedule?",
            onConfirm: () => {
              setCurrentlyProcessing((current) =>
                new Set(current).add(targetItemId),
              );
              deleteAction.mutate({
                id: Number(targetItemId),
              });
            },
          });
        }
      : undefined,
    currentlyProcessing,
  );

  const data = paySchedules
    ? {
        items: paySchedules,
        count: paySchedules.length,
        filteredCount: paySchedules.length,
      }
    : undefined;

  return (
    <>
      {canWrite ? (
        <CreatePayrollPaySchedule
          open={dataTable.openCreateSheet || !!itemId}
          onOpenChange={(value) => {
            if (value) {
              dataTable.setOpenCreateSheet(true);
              return;
            }

            setItemId(null);
            dataTable.setOpenCreateSheet(false);
          }}
          itemId={itemId}
        />
      ) : null}

      <div className="flex flex-col gap-4">
        {missingFrequencies.length ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Expected schedules are missing</AlertTitle>
            <AlertDescription>
              You currently have {paySchedules?.length ?? 0} pay schedule
              {(paySchedules?.length ?? 0) === 1 ? "" : "s"} configured.
              Missing: {missingFrequencies.join(", ")}.
            </AlertDescription>
          </Alert>
        ) : null}

        <DataTable
          columns={columns}
          data={data}
          pagination={dataTable.pagination}
          setPagination={dataTable.setPagination}
          setOpenCreateSheet={
            canWrite ? dataTable.setOpenCreateSheet : undefined
          }
        />
      </div>
    </>
  );
}
