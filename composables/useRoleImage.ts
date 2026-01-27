type RoleLike = {
  id?: string;
  token_url?: string;
  custom_role?: boolean;
};

type AlignmentLike = "GOOD" | "EVIL" | "NEUTRAL";

export const useRoleImage = () => {
  const {
    public: { assetVersion },
  } = useRuntimeConfig();

  // Normalize role ids so they match local asset filenames.
  // Role IDs in db use both - and _ but filenames use neither.
  const normalizeRoleId = (id?: string | null) => id?.replace(/[_-]/g, "");

  // Local role assets live under /img/role.
  const isRoleAssetUrl = (url?: string) =>
    url?.startsWith("/img/role/") ?? false;

  // Append the cache-bust param when configured.
  const withAssetVersion = (url?: string) => {
    if (!url || !assetVersion) {
      return url;
    }
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}v=${assetVersion}`;
  };

  // Build a base URL from a role id.
  const roleBaseUrlFromId = (roleId?: string | null) => {
    const normalizedId = normalizeRoleId(roleId);
    if (!normalizedId) {
      return undefined;
    }
    return `/img/role/${normalizedId}`;
  };

  // Resolve a role to its base URL. Custom roles keep their explicit URL.
  const roleBaseUrlFromRole = (role?: RoleLike) => {
    if (!role) {
      return undefined;
    }
    if (role.custom_role && role.token_url) {
      return role.token_url;
    }
    return roleBaseUrlFromId(role.id) ?? role.token_url;
  };

  // Alignment variants are encoded by suffix for local assets (_g/_e).
  const alignmentSuffix = (
    role?: { initial_alignment?: AlignmentLike },
    alignment?: AlignmentLike
  ) => {
    if (!role || !alignment || alignment === "NEUTRAL") {
      return "";
    }
    if (role.initial_alignment === "NEUTRAL") {
      return alignment === "GOOD" ? "_g" : "_e";
    }
    if (role.initial_alignment && role.initial_alignment !== alignment) {
      return alignment === "GOOD" ? "_g" : "_e";
    }
    return "";
  };

  // Build final image URL: size folder + extension + cache-bust.
  const sizeAdjustedUrl = (
    url?: string,
    size?: "sm" | "reminder" | "md" | "front" | "lg",
    extension = "webp"
  ) => {
    if (!url) {
      return url;
    }
    if (!isRoleAssetUrl(url)) {
      return withAssetVersion(url);
    }

    const normalized = url.replace(/\.(png|webp)$/i, "");

    const sizeFolder =
      size === "sm"
        ? "48x48"
        : size === "reminder"
        ? "80x80"
        : size === "md"
        ? "80x80"
        : size === "front"
        ? "160x160"
        : size === "lg"
        ? "160x160"
        : undefined;

    let adjusted = normalized;
    if (sizeFolder) {
      adjusted = adjusted.replace("/img/role/", `/img/role/${sizeFolder}/`);
    }

    adjusted = `${adjusted}.${extension}`;

    return withAssetVersion(adjusted);
  };

  return {
    alignmentSuffix,
    isRoleAssetUrl,
    normalizeRoleId,
    roleBaseUrlFromId,
    roleBaseUrlFromRole,
    sizeAdjustedUrl,
    withAssetVersion,
  };
};
