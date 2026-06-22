"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/client-utils";
import { format } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { useState } from "react";
import type { FilterControl } from "../types";

type DateRange = {
  from?: Date;
  to?: Date;
};

type Props = {
  label: string;
  control: FilterControl<DateRange>;
};

export const DateRangeFilter = ({ label, control }: Props) => {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const value = control.value;
  const hasValue = value?.from || value?.to;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        {/* From Date */}
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 w-[140px] justify-start text-left font-normal",
                !value?.from && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="size-4" />
              {value?.from ? format(value.from, "MMM d, yyyy") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value?.from}
              onSelect={(date) => {
                control.set({ ...value, from: date });
                setFromOpen(false);
              }}
              disabled={(date) => (value?.to ? date > value.to : false)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">-</span>

        {/* To Date */}
        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 w-[140px] justify-start text-left font-normal",
                !value?.to && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="size-4" />
              {value?.to ? format(value.to, "MMM d, yyyy") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value?.to}
              onSelect={(date) => {
                control.set({ ...value, to: date });
                setToOpen(false);
              }}
              disabled={(date) => (value?.from ? date < value.from : false)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Clear button */}
        {hasValue && (
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => control.set({ from: undefined, to: undefined })}
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
