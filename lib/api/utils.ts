export function json(data: any, init: number | ResponseInit = 200) {
  const status = typeof init === "number" ? init : ((init as ResponseInit).status ?? 200);
  const headers = new Headers(typeof init === "number" ? {} : init.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), {
    ...(typeof init === "number" ? {} : init),
    status,
    headers,
  });
}

export function badRequest(message = "Bad Request") {
  return json({ error: message }, 400);
}
export function notFound(message = "Not Found") {
  return json({ error: message }, 404);
}
