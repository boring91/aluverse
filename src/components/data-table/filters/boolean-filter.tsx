"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterControl } from "../types";

type BooleanFilterValue = "true" | "false" | "all";

type Option = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  control: FilterControl<BooleanFilterValue>;
  trueLabel?: string;
  falseLabel?: string;
  placeholder?: string;
};

export const BooleanFilter = ({
  label,
  control,
  trueLabel,
  falseLabel,
  placeholder,
}: Props) => {
  const options: Option[] = [
    { value: "all", label: "All" },
    { value: "true", label: trueLabel ?? "Yes" },
    { value: "false", label: falseLabel ?? "No" },
  ];
  const labelByValue = new Map(
    options.map((option) => [option.value, option.label]),
  );

  const value = control.value;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select
        value={value ?? "all"}
        onValueChange={(val) =>
          control.set(val === "all" ? undefined : (val as BooleanFilterValue))
        }
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder={placeholder ?? "All"}>
            {(selectedValue) =>
              labelByValue.get(selectedValue as string) ?? placeholder ?? "All"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
