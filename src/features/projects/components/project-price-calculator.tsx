import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { GST_RATE } from "@/lib/constants";

type Props = {
  budgetUnitValue: number;
};

export const ProjectPriceCalculator = ({ budgetUnitValue }: Props) => {
  const [expenses, setExpenses] = useState<number | undefined>();
  const [labor, setLabor] = useState<number | undefined>();
  const [budgetUnits, setBudgetUnits] = useState<number | undefined>();
  const [margin, setMargin] = useState(20);

  const results = useMemo(() => {
    const expensesCents = Math.round((expenses ?? 0) * 100);
    const laborCents = Math.round((labor ?? 0) * 100);
    const units = budgetUnits ?? 0;

    const budgetExpense = budgetUnitValue * units;
    const totalCost = expensesCents + laborCents + budgetExpense;

    const marginDecimal = margin / 100;
    const priceExclGst =
      marginDecimal >= 1 ? 0 : Math.round(totalCost / (1 - marginDecimal));
    const priceInclGst = Math.round(priceExclGst * (1 + GST_RATE));

    return {
      budgetExpense,
      totalCost,
      priceExclGst,
      priceInclGst,
    };
  }, [expenses, labor, budgetUnits, margin, budgetUnitValue]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:items-start max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expenses">Expenses ($)</Label>
            <Input
              id="expenses"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={expenses ?? ""}
              onChange={(e) =>
                setExpenses(
                  e.target.value === ""
                    ? undefined
                    : parseFloat(e.target.value),
                )
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="labor">Labor ($)</Label>
            <Input
              id="labor"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={labor ?? ""}
              onChange={(e) =>
                setLabor(
                  e.target.value === ""
                    ? undefined
                    : parseFloat(e.target.value),
                )
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget-units">
              Budget units
              <span className="text-muted-foreground ml-1">
                ({formatCurrency(budgetUnitValue)} / unit)
              </span>
            </Label>
            <Input
              id="budget-units"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0"
              value={budgetUnits ?? ""}
              onChange={(e) =>
                setBudgetUnits(
                  e.target.value === ""
                    ? undefined
                    : parseFloat(e.target.value),
                )
              }
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="margin">Margin</Label>
              <span className="font-mono text-xs tabular-nums">{margin}%</span>
            </div>
            <Slider
              id="margin"
              value={[margin]}
              onValueChange={(value) =>
                setMargin(Array.isArray(value) ? value[0] : value)
              }
              min={0}
              max={99}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Expenses</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(Math.round((expenses ?? 0) * 100))}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Labor</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(Math.round((labor ?? 0) * 100))}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Budget expense</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(results.budgetExpense)}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between text-xs font-medium">
              <span>Total cost</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(results.totalCost)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-70">Price (excl. GST)</span>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatCurrency(results.priceExclGst)}
              </span>
            </div>
            <Separator className="bg-primary-foreground/20" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Price (incl. GST)</span>
              <span className="font-mono text-xl font-bold tabular-nums tracking-tight">
                {formatCurrency(results.priceInclGst)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
