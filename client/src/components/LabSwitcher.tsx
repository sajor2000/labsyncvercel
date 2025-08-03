import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useLabContext } from "@/hooks/useLabContext";
import type { Lab } from "@shared/schema";

export function LabSwitcher() {
  const [open, setOpen] = useState(false);
  const { selectedLab, setSelectedLab, allLabs } = useLabContext();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          data-testid="lab-switcher"
        >
          <div className="flex items-center">
            <Building2 className="mr-2 h-4 w-4" />
            <span className="truncate">
              {selectedLab ? selectedLab.name : "Select lab..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search labs..." />
          <CommandEmpty>No lab found.</CommandEmpty>
          <CommandGroup>
            {allLabs.map((lab) => (
              <CommandItem
                key={lab.id}
                onSelect={() => {
                  setSelectedLab(lab.id === selectedLab?.id ? null : lab);
                  setOpen(false);
                }}
                data-testid={`lab-option-${lab.id}`}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedLab?.id === lab.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex items-center flex-1">
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: lab.color || '#3b82f6' }}
                  />
                  <span className="truncate">{lab.name}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}