export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
}

export function apiSuccess<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function apiError(
  message: string,
  code = 'BAD_REQUEST',
  status = 400,
  details?: unknown
): Response {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
