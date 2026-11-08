import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Pill buttons, same as the site's .btn (ink default, lavender "accent", white, ghost outline)
const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90",
        accent: "bg-[hsl(var(--lavender))] text-[#272038] hover:brightness-95",
        white: "bg-white text-[#272038] hover:bg-white/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background/60 backdrop-blur hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "rounded-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-7 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** The site's dual-label hover: the label slides up and a copy slides in. Default on for filled/outline buttons. */
  slide?: boolean
}

const slideBase =
  "col-start-1 row-start-1 inline-flex items-center justify-center gap-2 transition-[transform,opacity] duration-300 [transition-timing-function:cubic-bezier(.22,1,.36,1)]"

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, slide, children, ...props }, ref) => {
    const v = variant ?? "default"
    const s = size ?? "default"
    const useSlide = !asChild && (slide ?? (v !== "ghost" && v !== "link" && s !== "icon"))
    const Comp = asChild ? Slot : "button"
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {useSlide ? (
          <span className="inline-grid overflow-hidden">
            <span className={cn(slideBase, "group-hover/btn:-translate-y-full group-hover/btn:opacity-0")}>{children}</span>
            <span aria-hidden="true" className={cn(slideBase, "translate-y-full opacity-0 group-hover/btn:translate-y-0 group-hover/btn:opacity-100")}>{children}</span>
          </span>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
