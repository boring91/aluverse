import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import type { AppRouter } from "@/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";

type Loan = inferRouterOutputs<AppRouter>["loans"]["get"];

const LOAN_TYPE_LABELS = {
  lent: "Lent",
  borrowed: "Borrowed",
} as const;

export const LoanBasicInfo = ({ loan }: { loan: Loan }) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={loan.type === "lent" ? "default" : "secondary"}>
            {LOAN_TYPE_LABELS[loan.type]}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon size={16} />
            Date
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-lg font-semibold">
          {loan.date.toDateString()}
        </CardContent>
      </Card>

      {loan.dueDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon size={16} />
              Due date
            </CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-lg font-semibold">
            {loan.dueDate.toDateString()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
