import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

type CardVariant = "default" | "bordered" | "glow" | "glow-accent2" | "flat";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

const variants: Record<CardVariant, string> = {
  default:
    "bg-surface border border-border",
  bordered:
    "bg-surface border border-border hover:border-accent/30 transition-colors duration-200",
  glow:
    "bg-surface border border-accent/20 shadow-[0_0_24px_rgba(0,230,118,0.08)] hover:border-accent/40 hover:shadow-[0_0_32px_rgba(0,230,118,0.14)] transition-all duration-300",
  "glow-accent2":
    "bg-surface border border-accent-2/20 shadow-[0_0_24px_rgba(41,121,255,0.08)] hover:border-accent-2/40 hover:shadow-[0_0_32px_rgba(41,121,255,0.14)] transition-all duration-300",
  flat:
    "bg-surface-2 border-0",
};

const paddings = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      hoverable = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl",
          variants[variant],
          paddings[padding],
          hoverable && "cursor-pointer active:scale-[0.99] transition-transform duration-150",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/* ── Subcomponents ── */

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between mb-4", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display font-semibold text-text text-lg leading-tight", className)}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("text-muted text-sm", className)} {...props}>
      {children}
    </div>
  )
);
CardBody.displayName = "CardBody";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between mt-4 pt-4 border-t border-border", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardBody, CardFooter };
export type { CardProps, CardVariant };
