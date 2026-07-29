const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || "ff85b0677418408ef5f56661ad43f6bd54e9283cf45a14878df2f8b53d151425";

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizeUrls(siteUrl, urls) {
  const site = new URL(siteUrl);
  const normalized = [];

  for (const value of urls) {
    const url = new URL(value, site);
    if (url.origin !== site.origin) continue;
    url.hash = "";
    normalized.push(url.toString());
  }

  return [...new Set(normalized)].slice(0, 10000);
}

async function submitIndexNow(siteUrl, urls, options = {}) {
  const site = new URL(siteUrl);
  const urlList = normalizeUrls(site, urls);
  if (!urlList.length) throw new Error("No valid site URLs were supplied to IndexNow.");

  const attempts = Math.min(4, Math.max(1, options.attempts || 3));
  const keyLocation = new URL(`/${INDEXNOW_KEY}.txt`, site).toString();
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: site.host,
          key: INDEXNOW_KEY,
          keyLocation,
          urlList,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.status === 200 || response.status === 202) {
        return {
          accepted: true,
          statusCode: response.status,
          submitted: urlList.length,
          keyLocation,
        };
      }

      const retryable = response.status === 429 || response.status >= 500;
      lastError = new Error(`IndexNow returned HTTP ${response.status}.`);
      if (!retryable) break;
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) await wait(300 * 2 ** (attempt - 1));
  }

  throw lastError || new Error("IndexNow submission failed.");
}

module.exports = {
  INDEXNOW_KEY,
  submitIndexNow,
};
