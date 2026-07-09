import type { FilterControl } from "../types";
import { Label } from "@/components/ui/label";
import { DatePickerInput } from "@/components/date-picker-input";

type Props = {
  label: string;
  // Calendar dates are `YYYY-MM-DD` strings, timezone-free.
  control: FilterControl<string>;
  placeholder?: string;
};

export const DateFilter = ({ label, control, placeholder }: Props) => {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <DatePickerInput
        value={control.value}
        onChange={(value) => control.set(value ?? undefined)}
        placeholder={placeholder}
      />
    </div>
  );
};
