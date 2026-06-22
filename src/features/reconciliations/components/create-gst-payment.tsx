import { forwardRef, useImperativeHandle, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc";
import { CreateGstPayment as BaseCreateGstPayment } from "@/features/gst/components/create-gst-payment";

type GstPaymentPrefillData = {
  amount: number;
};

export type CreateGstPaymentHandle = {
  open: () => void;
  close: () => void;
};

type Props = {
  onPaymentCreated: (paymentId: string) => void;
  prefillData?: GstPaymentPrefillData;
  canCreate: boolean;
};

export const CreateGstPayment = forwardRef<CreateGstPaymentHandle, Props>(
  ({ onPaymentCreated, prefillData, canCreate }, ref) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    useImperativeHandle(ref, () => ({
      open: () => {
        if (canCreate) {
          setOpen(true);
        }
      },
      close: () => {
        setOpen(false);
      },
    }));

    const invalidateGstPayments = () => {
      queryClient.invalidateQueries(
        trpc.gst.listPayments.queryOptions({
          pagination: { pageSize: -1, pageIndex: 0 },
        }),
      );
    };

    const handleCreated = (paymentId: string) => {
      invalidateGstPayments();
      onPaymentCreated(paymentId);
      setOpen(false);
    };

    return canCreate ? (
      <BaseCreateGstPayment
        open={open}
        onOpenChange={setOpen}
        itemId={null}
        onCreated={handleCreated}
        prefillData={prefillData}
      />
    ) : null;
  },
);

CreateGstPayment.displayName = "CreateGstPayment";
