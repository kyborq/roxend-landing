import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Add charset to Content-Type header for HTML responses
  const contentType = response.headers.get("Content-Type");
  if (contentType && contentType.includes("text/html") && !contentType.includes("charset")) {
    response.headers.set("Content-Type", "text/html; charset=utf-8");
  }

  return response;
});

