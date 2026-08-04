type RoleLike = {
  id?: string;
  token_url?: string | null;
  custom_role?: boolean;
  type?: string | null;
  initial_alignment?: AlignmentLike | null;
};

type AlignmentLike = string;

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

  // Empty / transparent placeholders used before a role is chosen.
  // These must not be treated as custom art or they block role_id resolution.
  const isPlaceholderTokenUrl = (url?: string | null) => {
    const trimmed = url?.trim();
    return !trimmed || trimmed === "/1x1.png";
  };

  // Custom/homebrew art: explicit flag, or a non-placeholder URL outside /img/role.
  const isInferredCustomRole = (role?: RoleLike | null) => {
    if (!role) {
      return false;
    }
    if (role.custom_role != null) {
      return !!role.custom_role;
    }
    const trimmedTokenUrl = role.token_url?.trim();
    if (isPlaceholderTokenUrl(trimmedTokenUrl)) {
      return false;
    }
    return !isRoleAssetUrl(trimmedTokenUrl);
  };

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
  // Non-custom roles are always resolved by id to avoid stale token_url values.
  const roleBaseUrlFromRole = (role?: RoleLike | null) => {
    if (!role) {
      return undefined;
    }
    const trimmedTokenUrl = role.token_url?.trim();
    if (isInferredCustomRole(role)) {
      return trimmedTokenUrl;
    }
    return (
      roleBaseUrlFromId(role.id) ??
      (isPlaceholderTokenUrl(trimmedTokenUrl) ? undefined : trimmedTokenUrl)
    );
  };

  // Resolve from role + optional character-level role_id (demon bluffs/fabled).
  const resolveRoleBaseUrl = (
    role?: RoleLike | null,
    roleId?: string | null
  ) => {
    if (isInferredCustomRole(role)) {
      return role?.token_url?.trim();
    }
    const trimmedTokenUrl = role?.token_url?.trim();
    return (
      roleBaseUrlFromId(role?.id) ??
      roleBaseUrlFromId(roleId) ??
      (isPlaceholderTokenUrl(trimmedTokenUrl) ? undefined : trimmedTokenUrl)
    );
  };

  // Alignment variants are encoded by suffix for local assets (_g/_e).
  const alignmentSuffix = (
    role?: { initial_alignment?: AlignmentLike | null; type?: string | null } | null,
    alignment?: AlignmentLike | null
  ) => {
    if (!role || !alignment || alignment === "NEUTRAL") {
      return "";
    }
    if (role.type === "FABLED" || role.type === "LORIC") {
      return "";
    }
    const inferredInitial =
      role.initial_alignment ??
      (role.type === "TRAVELER"
        ? "NEUTRAL"
        : role.type === "TOWNSFOLK" || role.type === "OUTSIDER"
        ? "GOOD"
        : role.type === "MINION" || role.type === "DEMON"
        ? "EVIL"
        : "NEUTRAL");

    if (inferredInitial === "NEUTRAL") {
      return alignment === "GOOD" ? "_g" : "_e";
    }
    if (inferredInitial && inferredInitial !== alignment) {
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
    isInferredCustomRole,
    isPlaceholderTokenUrl,
    isRoleAssetUrl,
    normalizeRoleId,
    resolveRoleBaseUrl,
    roleBaseUrlFromId,
    roleBaseUrlFromRole,
    sizeAdjustedUrl,
    withAssetVersion,
  };
};
