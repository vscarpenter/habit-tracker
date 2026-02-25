const IS_DEV = process.env.NODE_ENV === "development";

export const logger = {
  error(message: string, context?: unknown): void {
    if (IS_DEV) console.error(message, context);
  },
  warn(message: string, context?: unknown): void {
    if (IS_DEV) console.warn(message, context);
  },
};
