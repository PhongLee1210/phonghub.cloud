"use client";

import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      placeholder = "Select option",
      onValueChange,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const selectedOption = options.find((option) => option.value === value);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={false}
            aria-haspopup="listbox"
            aria-label={`Select option${selectedOption ? `: ${selectedOption.label}` : ""}`}
            className={cn(
              "w-full justify-between",
              !selectedOption && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            {...props}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px] max-h-[200px] overflow-y-auto"
          align="start"
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onValueChange?.(option.value)}
              disabled={option.disabled}
              className={cn(
                "cursor-pointer",
                value === option.value && "bg-accent"
              )}
            >
              {option.label}
              {value === option.value && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

Select.displayName = "Select";

export { Select };
