import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { fillForm } from "@/lib/client-utils";
import { createLoanPayoffSchema } from "../schemas/loan-payoffs.schema";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { NumberInput } from "@/components/form/number-input";
import { DateInput } from "@/components/form/date-input";
import { TextareaInput } from "@/components/form/textarea-input";

type SchemaType = z.infer<typeof createLoanPayoffSchema>;

type PrefillData = {
  date: Date;
  amount: number;
  notes: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  itemId: string | null;
  onItemCreated?: (itemId: string) => void;
  prefillData?: PrefillData;
};

export const CreateLoanPayoff = ({
  open,
  onOpenChange,
  loanId,
  itemId,
  onItemCreated,
  prefillData,
}: Props) => {
  const t = useTranslations("Loans");
  const tc = useTranslations("Common");

  const isUpdate = !!itemId;

  const form = useForm({
    resolver: zodResolver(createLoanPayoffSchema),
    defaultValues: {
      amount: 0,
      notes: "",
    },
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.loanPayoffs.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
      }
    )
  );

  const onSuccess = (data: { id: string }) => {
    queryClient.invalidateQueries(
      trpc.loanPayoffs.list.queryOptions({ loanId })
    );
    queryClient.invalidateQueries(trpc.loans.list.queryOptions({}));
    queryClient.invalidateQueries(trpc.loans.get.queryOptions({ id: loanId }));
    if (isUpdate) {
      queryClient.invalidateQueries(
        trpc.loanPayoffs.get.queryOptions({ id: itemId })
      );
    } else {
      const createdItem = data;
      if (createdItem && onItemCreated) {
        onItemCreated(createdItem.id);
      }
    }
    form.reset();
    onOpenChange(false);
    toast.success(tc("savedSuccessfully"));
  };

  const onError = (error: { message: string }) => {
    toast.error(error.message);
  };

  const createMutation = useMutation(
    trpc.loanPayoffs.create.mutationOptions({ onSuccess, onError })
  );

  const updateMutation = useMutation(
    trpc.loanPayoffs.update.mutationOptions({ onSuccess, onError })
  );

  const handleSubmit = (data: SchemaType) => {
    if (isUpdate && itemId) {
      updateMutation.mutate({ id: itemId, ...data });
    } else {
      createMutation.mutate({ loanId, ...data });
    }
  };

  useEffect(() => {
    if (!data || !isUpdate) return;

    fillForm(form, { ...data, amount: data.amount / 100 });
  }, [data, form, isUpdate]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isPending) return;
        if (!value) form.reset();
        onOpenChange(value);
      }}
    >
      <DialogContent
        onOpenAutoFocus={() => {
          if (prefillData && !isUpdate) {
            fillForm(form, prefillData);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("payoffs")}</DialogTitle>
          <DialogDescription>
            {isUpdate ? t("updateExistingPayoff") : t("createNewPayoff")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-payoff-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-8 px-4 overflow-y-auto"
        >
          <FieldGroup>
            {/* Date */}
            <DateInput name="date" label={tc("date")} control={form.control} />

            {/* Amount */}
            <NumberInput
              name="amount"
              label={t("amount")}
              control={form.control}
            />

            {/* Notes */}
            <TextareaInput
              name="notes"
              label={tc("description")}
              control={form.control}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button disabled={isPending} type="submit" form="create-payoff-form">
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="animate-spin" />
            )}
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
