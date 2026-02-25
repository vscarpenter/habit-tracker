"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type PageContainerProps = React.HTMLAttributes<HTMLDivElement>;

const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full max-w-[1260px] px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
          "relative",
          className
        )}
        {...props}
      />
    );
  }
);

PageContainer.displayName = "PageContainer";

export { PageContainer };
