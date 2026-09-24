"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Check, Loader2 } from "lucide-react";
import { useRef, useState, type ButtonHTMLAttributes, type PointerEvent } from "react";
import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-bold transition-[transform,background-color,filter,opacity,box-shadow] duration-100 select-none touch-manipulation [-webkit-tap-highlight-color:transparent] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-emerald-500 text-black hover:bg-emerald-400",
        inverse: "bg-white text-black hover:bg-emerald-100",
        secondary: "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white",
        ghost: "text-gray-400 hover:text-white hover:bg-white/5",
        chip: "border border-white/10 bg-white/5 text-emerald-300 hover:bg-white/10",
      },
      size: {
        md: "px-4 py-2.5 text-sm",
        lg: "w-full px-4 py-3 text-base",
        icon: "p-2",
        compact: "px-3 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles> & {
    busy?: boolean;
    success?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  busy = false,
  success = false,
  disabled,
  children,
  type = "button",
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  ...props
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const releaseTimer = useRef<number>(0);

  function press(event: PointerEvent<HTMLButtonElement>) {
    window.clearTimeout(releaseTimer.current);
    setPressed(true);
    onPointerDown?.(event);
  }

  function release(event?: PointerEvent<HTMLButtonElement>) {
    window.clearTimeout(releaseTimer.current);
    releaseTimer.current = window.setTimeout(() => setPressed(false), 140);
    if (event?.type === "pointerup") onPointerUp?.(event);
    if (event?.type === "pointerleave") onPointerLeave?.(event);
    if (event?.type === "pointercancel") onPointerCancel?.(event);
  }

  return (
    <button
      type={type}
      {...props}
      disabled={disabled || busy}
      aria-busy={busy}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      className={cn(
        buttonStyles({ variant, size }),
        pressed && "scale-[0.95] brightness-75 shadow-inner",
        className,
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {success && !busy ? <Check className="h-4 w-4" aria-hidden /> : null}
      {children}
    </button>
  );
}

export { buttonStyles };
