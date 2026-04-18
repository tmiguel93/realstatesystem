function resolveApiOrigin() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";
  return apiBaseUrl.endsWith("/api") ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
}

export function resolveAssetUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${resolveApiOrigin()}${value.startsWith("/") ? value : `/${value}`}`;
}
