export function json<T>(data: T, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

export function error(message: string, status = 400, details?: unknown) {
  return json({ error: { message, details } }, { status });
}
