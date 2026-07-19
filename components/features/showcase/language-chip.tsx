import { cn } from "@/lib/utils";

/**
 * LanguageChip — small pill that labels the editor's active language.
 *
 * Renders `TSX` for TypeScript (the showcase editor primarily shows TSX
 * snippets) and `PY` for Python. Success-toned to match Figma node `20:5`.
 */
export type LanguageChipLanguage = "typescript" | "python";

export interface LanguageChipProps {
  language: LanguageChipLanguage;
  className?: string;
}

const LANGUAGE_LABEL: Record<LanguageChipLanguage, string> = {
  typescript: "TSX",
  python: "PY",
};

export function LanguageChip({ language, className }: LanguageChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-success/30 bg-success/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-wider text-success",
        className,
      )}
      aria-label={`Language: ${language}`}
    >
      {LANGUAGE_LABEL[language]}
    </span>
  );
}

export default LanguageChip;
