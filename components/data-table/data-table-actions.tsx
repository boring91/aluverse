import { MoreVerticalIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";

type Props = {
    itemId: string;
    handleUpdate: (itemId: string) => void;
    setCurrentlyDeletingItemId: (itemId: string) => void;
    currentlyProcessing: Set<string>;
};

export const DataTableActions = ({
    itemId,
    handleUpdate,
    setCurrentlyDeletingItemId,
    currentlyProcessing,
}: Props) => {
    const tc = useTranslations("Common");

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVerticalIcon />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem
                    disabled={currentlyProcessing.has(itemId)}
                    onClick={() => handleUpdate(itemId)}
                >
                    {tc("edit")}
                </DropdownMenuItem>

                <DropdownMenuItem
                    variant="destructive"
                    disabled={currentlyProcessing.has(itemId)}
                    onClick={() => setCurrentlyDeletingItemId(itemId)}
                >
                    {tc("delete")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
