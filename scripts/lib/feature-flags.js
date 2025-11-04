/**
 * Feature flag utilities shared between tests and workflow scripts.
 * Values follow GitHub Actions `vars.*` semantics where booleans are stringified.
 */
export function resolvePlanMode({
  manusEnabled = "true",
  degradedMode = "false",
  degradedFlagPresent = false,
} = {}) {
  if (manusEnabled === "false") {
    return "degraded";
  }
  if (degradedMode === "true") {
    return "degraded";
  }
  if (degradedFlagPresent) {
    return "degraded";
  }
  return "normal";
}

export function canDispatchToManus({
  developmentMode = "false",
  manusEnabled = "false",
  planMode = "degraded",
} = {}) {
  return developmentMode === "true" && manusEnabled === "true" && planMode !== "degraded";
}

export function normalizeBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "t", "yes", "y", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "f", "no", "n", "off"].includes(normalized)) {
    return false;
  }
  return defaultValue;
}
