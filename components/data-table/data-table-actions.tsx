import { MoreVerticalIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import Link from "next/link";
import type { Route } from "next";
import { ReactNode } from "react";

type Props = {
  itemId: string;
  handleUpdate: (itemId: string) => void;
  handleDelete: (itemId: string) => void;
  currentlyProcessing: Set<string>;
  detailsLink?: string;
  extraItems?: ReactNode;
  canView?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
};

export const DataTableActions = ({
  itemId,
  handleUpdate,
  handleDelete,
  currentlyProcessing,
  detailsLink,
  extraItems,
  canView = true,
  canUpdate = true,
  canDelete = true,
}: Props) => {
  const hasVisibleAction =
    (!!detailsLink && canView) || canUpdate || canDelete || !!extraItems;

  if (!hasVisibleAction) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          {detailsLink && canView && (
            <DropdownMenuItem asChild>
              <Link href={detailsLink as Route}>View</Link>
            </DropdownMenuItem>
          )}

          {canUpdate && (
            <DropdownMenuItem
              disabled={currentlyProcessing.has(itemId)}
              onClick={() => handleUpdate(itemId)}
            >
              Edit
            </DropdownMenuItem>
          )}
          {extraItems}
        </DropdownMenuGroup>

        {canDelete && <DropdownMenuSeparator />}

        {canDelete && (
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              disabled={currentlyProcessing.has(itemId)}
              onClick={() => handleDelete(itemId)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
