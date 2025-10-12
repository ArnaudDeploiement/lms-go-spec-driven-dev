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
          "bg-[var(--card)] text-[var(--foreground)] shadow-[var(--soft-shadow-sm)] hover:shadow-[var(--soft-shadow)] active:shadow-[var(--soft-shadow-inset)]",
        primary:
          "bg-gradient-to-br from-[#92a1ff] via-[#7f8cff] to-[#4cc3ff] text-white shadow-[var(--soft-shadow)] hover:shadow-[var(--soft-shadow-lg)] active:shadow-[var(--soft-shadow-inset)]",
        secondary:
          "bg-[rgba(255,255,255,0.72)] text-[var(--muted-foreground)] shadow-[var(--soft-shadow-sm)] border border-[rgba(255,255,255,0.5)] hover:text-[var(--foreground)] hover:shadow-[var(--soft-shadow)] active:shadow-[var(--soft-shadow-inset)]",
        outline:
          "bg-transparent border border-[rgba(186,176,224,0.3)] text-[var(--foreground)] shadow-[var(--soft-shadow-sm)] hover:shadow-[var(--soft-shadow)] active:shadow-[var(--soft-shadow-inset)]",
        destructive:
          "bg-gradient-to-br from-[#ff9aa5] to-[#ff6b92] text-white shadow-[var(--soft-shadow)] hover:shadow-[var(--soft-shadow-lg)] active:shadow-[var(--soft-shadow-inset)]",
        ghost:
          "bg-transparent text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.45)] hover:shadow-[var(--soft-shadow-sm)]",
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
