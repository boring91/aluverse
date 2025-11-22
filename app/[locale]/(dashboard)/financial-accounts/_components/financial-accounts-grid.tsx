import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { Edit3Icon, Trash2Icon } from "lucide-react";

type Props = {
    items: inferRouterOutputs<AppRouter>["financialAccounts"]["list"];
    onClickForUpdate: (itemId: string) => void;
    onClickForDelete: (itemId: string) => void;
    currentlyProcessing: Set<string>;
};

export const FinancialAccountsGrid = ({
    items,
    onClickForUpdate,
    onClickForDelete,
    currentlyProcessing,
}: Props) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(account => {
                return (
                    <Link
                        key={account.id}
                        href={`/financial-accounts/${account.id}`}
                    >
                        <Card>
                            <CardHeader className="flex items-center justify-between gap-2">
                                <CardTitle>{account.name}</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground"
                                        onClick={event => {
                                            event.stopPropagation();
                                            event.preventDefault();
                                            onClickForUpdate(account.id);
                                        }}
                                        disabled={currentlyProcessing.has(
                                            account.id
                                        )}
                                    >
                                        <Edit3Icon />
                                    </Button>
                                    <Button
                                        variant="ghostDestructive"
                                        size="icon-sm"
                                        onClick={event => {
                                            event.stopPropagation();
                                            event.preventDefault();
                                            onClickForDelete(account.id);
                                        }}
                                        disabled={currentlyProcessing.has(
                                            account.id
                                        )}
                                    >
                                        <Trash2Icon />
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
};
