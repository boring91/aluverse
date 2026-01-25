import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { fillForm } from "@/lib/client-utils";
import { useTRPC } from "@/trpc/client";
import { createConsolidationSchema } from "../schemas/consolidations.schema";
import { useTranslations } from "next-intl";

type SchemaType = z.infer<typeof createConsolidationSchema>;

type Props = {
  transactionId: string;
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const useConsolidationForm = ({
  transactionId,
  itemId,
  open,
  onOpenChange,
}: Props) => {
  const tc = useTranslations("Common");

  const isUpdate = !!itemId;

  const form = useForm<SchemaType>({
    resolver: zodResolver(createConsolidationSchema),
    defaultValues: {
      description: "",
      amount: 0.0,
      budgetCategory: undefined,
      consolidationGroup: undefined,
      projectId: undefined,
      projectStream: undefined,
      projectItemId: undefined,
      isGst: true,
      loanId: undefined,
      isPayoff: false,
      loanPayoffId: undefined,
    },
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.consolidations.get.queryOptions(
      {
        id: itemId!,
      },
      {
        enabled: isUpdate,
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
      }
    )
  );

  const onSuccess = () => {
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
        trpc.consolidations.get.queryOptions({
          id: itemId,
        })
      );
    }

    form.reset();
    onOpenChange(false);
    toast.success(tc("savedSuccessfully"));
  };

  const onError = (error: { message: string }) => {
    toast.error(error.message);
  };

  const createMutation = useMutation(
    trpc.consolidations.create.mutationOptions({ onSuccess, onError })
  );
  const updateMutation = useMutation(
    trpc.consolidations.update.mutationOptions({ onSuccess, onError })
  );

  const handleSubmit = (data: SchemaType) => {
    if (isUpdate && itemId) {
      updateMutation.mutate({ id: itemId, ...data });
    } else {
      createMutation.mutate({ transactionId, ...data });
    }
  };

  useEffect(() => {
    if (!open) return;

    if (defaults && !isUpdate) {
      fillForm(form, {
        ...defaults,
        isGst: true,
        amount: defaults.remainingAmount / 100,
      });
      form.setFocus("consolidationGroup");
    } else if (data && isUpdate) {
      fillForm(form, {
        ...data,
        amount: data.amount / 100,
        isGst: data.isGst ?? true,
        projectId: data.project?.id,
        loanId: data.loan?.id,
        loanPayoffId: data.loanPayoff?.id,
        isPayoff: data.isPayoff ?? false,
      });
    }
  }, [open, data, defaults, form, isUpdate]);

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (!data && !defaults);

  return {
    form,
    handleSubmit,
    isPending,
    isUpdate,
  };
};
