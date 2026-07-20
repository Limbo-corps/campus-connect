// @/lib/debug.ts

export const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

export function debug(...args: unknown[]): void {
  if (DEBUG) {
    console.log(...args);
  }
}

export function debugGroup(...args: unknown[]): void {
  if (!DEBUG) return;
  console.group(...args);
  args.forEach((arg) => console.log(arg));
  console.groupEnd();
}
