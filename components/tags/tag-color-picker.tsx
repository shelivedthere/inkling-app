"use client";

import {
  TAG_COLOR_OPTIONS,
  type TagColorId,
  tagColorClasses,
} from "@/lib/utils/tag-colors";

interface TagColorPickerProps {
  value: TagColorId;
  onChange: (color: TagColorId) => void;
  disabled?: boolean;
}

export function TagColorPicker({
  value,
  onChange,
  disabled = false,
}: TagColorPickerProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="radiogroup"
      aria-label="Tag color"
    >
      {TAG_COLOR_OPTIONS.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={`h-6 w-6 rounded-full transition ${tagColorClasses(option.id, "swatch")} ${
              selected
                ? "ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--paper)]"
                : "opacity-80 hover:opacity-100"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          />
        );
      })}
    </div>
  );
}
