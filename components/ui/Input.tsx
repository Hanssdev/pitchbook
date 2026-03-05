import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

/* ── Input ── */
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, startAdornment, endAdornment, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startAdornment && (
            <span className="absolute left-3 text-muted text-sm pointer-events-none">{startAdornment}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text placeholder:text-muted",
              "transition-colors duration-150",
              "focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/30",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              error && "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20",
              startAdornment && "pl-9",
              endAdornment && "pr-9",
              className
            )}
            {...props}
          />
          {endAdornment && (
            <span className="absolute right-3 text-muted text-sm pointer-events-none">{endAdornment}</span>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

/* ── Textarea ── */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text placeholder:text-muted",
            "transition-colors duration-150",
            "focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/30",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error && "border-red-500/50",
            className
          )}
          rows={4}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* ── Select ── */
interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text",
            "transition-colors duration-150 cursor-pointer",
            "focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/30",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error && "border-red-500/50",
            className
          )}
          {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
