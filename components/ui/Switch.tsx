"use client";

import * as RadixSwitch from "@radix-ui/react-switch";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export function Switch({ checked, onCheckedChange, id }: SwitchProps) {
  return (
    <RadixSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={`relative h-6 w-11 rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#e8733b] focus-visible:ring-offset-2 ${
        checked ? "bg-[#e8733b]" : "bg-[#d0cdc8]"
      }`}
    >
      <RadixSwitch.Thumb className="block h-5 w-5 rounded-full bg-white shadow transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px]" />
    </RadixSwitch.Root>
  );
}
