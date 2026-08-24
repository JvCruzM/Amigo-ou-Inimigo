export function getSafeCallbackUrl(
  callbackUrl,
  fallback = "/dashboard"
) {
  if (!callbackUrl) {
    return fallback;
  }

  try {
    const url = new URL(callbackUrl, "http://localhost");

    if (
      url.origin === "http://localhost" &&
      url.pathname.startsWith("/")
    ) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    return fallback;
  } catch {
    return fallback;
  }
}