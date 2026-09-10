"use client";

import React from "react";

export interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (newQuantity: number) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function QuantitySelector({
  quantity,
  min = 1,
  max = 9999,
  onChange,
  size = "md",
  disabled = false,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      onChange(min);
    } else if (val < min) {
      onChange(min);
    } else if (val > max) {
      onChange(max);
    } else {
      onChange(val);
    }
  };

  const buttonSize =
    size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  const inputSize =
    size === "sm" ? "w-10 h-7 text-xs" : "w-12 h-9 text-sm";

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white shadow-xs overflow-hidden">
      <button
        type="button"
        disabled={disabled || quantity <= min}
        onClick={handleDecrement}
        className={`${buttonSize} flex items-center justify-center bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Decrease quantity"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>

      <input
        type="number"
        min={min}
        max={max}
        value={quantity}
        onChange={handleChange}
        disabled={disabled}
        className={`${inputSize} text-center font-bold text-slate-900 border-x border-slate-300 bg-white focus:outline-none focus:bg-sky-50/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />

      <button
        type="button"
        disabled={disabled || quantity >= max}
        onClick={handleIncrement}
        className={`${buttonSize} flex items-center justify-center bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Increase quantity"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
