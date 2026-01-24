export type RedactedPart = {
  text: string;
  redacted: boolean;
};

export function getRedactedNameParts(name: string): RedactedPart[] {
  if (!name) return [];
  const parts: RedactedPart[] = [];
  const tokens = name.split(/(\s+)/);

  for (const token of tokens) {
    if (!token) continue;
    if (/^\s+$/.test(token)) {
      parts.push({ text: token, redacted: false });
      continue;
    }
    const firstChar = token[0] ?? "";
    const rest = token.slice(1);
    if (firstChar) {
      parts.push({ text: firstChar, redacted: false });
    }
    if (rest) {
      parts.push({ text: "x".repeat(rest.length), redacted: true });
    }
  }

  return parts;
}

export function getRedactedNameHtml(name: string, className = "redacted-name") {
  const parts = getRedactedNameParts(name);
  return parts
    .map((part) => {
      const text = escapeHtml(part.text);
      if (part.redacted) {
        return `<span class="${className}">${text}</span>`;
      }
      return text;
    })
    .join("");
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
