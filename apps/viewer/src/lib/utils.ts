import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatMs(ms: number) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

export function formatDuration(start: number, end?: number) {
    if (!end) return 'Running...';
    return formatMs(end - start);
}

export function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString();
}

export function formatDateTime(timestamp: number) {
    return new Date(timestamp).toLocaleString();
}
