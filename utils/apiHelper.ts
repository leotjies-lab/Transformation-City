/**
 * Safe fetch helper that guards against HTML responses (e.g. 404/502 SPA index.html fallbacks)
 * and formats clean, human-readable error messages for backend API endpoints.
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 20000
): Promise<SafeApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          data,
          error: data?.error || data?.message || `Server responded with HTTP ${res.status}`,
        };
      }
      return {
        ok: true,
        status: res.status,
        data,
        error: null,
      };
    }

    // Response is NOT JSON (e.g. HTML from a 404, 502, or SPA index.html fallback)
    const rawText = await res.text();
    const isHtml = rawText.trim().startsWith('<') || contentType.includes('text/html');

    if (isHtml) {
      if (res.status === 404 || rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
        return {
          ok: false,
          status: res.status || 404,
          data: null,
          error: `Backend API route "${url}" returned HTML instead of JSON. Please ensure the Node.js backend server (dist/server.cjs) is active and running on your host.`,
        };
      }
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Server returned HTTP ${res.status} HTML error page.`,
      };
    }

    return {
      ok: res.ok,
      status: res.status,
      data: null,
      error: res.ok ? null : (rawText.slice(0, 200) || `HTTP error ${res.status}`),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        ok: false,
        status: 408,
        data: null,
        error: `Request to ${url} timed out after ${timeoutMs / 1000}s. The server or SMTP connection took too long to respond.`,
      };
    }
    return {
      ok: false,
      status: 0,
      data: null,
      error: err.message || 'Network communication error.',
    };
  }
}
