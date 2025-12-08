import { RowEntry } from "./types";

export interface FlattenedRow {
  [key: string]: string | number | boolean | null;
}

/**
 * Processes raw JSON data into RowEntry[][] format
 * @param json - Raw JSON data (can be array or object)
 * @returns Array of arrays of RowEntry objects
 */
export function processJsonData(json: any): RowEntry[][] {
  // If it's already in the correct format, return it
  if (Array.isArray(json) && json.length > 0 && Array.isArray(json[0])) {
    return json as RowEntry[][];
  }

  // If it's an array of objects, convert each object to RowEntry[]
  if (Array.isArray(json)) {
    return json.map((item) => {
      if (typeof item === "object" && item !== null) {
        return Object.entries(item).map(([key, value]) => ({
          col: key,
          value: value as string | number | boolean | null,
        }));
      }
      return [];
    });
  }

  // If it's a single object, wrap it
  if (typeof json === "object" && json !== null) {
    return [
      Object.entries(json).map(([key, value]) => ({
        col: key,
        value: value as string | number | boolean | null,
      })),
    ];
  }

  return [];
}

/**
 * Flattens nested RowEntry[][] data into a table-ready format
 * Each inner RowEntry[] array represents one form submission
 * Nested objects (like display_information) are spread into the parent row
 * 
 * @param rowEntries - Array of arrays of RowEntry objects from jsonReader
 * @returns Array of FlattenedRow objects, one per form submission
 */
export function flattenData(rowEntries: RowEntry[][]): FlattenedRow[] {
  return rowEntries.map((formEntries) => {
    const flatRow: FlattenedRow = {};
    
    formEntries.forEach((entry) => {
      const { col, value } = entry;
      
      // If the value is an object, spread its properties
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          flatRow[nestedKey] = nestedValue;
        });
      } else {
        // Otherwise, just add the value directly
        flatRow[col] = value;
      }
    });
    
    return flatRow;
  });
}

/**
 * Extracts all unique column names from the flattened data
 * Useful for creating table headers
 * 
 * @param data - Array of FlattenedRow objects
 * @returns Array of unique column names
 */
export function getColumns(data: FlattenedRow[]): string[] {
  const columnSet = new Set<string>();
  
  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      columnSet.add(key);
    });
  });
  
  return Array.from(columnSet);
}
