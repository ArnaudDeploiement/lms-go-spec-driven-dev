import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-wide transition-all duration-200 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const buttonVariants = cva(
  buttonBase,
  {
    variants: {
      variant: {
        default:
          "bg-white text-[var(--accent-secondary)] border border-[var(--border)] shadow-[var(--soft-shadow-sm)] hover:-translate-y-[1px] hover:border-[var(--border-strong)] hover:shadow-[var(--soft-shadow)] active:translate-y-0 active:shadow-[var(--soft-shadow-inset)]",
        primary:
          "bg-[var(--accent-secondary)] text-white border border-transparent shadow-[var(--soft-shadow)] hover:bg-[#151d26] hover:shadow-[var(--soft-shadow-lg)] active:bg-[#1b242d] active:shadow-[var(--soft-shadow-inset)]",
        secondary:
          "bg-[var(--background-muted)] text-[var(--accent-secondary)] border border-[var(--border)] shadow-sm hover:-translate-y-[1px] hover:border-[var(--border-strong)] hover:bg-white",
        outline:
          "bg-transparent border border-[var(--accent-secondary)] text-[var(--accent-secondary)] hover:bg-[rgba(31,41,51,0.05)]",
        destructive:
          "bg-[var(--accent-error)] text-white border border-transparent shadow-[var(--soft-shadow-sm)] hover:bg-[#b73536] hover:shadow-[var(--soft-shadow)]",
        ghost:
          "bg-transparent text-[var(--accent-secondary)] hover:bg-[rgba(31,41,51,0.05)]",
        link: "bg-transparent text-[var(--accent-primary)] underline-offset-4 hover:underline px-0 shadow-none"
      },
      size: {
        default: "h-10 px-5 text-sm",
        sm: "h-8 px-4 text-xs",
        lg: "h-11 px-7 text-base",
        icon: "h-10 w-10"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
