import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

type BadgeStatus = "pending" | "approved" | "rejected" | "cancelled" | "active";
type BadgeVariant = "status" | "default" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
  variant?: BadgeVariant;
  dot?: boolean;
}

const statusConfig: Record<
  BadgeStatus,
  { label: string; classes: string; dotColor: string }
> = {
  pending: {
    label: "Pendiente",
    classes: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dotColor: "bg-amber-400",
  },
  approved: {
    label: "Aprobado",
    classes: "bg-accent/10 text-accent border border-accent/20",
    dotColor: "bg-accent",
  },
  rejected: {
    label: "Rechazado",
    classes: "bg-red-500/10 text-red-400 border border-red-500/20",
    dotColor: "bg-red-400",
  },
  cancelled: {
    label: "Cancelado",
    classes: "bg-muted/10 text-muted border border-muted/20",
    dotColor: "bg-muted",
  },
  active: {
    label: "Activo",
    classes: "bg-accent-2/10 text-accent-2 border border-accent-2/20",
    dotColor: "bg-accent-2",
  },
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ status, variant = "status", dot = true, className, children, ...props }, ref) => {
    const config = status ? statusConfig[status] : null;

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium font-sans leading-none",
          config ? config.classes : "bg-surface-2 text-muted border border-border",
          className
        )}
        {...props}
      >
        {dot && config && (
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full shrink-0",
              config.dotColor,
              status === "pending" && "animate-pulse"
            )}
          />
        )}
        {children ?? config?.label}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
export type { BadgeProps, BadgeStatus };
