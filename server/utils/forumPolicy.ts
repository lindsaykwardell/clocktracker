export function normalizedForumText(body: string) {
  return body.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

export function accountYoungerThan(createdAt: Date | null, days: number, now = Date.now()) {
  return !createdAt || createdAt.getTime() > now - days * 86400000;
}

function externalLinks(text: string) {
  return text.match(/(?:https?:\/\/|www\.)[^\s)\]>]+/gi) ?? [];
}

export function screeningReason(body: string, newcomer: boolean) {
  if (externalLinks(body).length > 5) return "Link limit exceeded. A moderator will review this contribution.";
  if (newcomer) return "Posts from accounts less than 24 hours old need moderator approval.";
  return null;
}

export function editScreeningReason(body: string, previousBody: string, youngAccount: boolean) {
  const reason = screeningReason(body, false);
  if (reason) return reason;
  const previousLinks = new Set(externalLinks(previousBody));
  if (youngAccount && externalLinks(body).some(link => !previousLinks.has(link))) {
    return "Link additions and changes from accounts less than seven days old need moderator approval.";
  }
  return null;
}
