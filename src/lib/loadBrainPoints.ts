import type { BrainBuffers } from "@/lib/brainGeometry";

const MAGIC = 0xb17a1001;

function candidateUrls(): string[] {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const path = "/models/brain-points.bin";
  const urls = [`${base}${path}`, path];
  // Absolute Pages path hard-fallback (in case env missing in client bundle)
  if (typeof window !== "undefined") {
    const { pathname } = window.location;
    if (pathname.startsWith("/gallary8")) {
      urls.unshift("/gallary8/models/brain-points.bin");
    }
  }
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

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    sizes: new Float32Array(sizes),
    seeds: new Float32Array(seeds),
    count,
  };
}

/** Load pre-baked anatomical cortex point cloud (from scripts/bake-brain-points.mjs). */
export async function loadBrainPoints(): Promise<BrainBuffers> {
  const urls = candidateUrls();
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} for ${url}`);
        continue;
      }
      const buf = await res.arrayBuffer();
      return parseBrainBin(buf);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to load brain-points.bin from all candidates");
}
