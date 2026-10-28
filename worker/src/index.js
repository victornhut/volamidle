const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      if (request.method !== "GET") {
        return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
      }
      return json({
        ok: true,
        service: "volamidle-zip",
        runtime: "cloudflare-workers",
        assetsBound: Boolean(env.ASSETS),
        time: new Date().toISOString()
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({
        ok: false,
        error: "API_NOT_CONFIGURED",
        message: "Bản gốc hiện là game web tĩnh; chưa có API tài khoản/máy chủ trong source. Endpoint này được giữ riêng cho health-check."
      }, 404);
    }

    if (!env.ASSETS) {
      return new Response(
        "Thiếu binding ASSETS. Hãy chạy npm run build:cf và kiểm tra assets.directory trong wrangler.jsonc.",
        { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const headers = new Headers(assetResponse.headers);
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
    headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");

    if (url.pathname === "/" || url.pathname.endsWith(".html")) {
      headers.set("cache-control", "no-cache");
    }

    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers
    });
  }
};
