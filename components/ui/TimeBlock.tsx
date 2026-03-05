"use client";

import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

type TimeBlockState = "available" | "taken" | "selected" | "disabled" | "pending";

interface TimeBlockProps extends HTMLAttributes<HTMLButtonElement> {
  startTime: string;
  endTime: string;
  state?: TimeBlockState;
  price?: number;
  as?: "button" | "div";
}

const stateConfig: Record<
  TimeBlockState,
  { classes: string; label: string }
> = {
  available: {
    classes:
      "bg-surface border border-border text-text hover:border-accent/50 hover:bg-accent/5 hover:shadow-[0_0_12px_rgba(0,230,118,0.1)] cursor-pointer",
    label: "Disponible",
  },
  selected: {
    classes:
      "bg-accent/10 border border-accent text-accent shadow-[0_0_16px_rgba(0,230,118,0.2)] cursor-pointer",
    label: "Seleccionado",
  },
  taken: {
    classes:
      "bg-surface-2/50 border border-border/50 text-muted/50 cursor-not-allowed",
    label: "Ocupado",
  },
  pending: {
    classes:
      "bg-amber-500/5 border border-amber-500/30 text-amber-400/70 cursor-not-allowed",
    label: "Pendiente",
  },
  disabled: {
    classes:
      "bg-surface-2/30 border border-border/30 text-muted/30 cursor-not-allowed",
    label: "No disponible",
  },
};

const TimeBlock = forwardRef<HTMLButtonElement, TimeBlockProps>(
  (
    {
      startTime,
      endTime,
      state = "available",
      price,
      as: Tag = "button",
      className,
      ...props
    },
    ref
  ) => {
    const config = stateConfig[state];
    const isInteractive = state === "available" || state === "selected";

    return (
      <button
        ref={ref}
        type="button"
        disabled={!isInteractive}
        aria-label={`${startTime} - ${endTime} · ${config.label}`}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg px-3 py-2.5 transition-all duration-150 select-none",
          "min-w-[80px] gap-0.5",
          isInteractive && "active:scale-[0.97]",
          config.classes,
          className
        )}
        {...props}
      >
        {/* Time range */}
        <span className="font-mono text-xs font-medium leading-none whitespace-nowrap">
          {startTime}
        </span>
        <span className="font-mono text-[10px] text-muted leading-none">
          {endTime}
        </span>

        {/* Price */}
        {price !== undefined && state !== "taken" && state !== "disabled" && (
          <span
            className={cn(
              "mt-1 font-mono text-[10px] font-semibold leading-none",
              state === "selected" ? "text-accent" : "text-muted"
            )}
          >
            ${price.toLocaleString()}
          </span>
        )}

        {/* Taken overlay label */}
        {state === "taken" && (
          <span className="mt-1 text-[9px] font-sans uppercase tracking-widest text-muted/40 leading-none">
            ocupado
          </span>
        )}

        {/* Selected checkmark */}
        {state === "selected" && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-background">
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 5l2.5 2.5L8 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </button>
    );
  }
);

TimeBlock.displayName = "TimeBlock";

export { TimeBlock };
export type { TimeBlockProps, TimeBlockState };
