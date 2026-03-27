import { SignJWT, importPKCS8 } from "jose";
import { createPrivateKey } from "node:crypto";

// Cached installation token
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Generate a JWT for GitHub App authentication.
 * The JWT is signed with the App's private key and is valid for 10 minutes.
 */
async function generateAppJWT(): Promise<string> {
  const config = useRuntimeConfig();
  const appId = config.githubAppId;
  const privateKeyBase64 = config.githubPrivateKey;

  if (!appId || !privateKeyBase64) {
    throw new Error("GitHub App credentials not configured");
  }

  const privateKeyPem = Buffer.from(privateKeyBase64, "base64").toString(
    "utf-8"
  );

  // GitHub generates PKCS#1 keys (BEGIN RSA PRIVATE KEY), but jose
  // requires PKCS#8 (BEGIN PRIVATE KEY). Convert if needed using Node crypto.
  let privateKey;
  if (privateKeyPem.includes("BEGIN RSA PRIVATE KEY")) {
    const keyObject = createPrivateKey(privateKeyPem);
    const pkcs8Pem = keyObject.export({ type: "pkcs8", format: "pem" }) as string;
    privateKey = await importPKCS8(pkcs8Pem, "RS256");
  } else {
    privateKey = await importPKCS8(privateKeyPem, "RS256");
  }

  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now - 60) // 60s clock skew allowance
    .setExpirationTime(now + 600) // 10 min max
    .setIssuer(appId)
    .sign(privateKey);
}

/**
 * Get an installation access token, using a cached value if still valid.
 * Tokens are cached for 55 minutes (GitHub grants 1 hour).
 */
async function getInstallationToken(): Promise<string> {
  const config = useRuntimeConfig();
  const installationId = config.githubInstallationId;
  if (!installationId) {
    throw new Error("GitHub installation ID not configured");
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const jwt = await generateAppJWT();
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub token exchange failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { token: string };
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + 55 * 60 * 1000, // cache for 55 min
  };

  return data.token;
}

/**
 * Make an authenticated request to the GitHub API.
 */
export async function githubApiFetch<T = any>(
  path: string,
  options: { method?: string; body?: any } = {}
): Promise<T> {
  const token = await getInstallationToken();

  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

// In-memory cache for GitHub link previews
const previewCache = new Map<string, { data: any; expiresAt: number }>();
const PREVIEW_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedGitHubPreview(
  owner: string,
  repo: string,
  type: "issues" | "pulls",
  number: number
): Promise<any> {
  const key = `${owner}/${repo}/${type}/${number}`;
  const cached = previewCache.get(key);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // GitHub uses /issues endpoint for both issues and PRs
  const path = `/repos/${owner}/${repo}/issues/${number}`;
  const data = await githubApiFetch(path);

  const preview = {
    title: data.title,
    number: data.number,
    state: data.state,
    is_pull_request: !!data.pull_request,
    author: data.user?.login,
    author_avatar: data.user?.avatar_url,
    created_at: data.created_at,
    labels: data.labels?.map((l: any) => ({
      name: l.name,
      color: l.color,
    })),
    comments: data.comments,
  };

  previewCache.set(key, { data: preview, expiresAt: Date.now() + PREVIEW_CACHE_TTL });

  // Evict old entries periodically
  if (previewCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of previewCache) {
      if (now > v.expiresAt) previewCache.delete(k);
    }
  }

  return preview;
}
