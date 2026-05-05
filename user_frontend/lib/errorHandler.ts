/**
 * Consolidated error message extraction from various API response formats
 * Handles multiple response structures (message, data.message, data.error, error)
 */
export function extractErrorMessage(response: any): string {
  if (!response) return "An error occurred";

  return (
    response?.message ||
    response?.data?.message ||
    response?.data?.error ||
    response?.error ||
    "An unexpected error occurred"
  );
}

/**
 * Consolidated error message extraction specifically for axios/fetch errors
 */
export function extractApiErrorMessage(error: any): string {
  if (!error) return "An error occurred";

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "An error occurred while communicating with the server"
  );
}

/**
 * Format API response message with fallback
 */
export function getApiMessage(
  response: any,
  fallback: string = "Operation completed"
): string {
  return extractErrorMessage(response) || fallback;
}
