import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { projectStreams } from "@/lib/constants";

type Stream = (typeof projectStreams)[number] | undefined;
type UnionOfArraysToArrayOfUnion<T> = T extends (infer U)[] ? U : never;

export function useProjectItems(projectId: string | undefined, stream: Stream) {
  const trpc = useTRPC();

  const queryInput = {
    projectId: projectId!,
    pagination: { pageSize: -1, pageIndex: 0 },
  };

  const makeOptions = (enabled: boolean) => ({
    enabled: !!projectId && enabled,
  });

  const { data: supplies } = useQuery(
    trpc.projectSupplies.list.queryOptions(
      queryInput,
      makeOptions(stream === "supplies")
    )
  );
  const { data: labors } = useQuery(
    trpc.projectLabors.list.queryOptions(
      queryInput,
      makeOptions(stream === "labors")
    )
  );
  const { data: misc } = useQuery(
    trpc.projectMisc.list.queryOptions(
      queryInput,
      makeOptions(stream === "misc")
    )
  );
  const { data: payments } = useQuery(
    trpc.projectPayments.list.queryOptions(
      queryInput,
      makeOptions(stream === "payments")
    )
  );

  const dataMap = { supplies, labors, misc, payments };
  const data = stream ? dataMap[stream]?.items : undefined;

  return data as UnionOfArraysToArrayOfUnion<typeof data>[] | undefined;
}
