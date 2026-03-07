type BadgeVariant = "default" | "todo" | "progress" | "review" | "done" | "overdue";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-muted/15 text-muted shadow-sm",
  todo: "bg-status-todo/15 text-status-todo shadow-sm shadow-status-todo/10",
  progress: "bg-status-progress/15 text-status-progress shadow-sm shadow-status-progress/10",
  review: "bg-status-review/15 text-status-review shadow-sm shadow-status-review/10",
  done: "bg-status-done/15 text-status-done shadow-sm shadow-status-done/10",
  overdue: "bg-status-overdue/15 text-status-overdue shadow-sm shadow-status-overdue/10",
};

export default function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
