"use client";

interface PhoneInputProps {
  label?: string;
  hint?: string;
  value: string;
  onChange: (e14: string) => void;
}

function formatDisplay(digits: string): string {
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function PhoneInput({ label, hint, value, onChange }: PhoneInputProps) {
    // value is stored as "+65xxxxxxxx" — derive the 8-digit display portion
    const digits = value.replace(/^\+65/, "").replace(/\D/g, "").slice(0, 8);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    onChange(raw.length > 0 ? `+65${raw}` : "");
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#1a1208]">{label}</label>
      )}
      <div className="flex items-center rounded-xl border border-[#e8e4de] bg-white focus-within:border-[#e8733b] focus-within:ring-2 focus-within:ring-[#e8733b]/20 transition overflow-hidden">
        <span className="flex items-center px-3 py-2.5 text-sm font-medium text-[#888] border-r border-[#e8e4de] bg-[#f5f4f0] select-none">
          +65
        </span>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="9999 9999"
          value={formatDisplay(digits)}
          onChange={handleChange}
          className="flex-1 px-3 py-2.5 text-sm text-[#1a1208] placeholder:text-[#bbb] outline-none bg-transparent"
        />
      </div>
      {hint && <p className="text-xs text-[#888]">{hint}</p>}
    </div>
  );
}
