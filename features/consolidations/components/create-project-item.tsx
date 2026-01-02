import { forwardRef, useImperativeHandle, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { projectStreams } from "@/lib/constants";
import { CreateLabor } from "@/features/projects/components/create-labor";
import { CreateMisc } from "@/features/projects/components/create-misc";
import { CreatePayment } from "@/features/projects/components/create-payment";
import { CreateSupply } from "@/features/projects/components/create-supply";

type Stream = (typeof projectStreams)[number];

export type CreateProjectItemHandle = {
  open: () => void;
  close: () => void;
};

type Props = {
  projectId: string;
  stream?: Stream;
  onItemCreated: (itemId: string) => void;
};

export const CreateProjectItem = forwardRef<CreateProjectItemHandle, Props>(
  ({ projectId, stream, onItemCreated }, ref) => {
    const [openStream, setOpenStream] = useState<Stream | null>(null);
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    useImperativeHandle(ref, () => ({
      open: () => {
        if (stream) setOpenStream(stream);
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
      if (currentStream === "supplies") {
        queryClient.invalidateQueries(
          trpc.projectSupplies.list.queryOptions(queryInput)
        );
      } else if (currentStream === "labors") {
        queryClient.invalidateQueries(
          trpc.projectLabors.list.queryOptions(queryInput)
        );
      } else if (currentStream === "misc") {
        queryClient.invalidateQueries(
          trpc.projectMisc.list.queryOptions(queryInput)
        );
      } else if (currentStream === "payments") {
        queryClient.invalidateQueries(
          trpc.projectPayments.list.queryOptions(queryInput)
        );
      }
    };

    const handleCreated = (currentStream: Stream) => (itemId: string) => {
      invalidateProjectItems(currentStream);
      onItemCreated(itemId);
      setOpenStream(null);
    };

    return (
      <>
        <CreateSupply
          open={openStream === "supplies"}
          onOpenChange={(open) => setOpenStream(open ? "supplies" : null)}
          projectId={projectId}
          itemId={null}
          onItemCreated={handleCreated("supplies")}
        />
        <CreateLabor
          open={openStream === "labors"}
          onOpenChange={(open) => setOpenStream(open ? "labors" : null)}
          projectId={projectId}
          itemId={null}
          onItemCreated={handleCreated("labors")}
        />
        <CreateMisc
          open={openStream === "misc"}
          onOpenChange={(open) => setOpenStream(open ? "misc" : null)}
          projectId={projectId}
          itemId={null}
          onItemCreated={handleCreated("misc")}
        />
        <CreatePayment
          open={openStream === "payments"}
          onOpenChange={(open) => setOpenStream(open ? "payments" : null)}
          projectId={projectId}
          itemId={null}
          onItemCreated={handleCreated("payments")}
        />
      </>
    );
  }
);

CreateProjectItem.displayName = "CreateProjectItem";
