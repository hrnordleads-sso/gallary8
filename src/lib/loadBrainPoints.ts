import type { BrainBuffers } from "@/lib/brainGeometry";
import { orientBrainPositions } from "@/lib/brainSpace";
import { useLiteBrainPoints } from "@/lib/deviceProfile";

const MAGIC = 0xb17a1001;

type CacheKey = "full" | "lite";
const cache = new Map<CacheKey, Promise<BrainBuffers>>();

function basePath(): string {
  const env = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/gallary8")) {
    return "/gallary8";
  }
  return "";
}

function candidateUrls(file: string): string[] {
  const base = basePath();
  const path = `/models/${file}`;
  const urls = [`${base}${path}`, path];
  if (base === "/gallary8") urls.unshift(`/gallary8/models/${file}`);
  return [...new Set(urls)];
}

function parseBrainBin(buf: ArrayBuffer): BrainBuffers {
  const view = new DataView(buf);
  const count = view.getUint32(0, true);
  const magic = view.getUint32(4, true);
  if (magic !== MAGIC) {
    throw new Error(`Invalid brain-points.bin magic: 0x${magic.toString(16)}`);
  }
  if (count < 1000 || count > 2_000_000) {
    throw new Error(`Invalid brain point count: ${count}`);
  }

  let offset = 8;
  const positions = new Float32Array(buf, offset, count * 3);
  offset += count * 3 * 4;
  const colors = new Float32Array(buf, offset, count * 3);
  offset += count * 3 * 4;
  const sizes = new Float32Array(buf, offset, count);
  offset += count * 4;
  const seeds = new Float32Array(buf, offset, count * 4);

  const posCopy = new Float32Array(positions);
  orientBrainPositions(posCopy);

  return {
    positions: posCopy,
    colors: new Float32Array(colors),
    sizes: new Float32Array(sizes),
    seeds: new Float32Array(seeds),
    count,
  };
}

async function fetchBrainBin(file: string): Promise<BrainBuffers> {
  const urls = candidateUrls(file);
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} for ${url}`);
        continue;
      }
      return parseBrainBin(await res.arrayBuffer());
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to load ${file}`);
}

/** Prefetch both assets as early as possible (call from layout / experience mount). */
export function prefetchBrainAssets(): void {
  if (typeof window === "undefined") return;
  const lite = useLiteBrainPoints();
  const points = lite ? "brain-points-lite.bin" : "brain-points.bin";
  for (const file of [points, "brain-shell.bin"]) {
    const url = candidateUrls(file)[0];
    if (!url) continue;
    void fetch(url, { cache: "force-cache" }).catch(() => {
      /* prefetch best-effort */
    });
  }
}

/** Load pre-baked anatomical cortex point cloud (full or lite). Cached per session. */
export function loadBrainPoints(): Promise<BrainBuffers> {
  const key: CacheKey = useLiteBrainPoints() ? "lite" : "full";
  const existing = cache.get(key);
  if (existing) return existing;

  const file = key === "lite" ? "brain-points-lite.bin" : "brain-points.bin";
  const pending = fetchBrainBin(file).catch(async (err: unknown) => {
    // Lite missing → fall back to full once
    if (key === "lite") {
      console.warn("[loadBrainPoints] lite missing, falling back to full", err);
      const full = await fetchBrainBin("brain-points.bin");
      cache.set("full", Promise.resolve(full));
      return full;
    }
    cache.delete(key);
    throw err;
  });
  cache.set(key, pending);
  return pending;
}
