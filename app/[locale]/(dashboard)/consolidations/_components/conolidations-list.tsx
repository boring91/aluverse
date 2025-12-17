import { useDataTable } from "@/hooks/use-data-table";
import { useTRPC } from "@/trpc/client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { parseAsString, useQueryState } from "nuqs";
import { useConsolidationsColumns } from "../_hooks/use-consolidations-columns";
import { ConsolidateTransaction } from "./consolidate-transaction";

export const ConsolidationsList = () => {
    const [consolidationId, setConsolidationId] = useQueryState(
        "consolidationId",
        parseAsString
    );

    const { ...dataTable } = useDataTable({
        pageSize: 100,
    });

    const trpc = useTRPC();
    const { data } = useQuery(
        trpc.consolidations.list.queryOptions(
            {
                pagination: dataTable.pagination,
                sorting: dataTable.sorting,
                columnFilters: dataTable.columnFilters,
            },
            {
                placeholderData: keepPreviousData,
            }
        )
    );

    const columns = useConsolidationsColumns(setConsolidationId);

    return (
        <>
            {consolidationId && (
                <ConsolidateTransaction
                    consolidationId={consolidationId}
                    open={!!consolidationId}
                    onOpenChange={open => {
                        if (!open) {
                            setConsolidationId(null);
                        }
                    }}
                />
            )}
            <DataTable
                columns={columns}
                data={data}
                {...dataTable}
                setOpenCreateSheet={undefined}
            />
        </>
    );
};
