"use client";

import { FilterControl } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

type Props = {
  label: string;
  control: FilterControl<string>;
  placeholder?: string;
};

export const StringFilter = ({ label, control, placeholder }: Props) => {
  const tc = useTranslations("Common");

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="text"
        value={control.value ?? ""}
        onChange={(event) => control.set(event.target.value)}
        placeholder={placeholder ?? tc("startTyping")}
      />
    </div>
  );
};
