import { APP_CONFIG } from "@/config/appConfig";
import type { ApiResponse } from "@/types";

const TOKEN_KEY = "ticketapp.token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiAdapter {
  private readonly baseUrl: string;

  constructor(baseUrl: string = APP_CONFIG.apiBaseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers: customHeaders, ...init } = options;

    let url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const query = searchParams.toString();
      if (query) {
        url += (url.includes("?") ? "&" : "?") + query;
      }
    }

    const headers = new Headers(customHeaders);
    const token = getStoredToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...init,
      headers,
    });

    if (response.status === 401) {
      removeStoredToken();
      // Optional: trigger redirect or event if needed
    }

    let payload: any = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      const errorMsg =
        (typeof payload === "object" && payload !== null && (payload.message || payload.title)) ||
        `Request failed with status ${response.status}`;
      const error: any = new Error(errorMsg);
      error.status = response.status;
      error.data = payload;
      throw error;
    }

    // If backend wrapped in ApiResponse<T>, unwrap data or return response directly
    if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
      return (payload as ApiResponse<T>).data;
    }

    return payload as T;
  }

  get<T>(path: string, params?: Record<string, any>) {
    return this.request<T>(path, { method: "GET", params });
  }

  post<T>(path: string, body?: unknown) {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    return this.request<T>(path, {
      method: "POST",
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });
  }

  put<T>(path: string, body?: unknown) {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    return this.request<T>(path, {
      method: "PUT",
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiAdapter();