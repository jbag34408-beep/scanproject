import { useEffect } from "react";
import { go } from "@/lib/router";

export type ApiError = { code: string; message: string; fields?: Record<string, string> };

export class ApiFailure extends Error {
  readonly status: number;
  readonly error: ApiError;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.status = status;
    this.error = error;
  }
}

const csrfToken = () => document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)?.[1];

/** 백엔드 `{ data, error }` 응답을 풀어 data만 돌려주고, 실패면 ApiFailure를 던진다. */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? "GET";
  // 쓰기 요청은 쿠키 기반 CSRF 토큰이 필요하다. 처음이면 발급받는다.
  if (method !== "GET" && !csrfToken()) await fetch("/api/v1/auth/csrf");
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-XSRF-TOKEN"] = decodeURIComponent(csrfToken() ?? "");

  const res = await fetch("/api/v1" + path, {
    method,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.error) {
    throw new ApiFailure(res.status, json?.error ?? { code: "INTERNAL_ERROR", message: "잠시 후 다시 시도해 주세요." });
  }
  return json.data as T;
}

/** 로그인이 필요한 화면. 세션이 없으면 로그인 화면으로 보낸다. */
export function useRequireLogin() {
  useEffect(() => {
    api("/auth/me").catch((e) => {
      if (e instanceof ApiFailure && e.status === 401) go("/login");
    });
  }, []);
}
