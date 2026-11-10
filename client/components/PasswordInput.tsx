"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/** Password field: visible text by default; eye toggles mask. */
export default function PasswordInput({ value, onChange, placeholder, className }: Props) {
  const [masked, setMasked] = useState(false);

  return (
    <div className="relative">
      <input
        type={masked ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`${className ?? ""} pr-11`}
      />
      <button
        type="button"
        onClick={() => setMasked((m) => !m)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        aria-label={masked ? "Show password" : "Hide password"}
      >
        {masked ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  );
}
