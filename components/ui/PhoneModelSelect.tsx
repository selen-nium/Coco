"use client";
import { useState, useRef, useEffect } from "react";

const PHONE_MODELS = [
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 mini", "iPhone 13",
  "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12 mini", "iPhone 12",
  "iPhone SE (3rd gen)", "iPhone SE (2nd gen)",
  "Samsung Galaxy S24 Ultra", "Samsung Galaxy S24+", "Samsung Galaxy S24",
  "Samsung Galaxy S23 Ultra", "Samsung Galaxy S23+", "Samsung Galaxy S23",
  "Samsung Galaxy A55 5G", "Samsung Galaxy A54 5G", "Samsung Galaxy A35 5G",
  "Samsung Galaxy A15", "Samsung Galaxy A05",
  "Google Pixel 9 Pro", "Google Pixel 9", "Google Pixel 8 Pro", "Google Pixel 8",
  "Google Pixel 7 Pro", "Google Pixel 7", "Google Pixel 6a",
  "Motorola Edge 50", "Motorola Moto G Power", "Motorola Moto G Play",
  "Other iPhone", "Other Android",
];

interface PhoneModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
}

export function PhoneModelSelect({ value, onChange, label = "Their phone model", hint }: PhoneModelSelectProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = PHONE_MODELS.filter(m =>
    m.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && <label className="text-sm font-medium text-[#1a1208]">{label}</label>}
      <div className="relative">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); onChange(""); }}
          onFocus={() => setOpen(true)}
          placeholder="Search phone model…"
          className="w-full rounded-xl border border-[#e8e4de] bg-white px-4 py-3 text-sm text-[#1a1208] placeholder:text-[#bbb] outline-none focus:border-[#e8733b] focus:ring-2 focus:ring-[#e8733b]/20 transition"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-[#e8e4de] bg-white shadow-lg">
            {filtered.map(model => (
              <li key={model}>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm text-[#1a1208] hover:bg-[#f5f4f0] transition"
                  onClick={() => { onChange(model); setQuery(model); setOpen(false); }}
                >
                  {model}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hint && <p className="text-xs text-[#888]">{hint}</p>}
    </div>
  );
}
