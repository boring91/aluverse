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

type BooleanFilterValue = "true" | "false" | "all" | undefined;

type Option = {
    value: string;
    label: string;
};

type Props = {
    label: string;
    value: BooleanFilterValue;
    onChange: (value: BooleanFilterValue) => void;
    trueLabel?: string;
    falseLabel?: string;
    placeholder?: string;
};

export const BooleanFilter = ({
    label,
    value,
    onChange,
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

    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Select
                value={value ?? "all"}
                onValueChange={val =>
                    onChange(val === "all" ? undefined : (val as BooleanFilterValue))
                }
            >
                <SelectTrigger size="sm" className="h-9 w-[160px]">
                    <SelectValue placeholder={placeholder ?? tc("all")} />
                </SelectTrigger>
                <SelectContent>
                    {options.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

