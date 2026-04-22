/**
 * Utility functions for the Lost & Found System
 * 
 * @module utils
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges Tailwind CSS classes intelligently
 * Resolves conflicts between classes and handles conditional classes
 * 
 * @param inputs - Array of class values (strings, objects, arrays)
 * @returns Merged className string optimized for Tailwind
 * 
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4' (px-4 overrides px-2)
 * cn('text-red-500', condition && 'text-blue-500') // Conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
