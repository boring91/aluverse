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
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = {
    itemId: string;
    handleUpdate: (itemId: string) => void;
    setCurrentlyDeletingItemId: (itemId: string) => void;
    currentlyProcessing: Set<string>;
    detailsLink?: string;
};

export const DataTableActions = ({
    itemId,
    handleUpdate,
    setCurrentlyDeletingItemId,
    currentlyProcessing,
    detailsLink,
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
                <DropdownMenuGroup>
                    {detailsLink && (
                        <DropdownMenuItem asChild>
                            <Link href={detailsLink}>{tc("view")}</Link>
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                        disabled={currentlyProcessing.has(itemId)}
                        onClick={() => handleUpdate(itemId)}
                    >
                        {tc("edit")}
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem
                        variant="destructive"
                        disabled={currentlyProcessing.has(itemId)}
                        onClick={() => setCurrentlyDeletingItemId(itemId)}
                    >
                        {tc("delete")}
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
