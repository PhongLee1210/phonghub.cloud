import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

export interface SocialButtonProps
  extends Omit<React.ComponentProps<typeof Link>, "aria-label"> {
  "aria-label": string;
  icon?: IconType;
  iconClassName?: string;
  external?: boolean;
}

export const SocialButton = React.forwardRef<
  HTMLAnchorElement,
  SocialButtonProps
>(
  (
    {
      href,
      "aria-label": ariaLabel,
      icon: Icon,
      iconClassName,
      children,
      external = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Link
        ref={ref}
        href={href}
        aria-label={ariaLabel}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className={cn(
          "cursor-pointer rounded-sm p-2 text-muted-foreground transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        {...props}
      >
        {Icon ? <Icon className={cn("h-5 w-5", iconClassName)} /> : children}
      </Link>
    );
  }
);

SocialButton.displayName = "SocialButton";
