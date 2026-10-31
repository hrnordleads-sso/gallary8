/**
 * Resolve static-asset prefix for models under GitHub Pages / env basePath.
 * Prefer build-time NEXT_PUBLIC_BASE_PATH; fall back to known /gallary8 host path.
 */
export function assetBasePath(): string {
  const env = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  if (env) return env;
  if (typeof window === "undefined") return "";
  const path = window.location.pathname;
  if (path === "/gallary8" || path.startsWith("/gallary8/")) return "/gallary8";
  // Subpath deploys: first segment when page is served from /<segment>/...
  const m = path.match(/^\/([^/]+)\//);
  if (m && document.querySelector(`script[src*="/${m[1]}/_next/"]`)) {
    return `/${m[1]}`;
  }
  return "";
}

export function modelCandidateUrls(file: string): string[] {
  const base = assetBasePath();
  const path = `/models/${file}`;
  const urls = [`${base}${path}`, path];
  if (base) urls.unshift(`${base}/models/${file}`);
  return [...new Set(urls.filter(Boolean))];
}
