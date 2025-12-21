/**
 * Capitalize the first letter of a string
 * @param str The string to capitalize
 * @returns The capitalized string
 */
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Capitalize the first letter of each word in a string
 * Splits by underscores and spaces, capitalizes each word, and rejoins with spaces
 * @param str The string to capitalize (e.g., 'form_field', 'form field', 'form_phantom_field')
 * @returns Capitalized string (e.g., 'Form Field', 'Form Field', 'Form Phantom Field')
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return str;
  return str
    .split(/[_\s]+/) // Split by underscores or spaces
    .map((word) => capitalize(word))
    .filter((word) => word.length > 0) // Remove empty strings
    .join(" ");
};
