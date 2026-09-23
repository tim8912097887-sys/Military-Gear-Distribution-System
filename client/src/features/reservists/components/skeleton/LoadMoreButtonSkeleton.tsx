export function LoadMoreButtonSkeleton() {
  return (
    <button
      type="button"
      disabled
      className="
                mt-4 w-full rounded-xl
                border border-white/10
                bg-white/4
                px-4 py-3
                text-sm font-semibold
                text-paper
                transition
                hover:bg-white/8
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
    >
      "Load more reservists"
    </button>
  );
}
