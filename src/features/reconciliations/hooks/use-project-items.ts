import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc";
import type { projectStreams } from "@/lib/constants";

type Stream = (typeof projectStreams)[number] | undefined;
type UnionOfArraysToArrayOfUnion<T> = T extends (infer U)[] ? U : never;

export function useProjectItems(
  projectId: string | undefined,
  stream: Stream,
  enabled: boolean,
) {
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
      makeOptions(enabled && stream === "supplies"),
    ),
  );
  const { data: labors } = useQuery(
    trpc.projectLabors.list.queryOptions(
      queryInput,
      makeOptions(enabled && stream === "labors"),
    ),
  );
  const { data: misc } = useQuery(
    trpc.projectMisc.list.queryOptions(
      queryInput,
      makeOptions(enabled && stream === "misc"),
    ),
  );
  const { data: payments } = useQuery(
    trpc.projectPayments.list.queryOptions(
      queryInput,
      makeOptions(enabled && stream === "payments"),
    ),
  );

  const dataMap = { supplies, labors, misc, payments };
  const data = stream ? dataMap[stream]?.items : undefined;

  return data as UnionOfArraysToArrayOfUnion<typeof data>[] | undefined;
}
