import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[26px] border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.78)] px-4 py-2 text-sm text-[var(--foreground)] shadow-[var(--soft-shadow-inset)] placeholder:text-[var(--muted-foreground)] transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(255,255,255,0.6)] disabled:cursor-not-allowed disabled:opacity-60",
          className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
