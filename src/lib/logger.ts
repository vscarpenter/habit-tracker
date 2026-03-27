const IS_DEV = process.env.NODE_ENV === "development";

export const logger = {
  error(message: string, context?: unknown): void {
    console.error(message, context);
  },
  warn(message: string, context?: unknown): void {
    console.warn(message, context);
  },
  info(message: string, context?: unknown): void {
    if (IS_DEV) console.info(message, context);
  },
  debug(message: string, context?: unknown): void {
    if (IS_DEV) console.debug(message, context);
  },
};
