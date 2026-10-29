/**
 * TEMPORARY COMPATIBILITY WORKAROUND (B2/B3/B5 · G8-03)
 * Rewrite THREE.Clock as a Timer-backed facade (r183+).
 * R3F still constructs `new THREE.Clock()`; ESM export bindings cannot be reassigned,
 * so we patch three's published Clock implementation after install (postinstall).
 *
 * Temporary until @react-three/fiber adopts THREE.Timer natively, or until we
 * switch to an official patch-package / upstream fix. Do not treat this as a
 * permanent dependency strategy — remove when R3F no longer constructs Clock.
 *
 * Idempotent via MARKER. Fails clearly (exit 1) if three layout/version unsupported.
 * Only touches three src/core/Clock.js + build/three.core.js (three.cjs stub skipped).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKER = "G8-03-TIMER-CLOCK";
const THREE_ROOT = path.join(root, "node_modules", "three");

const CLOCK_CLASS = `/**
 * Clock-shaped facade over Timer for libraries that still construct Clock
 * (e.g. @react-three/fiber). ${MARKER}
 */
class Clock {

	constructor( autoStart = true ) {

		this.autoStart = autoStart;
		this.startTime = 0;
		this.oldTime = 0;
		this.elapsedTime = 0;
		this.running = false;
		this._timer = new Timer();

		if ( typeof document !== 'undefined' ) {

			this._timer.connect( document );

		}

	}

	start() {

		this._timer.reset();
		this.startTime = performance.now();
		this.oldTime = this.startTime;
		this.elapsedTime = 0;
		this.running = true;

	}

	stop() {

		this.getElapsedTime();
		this.running = false;
		this.autoStart = false;

	}

	getElapsedTime() {

		this.getDelta();
		return this.elapsedTime;

	}

	getDelta() {

		if ( this.autoStart && ! this.running ) {

			this.start();
			return 0;

		}

		if ( ! this.running ) return 0;

		this._timer.update();
		const diff = this._timer.getDelta();
		this.elapsedTime = this._timer.getElapsed();
		this.oldTime = performance.now();
		return diff;

	}

}
`;

const SRC_CLOCK = `import { Timer } from './Timer.js';

${CLOCK_CLASS}
export { Clock };
`;

const CLASS_RE =
  /\/\*\*\s*\n \* Class for keeping track of time\.\s*\n \*\s*\n \* @deprecated since r183\.\s*\n \*\/\s*\nclass Clock \{[\s\S]*?\n\}\n/;

function fail(message) {
  console.error(`[patch-three-clock] FATAL: ${message}`);
  process.exit(1);
}

function assertThreeLayout() {
  if (!fs.existsSync(THREE_ROOT)) {
    fail(`three package missing at ${THREE_ROOT}. Run npm install first.`);
  }
  const pkgPath = path.join(THREE_ROOT, "package.json");
  if (!fs.existsSync(pkgPath)) {
    fail(`three/package.json missing — unexpected install layout.`);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.version) {
    fail("three/package.json has no version field.");
  }
  const timerSrc = path.join(THREE_ROOT, "src", "core", "Timer.js");
  const coreBuild = path.join(THREE_ROOT, "build", "three.core.js");
  if (!fs.existsSync(timerSrc)) {
    fail(`Timer.js not found at ${timerSrc}. three ${pkg.version} layout unsupported.`);
  }
  if (!fs.existsSync(coreBuild)) {
    fail(`three.core.js not found at ${coreBuild}. three ${pkg.version} layout unsupported.`);
  }
  console.log(`[patch-three-clock] three@${pkg.version}`);
}

function patchSrc() {
  const file = path.join(THREE_ROOT, "src", "core", "Clock.js");
  if (!fs.existsSync(file)) {
    fail(`src/core/Clock.js missing — cannot patch.`);
  }
  if (fs.readFileSync(file, "utf8").includes(MARKER)) {
    console.log("[patch-three-clock] src already patched (idempotent)");
    return;
  }
  fs.writeFileSync(file, SRC_CLOCK);
  console.log("[patch-three-clock] wrote src/core/Clock.js");
}

function patchBuilt(rel, { required }) {
  const file = path.join(THREE_ROOT, "build", rel);
  if (!fs.existsSync(file)) {
    if (required) fail(`required build file missing: ${rel}`);
    console.log(`[patch-three-clock] skip optional missing ${rel}`);
    return;
  }
  let src = fs.readFileSync(file, "utf8");
  if (src.includes(MARKER)) {
    console.log(`[patch-three-clock] ${rel} already patched (idempotent)`);
    return;
  }
  // three.cjs is a deprecation stub in recent three — not a full build
  if (rel.endsWith(".cjs") && !src.includes("class Clock")) {
    console.log(`[patch-three-clock] ${rel} has no Clock class (stub) — skipped`);
    return;
  }
  if (!CLASS_RE.test(src)) {
    fail(
      `Clock class pattern not found in ${rel}. ` +
        `three package structure changed — update scripts/patch-three-clock.mjs before shipping.`
    );
  }
  src = src.replace(CLASS_RE, `${CLOCK_CLASS}\n`);
  if (!src.includes(MARKER)) {
    fail(`patch applied to ${rel} but marker missing — aborting.`);
  }
  fs.writeFileSync(file, src);
  console.log(`[patch-three-clock] rewrote Clock in ${rel}`);
}

assertThreeLayout();
patchSrc();
patchBuilt("three.core.js", { required: true });
patchBuilt("three.cjs", { required: false });
console.log("[patch-three-clock] OK");
