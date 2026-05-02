// Convert ALL CAPS, lowercase, or mixed strings to Title Case.
// Preserves single-letter / 2-letter initials in upper case.
export function titleCase(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 2) return word.toUpperCase();
      // Handle hyphenated parts
      return word
        .split("-")
        .map(
          (p) =>
            p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(),
        )
        .join("-");
    })
    .join(" ");
}
