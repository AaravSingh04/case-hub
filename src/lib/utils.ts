import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DeadlineStatus } from "./db/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates deadline status based on the non-negotiable rules:
 * - More than seven days remaining: Upcoming
 * - Seven days or fewer remaining: Closing Soon
 * - Registration deadline passed: Closed
 */
export function getDeadlineStatus(deadlineIso: string): DeadlineStatus {
  const now = new Date();
  const deadline = new Date(deadlineIso);

  // If invalid date, return closed
  if (isNaN(deadline.getTime())) {
    return 'closed';
  }

  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs < 0) {
    return 'closed';
  }

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) {
    return 'closing_soon';
  }

  return 'upcoming';
}

/**
 * Calculates human readable days remaining
 */
export function getDaysRemainingText(deadlineIso: string): {
  days: number;
  text: string;
  isUrgent: boolean;
  isClosed: boolean;
} {
  const now = new Date();
  const deadline = new Date(deadlineIso);

  if (isNaN(deadline.getTime())) {
    return { days: 0, text: "Closed", isUrgent: false, isClosed: true };
  }

  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs < 0) {
    return { days: 0, text: "Registration Closed", isUrgent: false, isClosed: true };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24) {
    return {
      days: 1,
      text: `${Math.max(1, diffHours)} hour${diffHours === 1 ? '' : 's'} remaining`,
      isUrgent: true,
      isClosed: false,
    };
  }

  if (diffDays === 1) {
    return { days: 1, text: "1 day remaining", isUrgent: true, isClosed: false };
  }

  if (diffDays <= 7) {
    return { days: diffDays, text: `${diffDays} days remaining`, isUrgent: true, isClosed: false };
  }

  return { days: diffDays, text: `${diffDays} days remaining`, isUrgent: false, isClosed: false };
}

export function formatDate(isoString?: string): string {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isValidUrl(urlString?: string): boolean {
  if (!urlString) return false;
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}
