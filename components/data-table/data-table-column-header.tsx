import {
    ArrowDownIcon,
    ArrowUpIcon,
    ChevronsUpDownIcon,
    EyeOffIcon,
} from "lucide-react";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/client-utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

interface DataTableColumnHeaderProps<TData, TValue>
    extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>;
    title: string;
}

export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
}: DataTableColumnHeaderProps<TData, TValue>) {
    const tc = useTranslations("Common");

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
                        {tc("asc")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => column.toggleSorting(true)}
                    >
                        <ArrowDownIcon className="text-muted-foreground/70" />
                        {tc("desc")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => column.toggleVisibility(false)}
                    >
                        <EyeOffIcon className="text-muted-foreground/70" />
                        {tc("hide")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
