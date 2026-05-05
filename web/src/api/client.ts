import type { ApiEnvelope, ApiFailure, PaginationMeta } from "../types";

export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code = "API_ERROR", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string | null;
}

export interface ApiResult<T> {
  data: T;
  meta?: PaginationMeta;
}

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";

export const apiRequest = async <T>(
  path: string,
  { body, token, headers, ...init }: RequestOptions = {}
): Promise<ApiResult<T>> => {
  const response = await fetch(`${apiBase}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | ApiFailure | null;

  if (!response.ok || !json || !("success" in json) || !json.success) {
    const failure = json as ApiFailure | null;
    throw new ApiError(
      failure?.error.message ?? "The request could not be completed.",
      failure?.error.code,
      failure?.error.details
    );
  }

  return {
    data: json.data,
    meta: json.meta
  };
};
