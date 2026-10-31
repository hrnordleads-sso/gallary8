import type { BrainBuffers } from "@/lib/brainGeometry";
import { modelCandidateUrls } from "@/lib/assetBasePath";
import { orientBrainPositions } from "@/lib/brainSpace";
import { preferLiteBrainPoints } from "@/lib/deviceProfile";
import { loadBrainShell } from "@/lib/loadBrainShell";

const MAGIC = 0xb17a1001;

export type BrainPointsSource = "lite" | "full";

type CacheKey = BrainPointsSource;
const cache = new Map<CacheKey, Promise<BrainBuffers>>();

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

type ForceBrainMode =
  | "slow"
  | "fail-full"
  | "fail-lite"
  | "fail-both"
  | "fail-once";

/** Dev/QA only — set `window.__G8_FORCE_BRAIN_ASSETS` before load/retry. */
function getForceBrainMode(): ForceBrainMode | null {
  if (process.env.NODE_ENV === "production") return null;
  if (typeof window === "undefined") return null;
  const mode = (window as Window & { __G8_FORCE_BRAIN_ASSETS?: string })
    .__G8_FORCE_BRAIN_ASSETS;
  if (
    mode === "slow" ||
    mode === "fail-full" ||
    mode === "fail-lite" ||
    mode === "fail-both" ||
    mode === "fail-once"
  ) {
    return mode;
  }
  return null;
}

async function fetchBrainBin(file: string): Promise<BrainBuffers> {
  const force = getForceBrainMode();
  if (force === "slow") {
    await new Promise((r) => setTimeout(r, 2400));
  }
  if (force === "fail-both") {
    throw new Error(`Forced failure for ${file}`);
  }
  if (force === "fail-lite" && file.includes("lite")) {
    throw new Error(`Forced lite failure for ${file}`);
  }
  if (force === "fail-full" && file === "brain-points.bin") {
    throw new Error(`Forced full failure for ${file}`);
  }
  if (force === "fail-once") {
    const w = window as Window & { __G8_BRAIN_FAIL_ONCE_DONE?: boolean };
    if (!w.__G8_BRAIN_FAIL_ONCE_DONE) {
      w.__G8_BRAIN_FAIL_ONCE_DONE = true;
      throw new Error(`Forced transient failure for ${file}`);
    }
  }

  const urls = modelCandidateUrls(file);
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

function fileForKey(key: CacheKey): string {
  return key === "lite" ? "brain-points-lite.bin" : "brain-points.bin";
}

async function loadKey(key: CacheKey): Promise<BrainBuffers> {
  const existing = cache.get(key);
  if (existing) return existing;

  const pending = fetchBrainBin(fileForKey(key)).catch((err: unknown) => {
    cache.delete(key);
    throw err;
  });
  cache.set(key, pending);
  return pending;
}

/** Drop cached point clouds so a retry can re-fetch. */
export function clearBrainPointsCache(): void {
  cache.clear();
}

/**
 * Prefetch via the same in-memory loaders so later loads do not double-fetch.
 */
export function prefetchBrainAssets(): void {
  if (typeof window === "undefined") return;
  const lite = preferLiteBrainPoints();
  void loadKey(lite ? "lite" : "full").catch(() => {
    /* prefetch best-effort */
  });
  void loadBrainShell().catch(() => {
    /* prefetch best-effort */
  });
}

export type BrainPointsLoadResult = {
  buffers: BrainBuffers;
  source: BrainPointsSource;
};

/**
 * Load anatomical cortex points with one-step fallback (B4 · G8-06).
 * Prefer lite on mobile; if primary fails, try the other bin once.
 */
export async function loadBrainPoints(): Promise<BrainPointsLoadResult> {
  // Dev force modes must bypass warm in-memory cache from prior navigations
  if (getForceBrainMode()) {
    clearBrainPointsCache();
  }

  const preferLite = preferLiteBrainPoints();
  const order: CacheKey[] = preferLite ? ["lite", "full"] : ["full", "lite"];
  const failures: string[] = [];

  for (const key of order) {
    try {
      const buffers = await loadKey(key);
      if (key !== order[0]) {
        console.warn(
          `[loadBrainPoints] primary ${order[0]} unavailable — using ${key}`
        );
      }
      return { buffers, source: key };
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      failures.push(`${key}: ${detail}`);
      console.warn(`[loadBrainPoints] ${key} failed`, err);
    }
  }

  throw new Error(
    `Neural field assets unavailable (${failures.join(" | ") || "unknown"})`
  );
}
