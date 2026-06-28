import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with proper precedence.
 * Combines clsx for conditional classes with tailwind-merge to handle class conflicts.
 *
 * @example
 * cn("px-2 py-1", condition && "px-4 py-2") // Returns "px-4 py-2" (conflict resolved)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
