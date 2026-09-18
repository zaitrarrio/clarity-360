import { useEffect, useRef } from "react";

export const OTHER_KEY = "__other__";

/**
 * A free-text "Other" option rendered alongside Clara's multiple-choice answers,
 * so a user is never forced into a choice that does not describe their business.
 */
export function OtherChoice({
  number,
  selected,
  onSelect,
  value,
  onChange,
  onSubmit,
  submitLabel = "Use my answer",
  placeholder = "Tell Clara in your own words…",
  variant = "card",
}: {
  number: number;
  selected: boolean;
  onSelect: () => void;
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  placeholder?: string;
  variant?: "card" | "row";
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selected) inputRef.current?.focus();
  }, [selected]);

  const field = (
    <div className="mt-3">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (onSubmit && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) onSubmit();
          }
        }}
        rows={2}
        placeholder={placeholder}
        aria-label="Your own answer"
        className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-[13.5px] font-light leading-relaxed text-foreground outline-none transition-colors focus:border-ember placeholder:text-muted-foreground/70"
      />
      {onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim()}
          className="mt-2 rounded-full bg-ember px-4 py-1.5 text-[12.5px] font-medium text-on-ember disabled:opacity-55"
        >
          {submitLabel}
        </button>
      ) : null}
    </div>
  );

  if (variant === "row") {
    return (
      <div
        className={`rounded-xl border px-4 py-2.5 transition-colors ${
          selected ? "border-ember bg-ember/8" : "border-border"
        }`}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex w-full items-baseline gap-3 text-left text-[13px] font-light text-foreground"
        >
          <span className="font-mono text-[11px] text-ember">{number}.</span>
          <span>Other — none of these fit</span>
        </button>
        {selected ? field : null}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl border p-6 pt-9 text-left transition-colors ${
        selected ? "border-ember bg-ember/8" : "border-border bg-card hover:border-ember/50"
      }`}
    >
      <span className="absolute left-6 top-4 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
        {number}.
      </span>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="mt-1 font-display text-[24px] font-medium leading-tight text-foreground">Other</div>
        <p className="mt-2 text-[13.5px] font-light leading-relaxed text-muted-foreground">
          None of these fit — describe it yourself and Clara will plan around your answer.
        </p>
      </button>
      {selected ? field : null}
    </div>
  );
}
