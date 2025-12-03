export function formatWhen(
  iso: string,
  format?: Intl.DateTimeFormatOptions | "short" | "medium" | "long" | "mmddyyyy"
) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;

    const presets: Record<string, Intl.DateTimeFormatOptions> = {
      short: { year: "numeric", month: "short", day: "2-digit" },
      medium: {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      },
      long: {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      },
    };

    // special-cased manual format to guarantee MM/DD/YYYY hh:mm AM/PM
    if (format === "mmddyyyy") {
      const pad = (n: number) => n.toString().padStart(2, "0");
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const yyyy = d.getFullYear();
      let hours = d.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12; // convert 0 -> 12
      const hh = pad(hours);
      const min = pad(d.getMinutes());
      return `${mm}/${dd}/${yyyy} ${hh}:${min} ${ampm}`;
    }

    let opts: Intl.DateTimeFormatOptions;
    if (!format) {
      opts = presets.medium;
    } else if (typeof format === "string") {
      opts = presets[format] ?? presets.medium;
    } else {
      opts = format;
    }

    return d.toLocaleString(undefined, opts);
  } catch {
    return iso;
  }
}

/**
 * Time ago formatter
 *
 * @param fromDateString
 * @returns
 */
export const formatTimeAgo = (fromDateString: string) => {
  const from = new Date(fromDateString).getTime();
  const to = new Date().getTime();

  const seconds = Math.floor((to - from) / 1000);

  const intervals = [
    { label: "y", seconds: 31536000 }, // 365 * 24 * 60 * 60
    { label: "mo", seconds: 2592000 }, // 30 * 24 * 60 * 60
    { label: "w", seconds: 604800 }, // 7 * 24 * 60 * 60
    { label: "d", seconds: 86400 }, // 24 * 60 * 60
    { label: "h", seconds: 3600 }, // 60 * 60
    { label: "min", seconds: 60 },
    { label: "s", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label} ago`;
    }
  }

  return "just now";
};
