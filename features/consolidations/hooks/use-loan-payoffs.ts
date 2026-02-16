import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useLoanPayoffs(loanId: string | undefined) {
  const trpc = useTRPC();

  const queryInput = {
    loanId: loanId!,
    pagination: { pageSize: -1, pageIndex: 0 },
  };

  const { data: payoffs } = useQuery(
    trpc.loanPayoffs.list.queryOptions(queryInput, {
      enabled: !!loanId,
    })
  );

  return payoffs?.items;
}
