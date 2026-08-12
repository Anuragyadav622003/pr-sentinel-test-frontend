import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiErrorBody {
  success?: false;
  message?: string;
  error?: {
    statusCode?: number;
    errors?: string[];
  };
}

export interface SerializedApiError {
  status: number;
  message: string;
  details: string[];
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
});

function serializeFetchError(
  error: FetchBaseQueryError,
): SerializedApiError {
  const status =
    typeof error.status === "number"
      ? error.status
      : error.status === "FETCH_ERROR"
        ? 0
        : 500;
  const data = error.data as ApiErrorBody | undefined;
  return {
    status,
    message: data?.message || "The request could not be completed.",
    details: data?.error?.errors ?? [],
  };
}

/**
 * Shared RTK Query base query. Unwraps the backend `{ success, data }` envelope
 * and normalizes errors into a consistent shape for UI handling.
 */
export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  SerializedApiError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    return { error: serializeFetchError(result.error) };
  }

  const payload = result.data;
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return { data: (payload as ApiSuccess<unknown>).data };
  }

  return { data: payload };
};
