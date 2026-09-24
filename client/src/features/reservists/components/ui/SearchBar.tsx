import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-xl">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-100"
      />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name or national ID"
        aria-label="Search reservists"
        className="
        w-full
        rounded-xl
        border border-slate-700
        bg-slate-950
        py-3 pl-11 pr-11
        text-sm text-slate-100
        placeholder:text-slate-500
        shadow-sm
        transition
        focus:border-amber-400/60
        focus:outline-none
        focus:ring-2
        focus:ring-amber-400/20
        "
      />

      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="
            absolute right-2 top-1/2
            flex h-8 w-8 -translate-y-1/2
            items-center justify-center
            rounded-lg
            text-muted
            transition
            hover:bg-white/10
            hover:text-gray-500
            focus:outline-none
            focus:ring-2
          "
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
