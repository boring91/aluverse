import { MoreVerticalIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type Props = {
  itemId: string;
  handleUpdate?: (itemId: string) => void;
  handleDelete?: (itemId: string) => void;
  currentlyProcessing: Set<string>;
  detailsLink?: string;
  extraItems?: ReactNode;
};

export const DataTableActions = ({
  itemId,
  handleUpdate,
  handleDelete,
  currentlyProcessing,
  detailsLink,
  extraItems,
}: Props) => {
  const hasVisibleAction =
    !!detailsLink || !!handleUpdate || !!handleDelete || !!extraItems;
  const hasPrimaryActions = !!detailsLink || !!handleUpdate || !!extraItems;

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
          {detailsLink && (
            <DropdownMenuItem asChild>
              <a href={detailsLink}>View</a>
            </DropdownMenuItem>
          )}

          {handleUpdate && (
            <DropdownMenuItem
              disabled={currentlyProcessing.has(itemId)}
              onClick={() => handleUpdate(itemId)}
            >
              Edit
            </DropdownMenuItem>
          )}
          {extraItems}
        </DropdownMenuGroup>

        {handleDelete && hasPrimaryActions && <DropdownMenuSeparator />}

        {handleDelete && (
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
