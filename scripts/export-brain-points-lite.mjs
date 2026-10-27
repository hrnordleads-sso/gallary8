/**
 * Thin full brain-points.bin → mobile/lite asset (~38% points, ~4MB).
 * Run: node scripts/export-brain-points-lite.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcPath = path.join(root, "public", "models", "brain-points.bin");
const outPath = path.join(root, "public", "models", "brain-points-lite.bin");
const MAGIC = 0xb17a1001;
const KEEP = 0.38;

function main() {
  if (!fs.existsSync(srcPath)) throw new Error(`Missing ${srcPath}`);
  const buf = fs.readFileSync(srcPath);
  const count = buf.readUInt32LE(0);
  const magic = buf.readUInt32LE(4);
  if (magic !== MAGIC) throw new Error(`Bad magic 0x${magic.toString(16)}`);

  const step = Math.max(1, Math.round(1 / KEEP));
  const outCount = Math.floor(count / step);
  let offset = 8;
  const positions = new Float32Array(buf.buffer, buf.byteOffset + offset, count * 3);
  offset += count * 3 * 4;
  const colors = new Float32Array(buf.buffer, buf.byteOffset + offset, count * 3);
  offset += count * 3 * 4;
  const sizes = new Float32Array(buf.buffer, buf.byteOffset + offset, count);
  offset += count * 4;
  const seeds = new Float32Array(buf.buffer, buf.byteOffset + offset, count * 4);

  const oPos = new Float32Array(outCount * 3);
  const oCol = new Float32Array(outCount * 3);
  const oSize = new Float32Array(outCount);
  const oSeed = new Float32Array(outCount * 4);

  for (let i = 0; i < outCount; i += 1) {
    const src = i * step;
    oPos[i * 3] = positions[src * 3];
    oPos[i * 3 + 1] = positions[src * 3 + 1];
    oPos[i * 3 + 2] = positions[src * 3 + 2];
    oCol[i * 3] = colors[src * 3];
    oCol[i * 3 + 1] = colors[src * 3 + 1];
    oCol[i * 3 + 2] = colors[src * 3 + 2];
    oSize[i] = sizes[src] * 1.08;
    oSeed[i * 4] = seeds[src * 4];
    oSeed[i * 4 + 1] = seeds[src * 4 + 1];
    oSeed[i * 4 + 2] = seeds[src * 4 + 2];
    oSeed[i * 4 + 3] = seeds[src * 4 + 3];
  }

  const header = Buffer.alloc(8);
  header.writeUInt32LE(outCount, 0);
  header.writeUInt32LE(MAGIC, 4);
  const body = Buffer.concat([
    header,
    Buffer.from(oPos.buffer),
    Buffer.from(oCol.buffer),
    Buffer.from(oSize.buffer),
    Buffer.from(oSeed.buffer),
  ]);
  fs.writeFileSync(outPath, body);
  console.log("Wrote", outPath, "points", outCount, "MB", (body.length / 1e6).toFixed(2));
}

main();
