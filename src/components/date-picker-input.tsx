import { Trash2Icon } from "lucide-react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useState } from "react";
import { formatCalendarDate, parseDateString, toDateString } from "@/lib/date";

type Props = {
  // Calendar dates are plain `YYYY-MM-DD` strings, timezone-free.
  value?: string | null;
  onChange: (value?: string | null) => void;
  placeholder?: string;
};

export const DatePickerInput = ({ value, onChange, placeholder }: Props) => {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? parseDateString(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="justify-start grow"
          >
            {value ? formatCalendarDate(value) : (placeholder ?? "-")}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghostDestructive"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
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
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            setOpen(false);
            onChange(date ? toDateString(date) : null);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
