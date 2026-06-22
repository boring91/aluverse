import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  EyeOffIcon,
} from "lucide-react";
import type { Column } from "@tanstack/react-table";

import { cn } from "@/lib/client-utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props<TData, TValue> = React.HTMLAttributes<HTMLDivElement> & {
  column: Column<TData, TValue>;
  title: string;
};

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: Props<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ChevronsUpDownIcon className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => column.toggleSorting(false)}
          >
            <ArrowUpIcon className="text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => column.toggleSorting(true)}
          >
            <ArrowDownIcon className="text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => column.toggleVisibility(false)}
          >
            <EyeOffIcon className="text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
