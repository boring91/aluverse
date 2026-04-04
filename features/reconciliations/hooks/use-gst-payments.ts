import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useGstPayments(enabled: boolean) {
  const trpc = useTRPC();

  const { data: gstPayments } = useQuery(
    trpc.gst.listPayments.queryOptions(
      {
        pagination: { pageSize: -1, pageIndex: 0 },
      },
      {
        enabled,
      }
    )
  );

  return gstPayments?.items;
}
