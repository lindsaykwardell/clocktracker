// "Nov 26" for dates this year, "Nov 26, 2025" otherwise: list rows don't
// need the current year repeated on every line.
export function formatShortDate(date: string | Date) {
  const value = new Date(date);
  const sameYear = value.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat(navigator.language, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(value);
}
