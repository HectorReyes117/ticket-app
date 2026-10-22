import { APP_CONFIG } from "@/config/appConfig";

/**
 * Resolves a file/attachment/avatar URL.
 * Handles:
 * 1. Absolute URLs (including blob: and data:).
 * 2. Mixed-content / localhost mismatch: if accessing through a remote host / tunnel
 *    and the URL points to localhost:5214, re-points to the active API origin.
 * 3. Relative paths: prefixed with backend origin derived from APP_CONFIG.apiBaseUrl.
 */
export function resolveFileUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return "";

  // Blob or data URLs
  if (pathOrUrl.startsWith("blob:") || pathOrUrl.startsWith("data:")) {
    return pathOrUrl;
  }

  // Derive target backend origin from APP_CONFIG.apiBaseUrl
  let apiOrigin = "";
  try {
    const base = APP_CONFIG.apiBaseUrl;
    if (base.startsWith("http://") || base.startsWith("https://")) {
      apiOrigin = new URL(base).origin;
    }
  } catch {
    // ignore
  }

  // If running in browser and no explicit absolute apiBaseUrl
  if (!apiOrigin && typeof window !== "undefined" && window.location.origin) {
    if (window.location.port === "5173" || window.location.port === "3000") {
      apiOrigin = "http://localhost:5214";
    } else {
      apiOrigin = window.location.origin;
    }
  }

  // If pathOrUrl has localhost:5214 but we are on a remote host/tunnel, rewrite origin
  if (pathOrUrl.startsWith("http://localhost:5214") || pathOrUrl.startsWith("https://localhost:5214")) {
    if (apiOrigin && !apiOrigin.includes("localhost:5214")) {
      const pathname = pathOrUrl.replace(/^https?:\/\/localhost:5214/, "");
      return `${apiOrigin}${pathname}`;
    }
    return pathOrUrl;
  }

  // If pathOrUrl has http:// with matching apiOrigin host, upgrade to https
  if (apiOrigin.startsWith("https://") && pathOrUrl.startsWith("http://")) {
    try {
      const incomingUrl = new URL(pathOrUrl);
      const targetUrl = new URL(apiOrigin);
      if (incomingUrl.host === targetUrl.host) {
        return `${apiOrigin}${incomingUrl.pathname}${incomingUrl.search}`;
      }
    } catch {
      // ignore
    }
  }

  // If already absolute with any other domain, return as-is
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  // Relative path like "/uploads/..."
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${apiOrigin || "http://localhost:5214"}${cleanPath}`;
}

