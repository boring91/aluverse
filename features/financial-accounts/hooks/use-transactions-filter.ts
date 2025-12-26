import { useFilters } from "@/hooks/use-filters";
import { transactionFiltersSchema } from "../schemas/transaction.schema";

export const useTransactionFilters = () => {
    return useFilters(transactionFiltersSchema);
};
