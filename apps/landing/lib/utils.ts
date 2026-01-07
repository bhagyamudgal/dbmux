import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Compose and merge Tailwind CSS class names.
 *
 * @param inputs - Class values (strings, arrays, or objects) compatible with `clsx`
 * @returns The merged class string with Tailwind utility conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}