"use client";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export const SuggestionChips = ({
  suggestions,
  onSelect,
}: SuggestionChipsProps) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-shrink-0 flex-wrap gap-1.5 px-4 pb-3">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          {s}
        </button>
      ))}
    </div>
  );
};
