import { format } from "date-fns";

/**
 * Formats a date in a readable format (e.g., "January 1, 2023")
 */
export function formatDate(date: Date): string {
  return format(date, "MMMM d, yyyy");
}

/**
 * Formats a date with time in a readable format (e.g., "January 1, 2023 at 12:00 PM")
 */
export function formatDateTime(date: Date): string {
  return format(date, "MMMM d, yyyy 'at' h:mm a");
}

/**
 * Converts a status string to a proper case display string
 */
export function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Generates priority color classes based on priority level
 */
export function getPriorityColorClass(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
      return "text-red-600";
    case "medium":
      return "text-amber-600";
    case "low":
      return "text-blue-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Formats a case ID for display (e.g., "#001" for case with ID 1)
 */
export function formatCaseId(id: number): string {
  return `#${id.toString().padStart(3, "0")}`;
}