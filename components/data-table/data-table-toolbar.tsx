"use client";

import { Table } from "@tanstack/react-table";

import { Button } from "../ui/button";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  setOpenCreateSheet?: (open: boolean) => void;
};

export function DataTableToolbar<TData>({
  setOpenCreateSheet,
}: DataTableToolbarProps<TData>) {
  const tc = useTranslations("Common");

  return (
    <div className="flex items-center justify-between">
      <div>{/* Filters will be here */}</div>
      <div className="flex items-center gap-2">
        {setOpenCreateSheet && (
          <Button size="sm" onClick={() => setOpenCreateSheet(true)}>
            <PlusIcon />
            {tc("createNew")}
          </Button>
        )}
      </div>
    </div>
  );
}
