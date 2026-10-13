// Centralized time formatting utilities with timezone support
// Safe for client and server use
/**
 * Format a datetime string to display time in user's timezone
 * @param dateTimeString - ISO datetime string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted time string
 */
export function formatTime(
  dateTimeString: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) {
    return "Invalid Time";
  }
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  return date.toLocaleTimeString([], { ...defaultOptions, ...options });
}
/**
 * Format a datetime string to display date in user's timezone
 * @param dateTimeString - ISO datetime string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export function formatDate(
  dateTimeString: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  return date.toLocaleDateString([], { ...defaultOptions, ...options });
}
/**
 * Format a datetime string to display both date and time in user's timezone
 * @param dateTimeString - ISO datetime string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date and time string
 */
export function formatDateTime(
  dateTimeString: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) {
    return "Invalid Date/Time";
  }
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  return date.toLocaleString([], { ...defaultOptions, ...options });
}
/**
 * Get current time in user's timezone
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted current time string
 */
export function getCurrentTime(options?: Intl.DateTimeFormatOptions): string {
  const now = new Date();
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  return now.toLocaleTimeString([], { ...defaultOptions, ...options });
}
/**
 * Get current date in user's timezone
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted current date string
 */
export function getCurrentDate(options?: Intl.DateTimeFormatOptions): string {
  const now = new Date();
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  return now.toLocaleDateString([], { ...defaultOptions, ...options });
}
/**
 * Format a time-only string (HH:mm:ss) to display in user's timezone
 * This handles cases where we only have time without date
 * @param timeString - Time string in HH:mm:ss format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted time string
 */
export function formatTimeOnly(
  timeString: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  // Handle time-only strings by creating a date object for today
  let dateToFormat: Date;
  if (timeString.includes("T")) {
    // It's already a datetime string
    dateToFormat = new Date(timeString);
  } else {
    // It's a time string, convert to datetime for today
    const today = new Date();
    const [hours, minutes, seconds = "00"] = timeString.split(":");
    dateToFormat = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds),
    );
  }
  if (isNaN(dateToFormat.getTime())) {
    return "Invalid Time";
  }
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  return dateToFormat.toLocaleTimeString([], { ...defaultOptions, ...options });
}
/**
 * Get user's timezone
 * @returns User's timezone string
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
/**
 * Check if a date is today in user's timezone
 * @param dateTimeString - ISO datetime string
 * @returns boolean indicating if the date is today
 */
export function isToday(dateTimeString: string): boolean {
  const date = new Date(dateTimeString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}
/**
 * Get relative time string (e.g., "2 hours ago", "yesterday")
 * @param dateTimeString - ISO datetime string
 * @returns Relative time string
 */
export function getRelativeTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  return formatDate(dateTimeString);
}
