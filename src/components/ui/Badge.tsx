type BadgeVariant = "default" | "todo" | "progress" | "review" | "done" | "overdue";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-muted/20 text-muted",
  todo: "bg-status-todo/20 text-status-todo",
  progress: "bg-status-progress/20 text-status-progress",
  review: "bg-status-review/20 text-status-review",
  done: "bg-status-done/20 text-status-done",
  overdue: "bg-status-overdue/20 text-status-overdue",
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
