export function normalizedForumText(body: string) {
  return body.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

export function screeningReason(body: string, newcomer: boolean): string | null {
  const links = body.match(/https?:\/\/[^\s)\]>]+/gi) ?? [];
  if (links.length > (newcomer ? 1 : 5)) return "Link limit exceeded. A moderator will review this contribution.";
  if (newcomer) return "First contributions are reviewed to protect the community from spam.";
  return null;
}

