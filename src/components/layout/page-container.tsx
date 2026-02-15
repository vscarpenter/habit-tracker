"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8",
          className
        )}
        {...props}
      />
    );
  }
);

PageContainer.displayName = "PageContainer";

export { PageContainer };
