//global interface
export interface RowEntry {
  col: string;
  value: string | number | boolean | null | Record<string, any>;
}
