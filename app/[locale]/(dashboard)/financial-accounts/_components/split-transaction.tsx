import { Dialog } from "@/components/ui/dialog";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { useFieldArray, useForm } from "react-hook-form";

type Transaction =
    inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

type Props = {
    transaction: Transaction;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const SplitTransaction = ({
    transaction,
    open,
    onOpenChange,
}: Props) => {
    const { control, register } = useForm<{
        amounts: { value: number }[];
    }>({
        defaultValues: {
            amounts: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "amounts",
    });

    return <p>Hey</p>;
};
