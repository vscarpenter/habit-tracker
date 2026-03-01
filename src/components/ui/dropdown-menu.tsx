"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext(): DropdownContextValue {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within a DropdownMenu");
  }
  return context;
}

export interface DropdownMenuProps {
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

function DropdownMenu({ children, onOpenChange }: DropdownMenuProps) {
  const [open, setOpenState] = useState(false);
  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
    onOpenChange?.(value);
  }, [onOpenChange]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    },
    []
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleClickOutside, handleKeyDown]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

const DropdownMenuTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { open, setOpen } = useDropdownContext();

  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={open}
      aria-haspopup="true"
      onClick={(e) => {
        setOpen(!open);
        onClick?.(e);
      }}
      className={cn("", className)}
      {...props}
    />
  );
});

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export interface DropdownMenuContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
}

const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "end", ...props }, ref) => {
    const { open } = useDropdownContext();
    const innerRef = useRef<HTMLDivElement>(null);
    const [flipUp, setFlipUp] = useState(false);

    useEffect(() => {
      if (!open || !innerRef.current) return;
      const el = innerRef.current;
      const rect = el.getBoundingClientRect();
      setFlipUp(rect.bottom > window.innerHeight - 8);
    }, [open]);

    if (!open) return null;

    return (
      <div
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        role="menu"
        className={cn(
          "absolute z-50 min-w-[160px] overflow-hidden rounded-xl",
          "bg-surface-paper/96 backdrop-blur-2xl border border-border-subtle shadow-[var(--shadow-editorial-lg)]",
          "p-1 animate-fade-in",
          flipUp ? "bottom-full mb-1" : "top-full mt-1",
          align === "start" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          align === "end" && "right-0",
          className
        )}
        {...props}
      />
    );
  }
);

DropdownMenuContent.displayName = "DropdownMenuContent";

export interface DropdownMenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
}

const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, destructive, onClick, ...props }, ref) => {
    const { setOpen } = useDropdownContext();

    return (
      <button
        ref={ref}
        role="menuitem"
        type="button"
        onClick={(e) => {
          onClick?.(e);
          setOpen(false);
        }}
        className={cn(
          "flex w-full items-center rounded-lg px-2 py-1.5 text-sm",
          "transition-colors duration-150 outline-none",
          destructive
            ? "text-error hover:bg-error/8"
            : "text-text-primary hover:bg-surface-tint/75",
          className
        )}
        {...props}
      />
    );
  }
);

DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn("-mx-1 my-1 h-px bg-border-subtle", className)}
    {...props}
  />
));

DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
