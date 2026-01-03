/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-21
 * @ Description: Validation utility functions
 */

/**
 * Validates if a string is a valid email address
 * Uses a practical regex pattern that covers most common email formats
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") return false;

  // Practical email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates an email and returns an error message if invalid
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return { valid: false, error: "Email cannot be empty" };
  }

  if (!isValidEmail(trimmedEmail)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  return { valid: true };
};
