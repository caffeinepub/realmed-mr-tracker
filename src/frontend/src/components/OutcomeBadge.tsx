interface OutcomeBadgeProps {
  outcome: string;
  size?: "sm" | "md";
}

export default function OutcomeBadge({
  outcome,
  size = "sm",
}: OutcomeBadgeProps) {
  const lower = outcome?.toLowerCase?.() ?? "neutral";
  const classes =
    lower === "positive"
      ? "outcome-positive"
      : lower === "negative"
        ? "outcome-negative"
        : "outcome-neutral";
  const label =
    lower === "positive"
      ? "Positive"
      : lower === "negative"
        ? "Negative"
        : "Neutral";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${classes} ${
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      }`}
    >
      {label}
    </span>
  );
}
