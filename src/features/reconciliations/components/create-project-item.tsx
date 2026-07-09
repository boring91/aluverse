import { forwardRef, useImperativeHandle, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc";
import type { projectStreams } from "@/lib/constants";
import { CreateLabor } from "@/features/projects/components/create-labor";
import { CreateMisc } from "@/features/projects/components/create-misc";
import { CreatePayment } from "@/features/projects/components/create-payment";
import { CreateSupply } from "@/features/projects/components/create-supply";

type Stream = (typeof projectStreams)[number];

type ProjectItemPrefillData = {
  date: string;
  amount: number;
  description: string;
};

export type CreateProjectItemHandle = {
  open: () => void;
  close: () => void;
};

type Props = {
  projectId: string;
  stream?: Stream;
  onItemCreated: (itemId: string) => void;
  prefillData?: ProjectItemPrefillData;
  canCreate: boolean;
};

export const CreateProjectItem = forwardRef<CreateProjectItemHandle, Props>(
  ({ projectId, stream, onItemCreated, prefillData, canCreate }, ref) => {
    const [openStream, setOpenStream] = useState<Stream | null>(null);
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    useImperativeHandle(ref, () => ({
      open: () => {
        if (stream && canCreate) {
          setOpenStream(stream);
        }
      },
      close: () => {
        setOpenStream(null);
      },
    }));

    const invalidateProjectItems = (currentStream: Stream) => {
      const queryInput = {
        projectId,
        pagination: { pageSize: -1, pageIndex: 0 },
      };
      const invalidateByStream = {
        supplies: () =>
          queryClient.invalidateQueries(
            trpc.projectSupplies.list.queryOptions(queryInput),
          ),
        labors: () =>
          queryClient.invalidateQueries(
            trpc.projectLabors.list.queryOptions(queryInput),
          ),
        misc: () =>
          queryClient.invalidateQueries(
            trpc.projectMisc.list.queryOptions(queryInput),
          ),
        payments: () =>
          queryClient.invalidateQueries(
            trpc.projectPayments.list.queryOptions(queryInput),
          ),
      } satisfies Record<Stream, () => void>;

      invalidateByStream[currentStream]();
    };

    const handleCreated = (currentStream: Stream) => (itemId: string) => {
      invalidateProjectItems(currentStream);
      onItemCreated(itemId);
      setOpenStream(null);
    };

    return (
      <>
        {canCreate ? (
          <>
            <CreateSupply
              open={openStream === "supplies"}
              onOpenChange={(open) => setOpenStream(open ? "supplies" : null)}
              projectId={projectId}
              itemId={null}
              onItemCreated={handleCreated("supplies")}
              prefillData={
                prefillData
                  ? {
                      name: prefillData.description,
                      unitPrice: prefillData.amount,
                      quantity: 1,
                    }
                  : undefined
              }
            />
            <CreateLabor
              open={openStream === "labors"}
              onOpenChange={(open) => setOpenStream(open ? "labors" : null)}
              projectId={projectId}
              itemId={null}
              onItemCreated={handleCreated("labors")}
              prefillData={
                prefillData
                  ? {
                      name: prefillData.description,
                      amount: prefillData.amount,
                    }
                  : undefined
              }
            />
            <CreateMisc
              open={openStream === "misc"}
              onOpenChange={(open) => setOpenStream(open ? "misc" : null)}
              projectId={projectId}
              itemId={null}
              onItemCreated={handleCreated("misc")}
              prefillData={
                prefillData
                  ? {
                      name: prefillData.description,
                      amount: prefillData.amount,
                    }
                  : undefined
              }
            />
            <CreatePayment
              open={openStream === "payments"}
              onOpenChange={(open) => setOpenStream(open ? "payments" : null)}
              projectId={projectId}
              itemId={null}
              onItemCreated={handleCreated("payments")}
              prefillData={
                prefillData
                  ? {
                      date: prefillData.date,
                      amount: prefillData.amount,
                    }
                  : undefined
              }
            />
          </>
        ) : null}
      </>
    );
  },
);

CreateProjectItem.displayName = "CreateProjectItem";
