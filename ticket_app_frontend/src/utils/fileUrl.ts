import { APP_CONFIG } from "@/config/appConfig";

/**
 * Resolves a file/attachment/avatar URL.
 * If the URL is already absolute (starts with http:// or https://), returns as-is.
 * Otherwise, resolves against the backend origin derived from APP_CONFIG.apiBaseUrl.
 */
export function resolveFileUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://") || pathOrUrl.startsWith("blob:") || pathOrUrl.startsWith("data:")) {
    return pathOrUrl;
  }

  // Derive backend root origin from apiBaseUrl
  try {
    const base = APP_CONFIG.apiBaseUrl;
    if (base.startsWith("http://") || base.startsWith("https://")) {
      const url = new URL(base);
      return `${url.origin}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
    }
  } catch {
    // ignore
  }

  // Fallback to window origin or default dev port
  if (typeof window !== "undefined" && window.location.origin) {
    if (window.location.port === "5173" || window.location.port === "3000") {
      return `http://localhost:5214${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
    }
    return `${window.location.origin}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  }

  return `http://localhost:5214${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}
