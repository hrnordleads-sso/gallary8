import * as THREE from "three";

/**
 * B2 · G8-03 — Clock-shaped facade over THREE.Timer for the R3F store.
 * Used when the postinstall Clock patch is unavailable (dev without patch).
 */
export class FiberTimerClock {
  autoStart: boolean;
  startTime = 0;
  oldTime = 0;
  elapsedTime = 0;
  running = false;

  private readonly timer = new THREE.Timer();
  private connected = false;

  constructor(autoStart = true) {
    this.autoStart = autoStart;
    if (typeof document !== "undefined") {
      this.timer.connect(document);
      this.connected = true;
    }
  }

  start(): void {
    this.timer.reset();
    this.startTime = performance.now();
    this.oldTime = this.startTime;
    this.elapsedTime = 0;
    this.running = true;
  }

  stop(): void {
    this.getDelta();
    this.running = false;
    this.autoStart = false;
  }

  getElapsedTime(): number {
    this.getDelta();
    return this.elapsedTime;
  }

  getDelta(): number {
    if (this.autoStart && !this.running) {
      this.start();
      return 0;
    }
    if (!this.running) return 0;

    this.timer.update();
    const delta = this.timer.getDelta();
    this.elapsedTime = this.timer.getElapsed();
    this.oldTime = performance.now();
    return delta;
  }

  dispose(): void {
    if (this.connected) {
      this.timer.disconnect();
      this.connected = false;
    }
    this.timer.dispose();
  }
}
