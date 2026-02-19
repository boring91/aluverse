"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/client-utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SearchableSelectContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  valueNode: HTMLSpanElement | null;
  setValueNode: (node: HTMLSpanElement | null) => void;
};

const SearchableSelectContext =
  React.createContext<SearchableSelectContextValue | null>(null);

function useSearchableSelectContext() {
  const context = React.useContext(SearchableSelectContext);
  if (!context) {
    throw new Error(
      "SearchableSelect components must be used within a SearchableSelect"
    );
  }
  return context;
}

// Root component
type Props = {
  value?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

const SearchableSelect = ({
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
}: Props) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState("");

  // Ref for the "teleportation destination"
  const [valueNode, setValueNode] = React.useState<HTMLSpanElement | null>(
    null
  );

  const isOpenControlled = controlledOpen !== undefined;
  const isValueControlled = controlledValue !== undefined;

  const open = isOpenControlled ? controlledOpen : internalOpen;
  const value = isValueControlled ? controlledValue : internalValue;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (isOpenControlled) {
        controlledOnOpenChange?.(newOpen);
      } else {
        setInternalOpen(newOpen);
      }
    },
    [isOpenControlled, controlledOnOpenChange]
  );

  const onValueChange = React.useCallback(
    (newValue: string) => {
      if (isValueControlled) {
        controlledOnValueChange?.(newValue);
      } else {
        setInternalValue(newValue);
      }
    },
    [isValueControlled, controlledOnValueChange]
  );

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      value,
      onValueChange,
      valueNode,
      setValueNode,
    }),
    [open, setOpen, value, onValueChange, valueNode]
  );

  return (
    <SearchableSelectContext.Provider value={contextValue}>
      <Popover open={open} onOpenChange={setOpen}>
        {children}
      </Popover>
    </SearchableSelectContext.Provider>
  );
};

// Trigger component
const SearchableSelectTrigger = ({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof PopoverTrigger> & {
  size?: "sm" | "default";
}) => {
  return (
    <PopoverTrigger
      data-size={size}
      className={cn(
        "border-input data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 gap-1.5 rounded-none border bg-transparent py-2 pe-2 ps-2.5 text-xs transition-colors select-none focus-visible:ring-1 aria-invalid:ring-1 data-[size=default]:h-8 data-[size=sm]:h-7 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="text-muted-foreground size-4 pointer-events-none" />
    </PopoverTrigger>
  );
};

function SearchableSelectValue({
  placeholder,
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const { value, setValueNode } = useSearchableSelectContext();

  return (
    <span
      ref={setValueNode}
      data-placeholder={!value ? "" : undefined}
      className={cn(
        "line-clamp-1 flex items-center gap-2",
        !value && "text-muted-foreground",
        className
      )}
    >
      {/* If no value, show placeholder. If value exists, content comes via Portal */}
      {!value ? placeholder : null}
    </span>
  );
}

function SearchableSelectContent({
  className,
  searchPlaceholder = "Search...",
  children,
}: {
  className?: string;
  searchPlaceholder?: string;
  children: React.ReactNode;
}) {
  const { open } = useSearchableSelectContext();

  if (!open) {
    return (
      <div className="hidden">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>{children}</CommandList>
        </Command>
      </div>
    );
  }

  return (
    <PopoverContent
      className={cn("w-(--radix-popover-trigger-width) p-0", className)}
      align="start"
    >
      <Command>
        <CommandInput placeholder={searchPlaceholder} />
        <CommandList>{children}</CommandList>
      </Command>
    </PopoverContent>
  );
}

// Group component
const SearchableSelectGroup = CommandGroup;

function SearchableSelectItem({
  className,
  value,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CommandItem>, "onSelect"> & {
  value: string;
  children: React.ReactNode;
}) {
  const {
    value: selectedValue,
    onValueChange,
    setOpen,
    valueNode,
  } = useSearchableSelectContext();

  const isSelected = selectedValue === value;

  const handleSelect = () => {
    onValueChange(value);
    setOpen(false);
  };

  return (
    <CommandItem
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className
      )}
      onSelect={handleSelect}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="size-4" />}
      </span>

      {children}

      {isSelected && valueNode && createPortal(children, valueNode)}
    </CommandItem>
  );
}

const SearchableSelectSeparator = () => {
  return <CommandSeparator className="my-1 h-px" />;
};
const SearchableSelectEmpty = CommandEmpty;

export {
  SearchableSelect,
  SearchableSelectTrigger,
  SearchableSelectValue,
  SearchableSelectContent,
  SearchableSelectGroup,
  SearchableSelectItem,
  SearchableSelectSeparator,
  SearchableSelectEmpty,
};
