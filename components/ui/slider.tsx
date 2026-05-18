"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

function Slider({ value, onChange, min = 0, max = 100, step = 1, className, disabled }: SliderProps) {
  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <div className="relative w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)] transition-all duration-200"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={cn(
          "absolute inset-0 w-full opacity-0 cursor-pointer h-2",
          disabled && "cursor-not-allowed"
        )}
      />
    </div>
  );
}

export { Slider };
