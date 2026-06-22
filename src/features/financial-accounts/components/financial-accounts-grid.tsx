import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/client-utils";
import { formatCurrency } from "@/lib/utils";
import type { AppRouter } from "@/trpc/router";
import { Edit3Icon, RefreshCwIcon, Trash2Icon } from "lucide-react";

type Props = {
  items: inferRouterOutputs<AppRouter>["financialAccounts"]["list"];
  onClickForUpdate: (itemId: string) => void;
  onClickForSync: (itemId: string) => void;
  onClickForDelete: (itemId: string) => void;
  currentlyProcessing: Set<string>;
  canUpdate: boolean;
  canSync: boolean;
  canDelete: boolean;
};

export const FinancialAccountsGrid = ({
  items,
  onClickForUpdate,
  onClickForSync,
  onClickForDelete,
  currentlyProcessing,
  canUpdate,
  canSync,
  canDelete,
}: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((account) => {
        return (
          <Link
            key={account.id}
            params={{ accountId: account.id }}
            to="/financial-accounts/$accountId"
          >
            <Card>
              <CardHeader className="flex items-center justify-between gap-2">
                <CardTitle>{account.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {/* Edit */}
                  {canUpdate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        onClickForUpdate(account.id);
                      }}
                      disabled={currentlyProcessing.has(account.id)}
                    >
                      <Edit3Icon />
                    </Button>
                  )}

                  {/* Sync */}
                  {canSync && account.syncWithBank && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        onClickForSync(account.id);
                      }}
                      disabled={currentlyProcessing.has(account.id)}
                    >
                      <RefreshCwIcon />
                    </Button>
                  )}

                  {/* Delete */}
                  {canDelete && (
                    <Button
                      variant="ghostDestructive"
                      size="icon-sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        onClickForDelete(account.id);
                      }}
                      disabled={currentlyProcessing.has(account.id)}
                    >
                      <Trash2Icon />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent
                className={cn(
                  "text-2xl font-mono font-bold",
                  account.balance < 0 && "text-rose-500",
                )}
              >
                {formatCurrency(account.balance)}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};
