type ReservistStatusBadgeProps = {
  checkedIn: boolean;
};

export function ReservistStatusBadge({ checkedIn }: ReservistStatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-sm font-medium ${
        checkedIn
          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
          : "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
      }`}
    >
      <span
        className={`mr-2 h-2 w-2 rounded-full ${
          checkedIn ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />

      {checkedIn ? "Checked in" : "Not checked in"}
    </span>
  );
}
