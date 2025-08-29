import { useMemo } from "react";

/**
 * Makes it easier to create filtered versions of data array.
 * @param data
 * @param filters
 * @returns
 */
export const useFilter = <T,>(data: T[], ...filters: { (i: T): boolean }[]) => {
  const filtered = useMemo(() => {
    let d = data;
    for (const filter of filters) d = d.filter(filter);
    return d;
  }, [data]);
  return filtered;
};
