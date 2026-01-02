"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { FilterControl } from "../types";

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
  const tc = useTranslations("Common");

  const options: Option[] = [
    { value: "all", label: tc("all") },
    { value: "true", label: trueLabel ?? tc("yes") },
    { value: "false", label: falseLabel ?? tc("no") },
  ];

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
          <SelectValue placeholder={placeholder ?? tc("all")} />
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
