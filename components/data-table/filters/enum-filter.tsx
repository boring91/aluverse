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

type Option = {
  value: string;
  label: string;
};

type Props<T> = {
  label: string;
  control: FilterControl<T>;
  options: Option[];
  placeholder?: string;
};

export const EnumFilter = <T,>({
  label,
  control,
  options,
  placeholder,
}: Props<T>) => {
  const tc = useTranslations("Common");

  const allOptions: Option[] = [{ value: "all", label: tc("all") }, ...options];

  const value = control.value;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select
        value={(value as string) ?? "all"}
        onValueChange={(val) =>
          control.set(val === "all" ? undefined : (val as T))
        }
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder={placeholder ?? tc("all")} />
        </SelectTrigger>
        <SelectContent>
          {allOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
