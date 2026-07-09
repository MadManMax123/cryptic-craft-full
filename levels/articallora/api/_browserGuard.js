function getHeader(req, name) {
  const lower = name.toLowerCase();
  return req.headers[lower] || req.headers[name] || "";
}

function isBrowserLikeRequest(req) {
  const host = (getHeader(req, "host") || "").toLowerCase();
  const origin = (getHeader(req, "origin") || "").trim();
  const referer = (getHeader(req, "referer") || "").trim();
  const xRequestedWith = (getHeader(req, "x-requested-with") || "").toLowerCase();
  const secFetchSite = (getHeader(req, "sec-fetch-site") || "").toLowerCase();
  const secFetchMode = (getHeader(req, "sec-fetch-mode") || "").toLowerCase();

  let originHost = "";
  let refererHost = "";

  try {
    if (origin) originHost = new URL(origin).host.toLowerCase();
  } catch {}

  try {
    if (referer) refererHost = new URL(referer).host.toLowerCase();
  } catch {}

  const sameHost = Boolean((originHost && originHost === host) || (refererHost && refererHost === host));
  const hasBrowserSignal =
    xRequestedWith === "xmlhttprequest" ||
    secFetchSite === "same-origin" ||
    secFetchSite === "none" ||
    secFetchMode === "cors" ||
    Boolean(refererHost);

  return sameHost && hasBrowserSignal;
}

function enforceBrowserRequest(req, res) {
  if (isBrowserLikeRequest(req)) return null;

  res.status(403).json({
    error: "Browser session required",
  });
  return true;
}

module.exports = {
  enforceBrowserRequest,
  isBrowserLikeRequest,
};
