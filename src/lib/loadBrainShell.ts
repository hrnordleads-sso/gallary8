import * as THREE from "three";
import { orientBrainPositions } from "@/lib/brainSpace";

const MAGIC = 0xb17a1002;

function candidateUrls(): string[] {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const path = "/models/brain-shell.bin";
  const urls = [`${base}${path}`, path];
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/gallary8")) {
    urls.unshift("/gallary8/models/brain-shell.bin");
  }
  return [...new Set(urls)];
}

function parseShellBin(buf: ArrayBuffer): THREE.BufferGeometry {
  const view = new DataView(buf);
  const magic = view.getUint32(0, true);
  const vertCount = view.getUint32(4, true);
  if (magic !== MAGIC) {
    throw new Error(`Invalid brain-shell.bin magic: 0x${magic.toString(16)}`);
  }
  if (vertCount < 300 || vertCount > 500_000 || vertCount % 3 !== 0) {
    throw new Error(`Invalid brain-shell vert count: ${vertCount}`);
  }
  const positions = new Float32Array(new Float32Array(buf, 8, vertCount * 3));
  orientBrainPositions(positions);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Load decimated anatomical shell (same space as brain-points.bin). */
export async function loadBrainShell(): Promise<THREE.BufferGeometry> {
  const urls = candidateUrls();
  let lastError: unknown = null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} for ${url}`);
        continue;
      }
      return parseShellBin(await res.arrayBuffer());
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to load brain-shell.bin");
}
