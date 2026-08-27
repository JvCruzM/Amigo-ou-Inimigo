"use client";

import { useState } from "react";

function EyeIcon({ hidden = false }) {
  if (hidden) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
        <path d="M9.88 4.24A9.77 9.77 0 0 1 12 4c5 0 8.5 4 9.5 8a10.5 10.5 0 0 1-1.64 3.27" />
        <path d="M6.61 6.61C4.99 7.76 3.89 9.4 3 12c1 4 4.5 8 9 8a9.77 9.77 0 0 0 3.88-.76" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2.06 12.35a1 1 0 0 1 0-.7C3.12 7.6 7.08 4 12 4s8.88 3.6 9.94 7.65a1 1 0 0 1 0 .7C20.88 16.4 16.92 20 12 20s-8.88-3.6-9.94-7.65Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  required,
  label,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 pr-14 outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={
            visible ? "Ocultar senha" : "Exibir senha"
          }
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <EyeIcon hidden={visible} />
        </button>
      </div>
    </div>
  );
}