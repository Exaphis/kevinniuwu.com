export function normalizeDate(date: string) {
  return date
    .split("-")
    .map((part) => part.padStart(2, "0"))
    .join("-");
}

export function formatDate(date: string) {
  return new Date(`${normalizeDate(date)}T12:00:00Z`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    },
  );
}
