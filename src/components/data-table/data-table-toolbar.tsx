"use client";

import type { Table } from "@tanstack/react-table";

import { Button } from "../ui/button";
import { PlusIcon } from "lucide-react";

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  setOpenCreateSheet?: (open: boolean) => void;
};

export function DataTableToolbar<TData>({
  setOpenCreateSheet,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between">
      <div>{/* Filters will be here */}</div>
      <div className="flex items-center gap-2">
        {setOpenCreateSheet && (
          <Button size="sm" onClick={() => setOpenCreateSheet(true)}>
            <PlusIcon />
            Create new
          </Button>
        )}
      </div>
    </div>
  );
}
