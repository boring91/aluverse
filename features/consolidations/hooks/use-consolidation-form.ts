import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppForm } from "@/components/form/form-context";
import { formQueryOptions } from "@/lib/client-utils";
import { getFormDefaults } from "@/lib/shared-utils";
import { useTRPC } from "@/trpc/client";
import { createConsolidationSchema } from "../schemas/consolidations.shared-schema";
import { z } from "zod";

type Props = {
  transactionId: string;
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SchemaType = z.infer<typeof createConsolidationSchema>;

export function useConsolidationForm({
  transactionId,
  itemId,
  open,
  onOpenChange,
}: Props) {
  const isUpdate = !!itemId;
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.consolidations.get.queryOptions(
      {
        id: itemId!,
      },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const { data: defaults } = useQuery(
    trpc.consolidations.getDefault.queryOptions(
      {
        transactionId,
      },
      {
        enabled: !isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const createMutation = useMutation(
    trpc.consolidations.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.consolidations.list.queryOptions({ transactionId })
        );
        queryClient.invalidateQueries(
          trpc.consolidations.statistics.queryOptions()
        );
        queryClient.invalidateQueries(trpc.transactions.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.consolidations.getDefault.queryOptions({ transactionId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.consolidations.get.queryOptions({ id: itemId })
          );
        }

        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    })
  );

  const updateMutation = useMutation(
    trpc.consolidations.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.consolidations.list.queryOptions({ transactionId })
        );
        queryClient.invalidateQueries(
          trpc.consolidations.statistics.queryOptions()
        );
        queryClient.invalidateQueries(trpc.transactions.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.consolidations.getDefault.queryOptions({ transactionId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.consolidations.get.queryOptions({ id: itemId })
          );
        }

        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    })
  );

  const mappedFormData = useMemo(() => {
    if (isUpdate) {
      if (!data) return undefined;
      return {
        description: data.description ?? "",
        amount: data.amount / 100,
        consolidationGroup: data.consolidationGroup,
        budgetCategory: data.budgetCategory ?? undefined,
        projectId: data.project?.id ?? undefined,
        projectStream: data.projectStream ?? undefined,
        projectItemId: data.projectItemId ?? undefined,
        isGst: data.isGst ?? true,
        loanId: data.loan?.id ?? undefined,
        isPayoff: data.isPayoff ?? false,
        loanPayoffId: data.loanPayoff?.id ?? undefined,
      };
    }

    if (!defaults) {
      return {
        description: "",
        amount: 0,
        isGst: true,
        isPayoff: false,
      };
    }

    return {
      description: defaults.description ?? "",
      amount: defaults.remainingAmount / 100,
      isGst: true,
      isPayoff: false,
    };
  }, [data, defaults, isUpdate]);

  const formDefaults = useMemo(
    () => getFormDefaults(createConsolidationSchema, mappedFormData),
    [mappedFormData]
  );

  const form = useAppForm({
    defaultValues: formDefaults,
    validators: {
      onChange: createConsolidationSchema,
    },
    onSubmit: async ({ value }) => {
      const payload = value as SchemaType;
      if (isUpdate && itemId) {
        await updateMutation.mutateAsync({ id: itemId, ...payload });
      } else {
        await createMutation.mutateAsync({ transactionId, ...payload });
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(formDefaults);
  }, [form, formDefaults, open]);

  const isPending =
    form.state.isSubmitting || (!isUpdate && !defaults) || (isUpdate && !data);

  return {
    form,
    isPending,
    isUpdate,
  };
}
