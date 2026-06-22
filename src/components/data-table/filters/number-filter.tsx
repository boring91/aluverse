"use client";

import type { FilterControl } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  control: FilterControl<number>;
  placeholder?: string;
};

export const NumberFilter = ({ label, control, placeholder }: Props) => {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={control.value ?? ""}
        onChange={(event) =>
          control.set(
            event.target.value === "" ? undefined : Number(event.target.value),
          )
        }
        placeholder={placeholder}
      />
    </div>
  );
};
