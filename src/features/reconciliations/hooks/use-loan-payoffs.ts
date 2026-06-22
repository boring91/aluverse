import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc";

export function useLoanPayoffs(loanId: string | undefined, enabled: boolean) {
  const trpc = useTRPC();

  const queryInput = {
    loanId: loanId!,
    pagination: { pageSize: -1, pageIndex: 0 },
  };

  const { data: payoffs } = useQuery(
    trpc.loanPayoffs.list.queryOptions(queryInput, {
      enabled: !!loanId && enabled,
    }),
  );

  return payoffs?.items;
}
