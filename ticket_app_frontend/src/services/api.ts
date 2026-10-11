import { APP_CONFIG } from "@/config/appConfig";

/**
 * Data access layer.
 *
 * The app is currently backed by an in-memory mock repository. Every service
 * method returns a Promise so the implementation can be swapped to the .NET
 * API later (see ApiAdapter below) without changing call sites.
 */

const MOCK_LATENCY_MS = 120;

export function mockApi<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(data)), MOCK_LATENCY_MS);
  });
}

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Adapter used once the live backend is wired up. Swaps out mockApi for
 * fetch against APP_CONFIG.apiBaseUrl.
 */
export class ApiAdapter {
  private readonly baseUrl: string;

  constructor(baseUrl: string = APP_CONFIG.apiBaseUrl) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiAdapter();