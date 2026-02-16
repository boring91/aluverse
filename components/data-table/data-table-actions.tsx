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

type Props = {
  itemId: string;
  handleUpdate: (itemId: string) => void;
  handleDelete: (itemId: string) => void;
  currentlyProcessing: Set<string>;
  detailsLink?: string;
};

export const DataTableActions = ({
  itemId,
  handleUpdate,
  handleDelete,
  currentlyProcessing,
  detailsLink,
}: Props) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          {detailsLink && (
            <DropdownMenuItem asChild>
              <Link href={detailsLink as Route}>View</Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            disabled={currentlyProcessing.has(itemId)}
            onClick={() => handleUpdate(itemId)}
          >
            Edit
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            disabled={currentlyProcessing.has(itemId)}
            onClick={() => handleDelete(itemId)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
