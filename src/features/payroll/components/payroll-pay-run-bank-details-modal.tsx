import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { AlertCircleIcon, CopyIcon } from "lucide-react";
import { Fragment } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/page-loader";
import { formatCurrency } from "@/lib/utils";
import { useTRPC } from "@/trpc";
import type { AppRouter } from "@/trpc/router";

type PayRunBankPayment =
  inferRouterOutputs<AppRouter>["payroll"]["getPayRunEmployeeBankPayments"][number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payRunId: number;
  employeeId: number | null;
  employeeName: string | null;
};

async function copyToClipboard(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`Copied ${label} to clipboard.`);
  } catch {
    toast.error(`Failed to copy ${label} to clipboard.`);
  }
}

type FieldRowProps = {
  label: string;
  value: string | null;
  clipboardValue?: string;
  clipboardLabel?: string;
  valueClassName?: string;
};

function FieldRow({
  label,
  value,
  clipboardValue,
  clipboardLabel,
  valueClassName,
}: FieldRowProps) {
  const copyable = clipboardValue ?? value;
  const copyLabel = clipboardLabel ?? label.toLowerCase();

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="flex items-center gap-1">
        <span className={`font-mono text-base ${valueClassName ?? ""}`}>
          {value ?? "—"}
        </span>
        {copyable ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(copyable, copyLabel)}
          >
            <CopyIcon />
          </Button>
        ) : null}
      </dd>
    </div>
  );
}

function BankPaymentFields({ payment }: { payment: PayRunBankPayment }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{payment.accountName ?? "—"}</p>
        {payment.accountType ? (
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {payment.accountType}
          </span>
        ) : null}
      </div>

      <dl className="mt-2 flex flex-col divide-y">
        <FieldRow label="BSB" value={payment.bsb} />
        <FieldRow
          label="Account number"
          value={payment.accountNumber}
          clipboardLabel="account number"
        />
        <FieldRow
          label="Amount"
          value={formatCurrency(payment.amountInCents)}
          clipboardValue={(payment.amountInCents / 100).toFixed(2)}
          clipboardLabel="amount"
          valueClassName="font-semibold text-emerald-500"
        />
      </dl>
    </div>
  );
}

export function PayrollPayRunBankDetailsModal({
  open,
  onOpenChange,
  payRunId,
  employeeId,
  employeeName,
}: Props) {
  const trpc = useTRPC();

  const { data: bankPayments, isLoading } = useQuery(
    trpc.payroll.getPayRunEmployeeBankPayments.queryOptions(
      {
        payRunId,
        employeeId: employeeId ?? 0,
      },
      {
        enabled: open && employeeId != null,
      },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Bank transfer details</DialogTitle>
          <DialogDescription>
            {employeeName ?? "Employee"} &mdash; copy each field into your bank
            transfer form.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <PageLoader variant="inline" />
        ) : !bankPayments || bankPayments.length === 0 ? (
          <Alert>
            <AlertCircleIcon />
            <AlertTitle>No bank accounts configured</AlertTitle>
            <AlertDescription>
              This employee does not have bank accounts set up in Employment
              Hero, or has no amount allocated for this pay run.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col">
            {bankPayments.map((payment, index) => (
              <Fragment key={payment.bankAccountId || payment.accountNumber}>
                {index > 0 ? <Separator className="my-4" /> : null}
                <BankPaymentFields payment={payment} />
              </Fragment>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
