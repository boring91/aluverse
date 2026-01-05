"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useState } from "react";

type Props = {
  value?: Date;
  onChange: (value?: Date) => void;
  placeholder?: string;
};

export const DatePickerInput = ({ value, onChange, placeholder }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="justify-start grow"
          >
            {value?.toDateString() ?? placeholder ?? "-"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghostDestructive"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                onChange(undefined);
              }}
            >
              <Trash2Icon />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          onSelect={(value) => {
            setOpen(false);
            onChange(value);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
