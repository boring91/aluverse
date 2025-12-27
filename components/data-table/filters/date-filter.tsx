"use client";

import { FilterControl } from "../types";
import { Label } from "@/components/ui/label";
import { DatePickerInput } from "@/components/date-picker-input";

type Props = {
    label: string;
    control: FilterControl<Date>;
    placeholder?: string;
};

export const DateFilter = ({ label, control, placeholder }: Props) => {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <DatePickerInput
                value={control.value}
                onChange={value => control.set(value)}
                placeholder={placeholder}
            />
        </div>
    );
};
