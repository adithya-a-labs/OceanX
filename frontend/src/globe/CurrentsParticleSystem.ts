/**
 * OceanX Cesium Currents Particle System - Region-Restricted & 3D-Anchored
 *
 * Designed specifically to:
 * 1. Confine ocean currents to valid cells in the dataset region (Bay of Bengal)
 *    with zero particles or trails rendered on the rest of the globe.
 * 2. Render whisper-thin, silky, delicate streamline trails with luminous spark heads.
 * 3. Lock trails directly to 3D geographic coordinates on the globe surface using per-frame
 *    world-to-window projection, eliminating 2D screen persistence smearing or trails showing up
 *    artificially when orbiting or moving the globe.
 */

import * as Cesium from 'cesium';
import type { CurrentsData } from '../types';

interface TrailPoint {
  lon: number;
  lat: number;
}

interface Particle {
  lon: number;
  lat: number;
  trail: TrailPoint[];
  age: number;
  maxAge: number;
  speed: number;
}

interface SpeedBin {
  maxSpeed: number;
  rgb: string;
}

// Curated Windy.com speed palette RGB definitions
const SPEED_BINS: SpeedBin[] = [
  { maxSpeed: 0.18, rgb: '56, 189, 248' },   // #38bdf8 Calm azure
  { maxSpeed: 0.38, rgb: '34, 211, 238' },   // #22d3ee Electric cyan
  { maxSpeed: 0.58, rgb: '52, 211, 153' },   // #34d399 Radiant mint / emerald
  { maxSpeed: 0.82, rgb: '250, 204, 21' },   // #facc15 Vibrant golden amber
  { maxSpeed: Infinity, rgb: '255, 255, 255' }, // Hot white / crest
];

/** Samples a nullable u/v grid using bilinear interpolation. Missing values remain invalid. */
function bilinear(
  grid: (number | null)[][],
  r0: number,
  c0: number,
  r1: number,
  c1: number,
  fx: number,
  fy: number
): number | null {
  const a = grid[r0]?.[c0];
  const b = grid[r0]?.[c1];
  const c = grid[r1]?.[c0];
  const d = grid[r1]?.[c1];
  if (
    a === null || a === undefined ||
    b === null || b === undefined ||
    c === null || c === undefined ||
    d === null || d === undefined ||
    !Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || !Number.isFinite(d)
  ) {
    return null;
  }
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

export class CurrentsParticleSystem {
  private viewer: Cesium.Viewer;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentData: CurrentsData | null = null;
  private particles: Particle[] = [];
  private validCells: Array<{ row: number; column: number }> = [];
  private particleCount = 1100;
  private maxTrailLength = 16;  // Extended length for longer streamline trails
  private isVisible = false;
  private isDisposed = false;
  private lastTime = 0;

  // Listeners
  private removePostRenderListener: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Scratch objects for zero-allocation 60fps execution
  private scratchNormal = new Cesium.Cartesian3();
  private scratchCameraToPoint = new Cesium.Cartesian3();
  private scratchCartesian = new Cesium.Cartesian3();
  private scratchWindowCoord = new Cesium.Cartesian2();

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;

    // Create full-screen canvas overlay
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'oceanx-windy-currents-canvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1';
    this.canvas.style.display = 'none';

    // Mount canvas into Cesium viewer's container
    const container = this.viewer.container as HTMLElement;
    if (container) {
      if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
      container.appendChild(this.canvas);
    }

    const ctx = this.canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      throw new Error('[CurrentsParticleSystem] Failed to get 2D rendering context');
    }
    this.ctx = ctx;

    this.resizeCanvas();
    this.setupResizeListener();
    this.attachRenderLoop();
  }

  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  private resizeCanvas(): void {
    if (this.isDisposed || !this.viewer) return;
    const container = this.viewer.container as HTMLElement;
    const clientWidth = container?.clientWidth || window.innerWidth;
    const clientHeight = container?.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const targetWidth = Math.floor(clientWidth * dpr);
    const targetHeight = Math.floor(clientHeight * dpr);

    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
      this.clearCanvas();
    }
  }

  private clearCanvas(): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private setupResizeListener(): void {
    const container = this.viewer.container as HTMLElement;
    if (container && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeCanvas();
      });
      this.resizeObserver.observe(container);
    }
  }

  private hasValidVector(row: number, column: number): boolean {
    const data = this.currentData;
    if (!data) return false;
    const u = data.u[row]?.[column];
    const v = data.v[row]?.[column];
    return u !== null && u !== undefined && Number.isFinite(u) &&
      v !== null && v !== undefined && Number.isFinite(v);
  }

  private isInsideBounds(lon: number, lat: number): boolean {
    const bounds = this.currentData?.bounds;
    return !!bounds && lon >= bounds.west && lon <= bounds.east &&
      lat >= bounds.south && lat <= bounds.north;
  }

  private initParticles(): void {
    this.particles = this.validCells.length
      ? Array.from({ length: this.particleCount }, () => this.spawnParticle()) : [];
  }

  private spawnParticle(): Particle {
    const data = this.currentData!;
    const { row, column } = this.validCells[Math.floor(Math.random() * this.validCells.length)];
    const rows = data.u.length;
    const columns = data.u[0].length;
    // Every valid regular-grid cell has equal probability; land cells are absent.
    const lon = data.bounds.west + (column + Math.random()) / (columns - 1) *
      (data.bounds.east - data.bounds.west);
    const lat = data.bounds.north - (row + Math.random()) / (rows - 1) *
      (data.bounds.north - data.bounds.south);

    return {
      lon,
      lat,
      trail: [{ lon, lat }],
      age: Math.random() * 40, // Staggered start ages
      maxAge: 70 + Math.random() * 60, // 70 to 130 frames lifetime for longer streamlets
      speed: 0.25,
    };
  }

  /**
   * Samples velocity only where the real grid defines all surrounding vectors.
   */
  private sampleVelocity(lon: number, lat: number): { u: number; v: number } | null {
    if (!this.isInsideBounds(lon, lat)) return null;

    if (this.currentData && this.currentData.u.length > 1 && this.currentData.v.length > 1) {
      const { u, v, bounds } = this.currentData;
      const rows = u.length;
      const cols = u[0].length;

      const normX = (lon - bounds.west) / (bounds.east - bounds.west);
      const normY = (bounds.north - lat) / (bounds.north - bounds.south);

      const gx = normX * (cols - 1);
      const gy = normY * (rows - 1);

      const c0 = Math.floor(gx);
      const c1 = Math.min(cols - 1, c0 + 1);
      const r0 = Math.floor(gy);
      const r1 = Math.min(rows - 1, r0 + 1);

      const fx = gx - c0;
      const fy = gy - r0;

      const uInterp = bilinear(u, r0, c0, r1, c1, fx, fy);
      const vInterp = bilinear(v, r0, c0, r1, c1, fx, fy);

      return uInterp === null || vInterp === null ? null : { u: uInterp, v: vInterp };
    }
    return null;
  }

  public updateCurrents(data: CurrentsData): void {
    this.currentData = data;
    this.validCells = [];
    for (let row = 0; row < data.u.length - 1; row++) {
      for (let column = 0; column < data.u[row].length - 1; column++) {
        if (this.hasValidVector(row, column) && this.hasValidVector(row + 1, column) &&
            this.hasValidVector(row, column + 1) && this.hasValidVector(row + 1, column + 1)) {
          this.validCells.push({ row, column });
        }
      }
    }
    this.initParticles();
    this.clearCanvas();
  }

  public setShow(show: boolean): void {
    this.isVisible = show;
    this.canvas.style.display = show ? 'block' : 'none';
    if (!show) {
      this.clearCanvas();
    } else {
      this.resizeCanvas();
      this.lastTime = performance.now();
      this.viewer.scene.requestRender();
    }
  }

  private isPointFacingCamera(cartesian: Cesium.Cartesian3, cameraPosition: Cesium.Cartesian3): boolean {
    Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(cartesian, this.scratchNormal);
    Cesium.Cartesian3.subtract(cameraPosition, cartesian, this.scratchCameraToPoint);
    return Cesium.Cartesian3.dot(this.scratchNormal, this.scratchCameraToPoint) > 0;
  }

  private attachRenderLoop(): void {
    const onPostRender = () => {
      if (this.isDisposed || !this.isVisible) return;

      const now = performance.now();
      const dt = Math.min(0.04, (now - (this.lastTime || now)) / 1000);
      this.lastTime = now;

      this.renderFrame(dt);
    };

    const removeListener = this.viewer.scene.postRender.addEventListener(onPostRender);
    this.removePostRenderListener = () => {
      removeListener();
    };
  }

  /**
   * Main per-frame 3D-anchored streamline animation loop.
   * Completely redraws trails directly from their 3D geographic coordinates every frame.
   * Eliminates 2D screen persistence, smearing, and camera movement artifacts.
   */
  private renderFrame(dt: number): void {
    const ctx = this.ctx;
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;
    if (canvasW === 0 || canvasH === 0) return;

    // Clear entire canvas so trails are 100% anchored to the 3D globe with no screen-space ghosting
    ctx.clearRect(0, 0, canvasW, canvasH);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scene = this.viewer.scene;
    const cameraPosition = scene.camera.positionWC;
    const speedScale = 1.15; // Geographic advection multiplier for extended streamline reach

    // Prepare batched segment buckets for 5 speed bins to minimize draw calls
    interface Segment {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      alpha: number;
    }

    interface Bead {
      x: number;
      y: number;
      alpha: number;
    }

    interface BinData {
      tailSegments: Segment[];
      midSegments: Segment[];
      headSegments: Segment[];
      beads: Bead[];
    }

    const bins: BinData[] = SPEED_BINS.map(() => ({
      tailSegments: [],
      midSegments: [],
      headSegments: [],
      beads: [],
    }));

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // 2nd-Order Runge-Kutta (RK2) Advection
      const v1 = this.sampleVelocity(p.lon, p.lat);
      if (!v1) {
        this.particles[i] = this.spawnParticle();
        continue;
      }
      const cosLat1 = Math.max(0.12, Math.cos((p.lat * Math.PI) / 180));
      const midLon = p.lon + (v1.u * speedScale * dt * 0.5) / cosLat1;
      const midLat = p.lat + v1.v * speedScale * dt * 0.5;

      const v2 = this.sampleVelocity(midLon, midLat);
      if (!v2) {
        this.particles[i] = this.spawnParticle();
        continue;
      }
      const cosLat2 = Math.max(0.12, Math.cos((midLat * Math.PI) / 180));
      const nextLon = p.lon + (v2.u * speedScale * dt) / cosLat2;
      const nextLat = p.lat + v2.v * speedScale * dt;
      if (!this.sampleVelocity(nextLon, nextLat)) {
        this.particles[i] = this.spawnParticle();
        continue;
      }
      p.lon = nextLon;
      p.lat = nextLat;
      p.speed = Math.hypot(v2.u, v2.v);
      p.age += 1;

      // Append current geographic position to trail history
      p.trail.push({ lon: p.lon, lat: p.lat });
      if (p.trail.length > this.maxTrailLength) {
        p.trail.shift();
      }

      if (p.age >= p.maxAge) {
        this.particles[i] = this.spawnParticle();
        continue;
      }

      // Horizon culling: check if particle is on the hemisphere facing camera
      Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 1500, Cesium.Ellipsoid.WGS84, this.scratchCartesian);
      if (!this.isPointFacingCamera(this.scratchCartesian, cameraPosition)) {
        continue;
      }

      // Need at least 2 points to draw a streamline
      const trail = p.trail;
      const trailLen = trail.length;
      if (trailLen < 2) continue;

      // Project all trail points from 3D world coordinates to screen pixels
      const screenPoints: Array<{ x: number; y: number }> = [];
      let isOffscreen = true;

      for (let t = 0; t < trailLen; t++) {
        Cesium.Cartesian3.fromDegrees(
          trail[t].lon,
          trail[t].lat,
          1500,
          Cesium.Ellipsoid.WGS84,
          this.scratchCartesian
        );
        const win = Cesium.SceneTransforms.worldToWindowCoordinates(
          scene,
          this.scratchCartesian,
          this.scratchWindowCoord
        );
        if (!win) {
          screenPoints.length = 0;
          break;
        }

        const px = win.x * dpr;
        const py = win.y * dpr;
        screenPoints.push({ x: px, y: py });

        if (px >= 0 && px <= canvasW && py >= 0 && py <= canvasH) {
          isOffscreen = false;
        }
      }

      if (isOffscreen || screenPoints.length < 2) continue;

      // Check for projection discontinuity jump (e.g. crossing camera frustum edges)
      let hasJump = false;
      for (let s = 1; s < screenPoints.length; s++) {
        const dx = screenPoints[s].x - screenPoints[s - 1].x;
        const dy = screenPoints[s].y - screenPoints[s - 1].y;
        if (dx * dx + dy * dy > 8000) {
          hasJump = true;
          break;
        }
      }
      if (hasJump) continue;

      // Determine speed bin
      let binIdx = 0;
      for (let b = 0; b < SPEED_BINS.length; b++) {
        if (p.speed <= SPEED_BINS[b].maxSpeed) {
          binIdx = b;
          break;
        }
      }
      const bin = bins[binIdx];

      // Smooth lifespan alpha envelope across the full valid-water patch
      const lifeFraction = p.age / p.maxAge;
      const lifeAlpha = Math.sin(lifeFraction * Math.PI);

      // Distribute trail points into Tail, Mid, and Head segments for smooth tapering
      const numPts = screenPoints.length;
      for (let s = 1; s < numPts; s++) {
        const p0 = screenPoints[s - 1];
        const p1 = screenPoints[s];
        const segmentFraction = s / (numPts - 1); // 0 at tail, 1 at head

        if (segmentFraction <= 0.35) {
          bin.tailSegments.push({
            x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y,
            alpha: 0.22 * lifeAlpha,
          });
        } else if (segmentFraction <= 0.70) {
          bin.midSegments.push({
            x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y,
            alpha: 0.55 * lifeAlpha,
          });
        } else {
          bin.headSegments.push({
            x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y,
            alpha: 0.88 * lifeAlpha,
          });
        }
      }

      // Delicate glowing spark bead at the leading tip of each streamlet
      const headPt = screenPoints[numPts - 1];
      bin.beads.push({
        x: headPt.x,
        y: headPt.y,
        alpha: Math.min(1.0, lifeAlpha * 0.95),
      });
    }

    // Render batched segments with whisper-thin refined widths
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let b = 0; b < SPEED_BINS.length; b++) {
      const speedDef = SPEED_BINS[b];
      const bin = bins[b];

      // 1. Tail segments: whisper-thin (0.55px * dpr)
      if (bin.tailSegments.length > 0) {
        ctx.beginPath();
        for (let s = 0; s < bin.tailSegments.length; s++) {
          const seg = bin.tailSegments[s];
          ctx.moveTo(seg.x0, seg.y0);
          ctx.lineTo(seg.x1, seg.y1);
        }
        ctx.strokeStyle = `rgba(${speedDef.rgb}, 0.22)`;
        ctx.lineWidth = 0.55 * dpr;
        ctx.stroke();
      }

      // 2. Mid segments: delicate (0.75px * dpr)
      if (bin.midSegments.length > 0) {
        ctx.beginPath();
        for (let s = 0; s < bin.midSegments.length; s++) {
          const seg = bin.midSegments[s];
          ctx.moveTo(seg.x0, seg.y0);
          ctx.lineTo(seg.x1, seg.y1);
        }
        ctx.strokeStyle = `rgba(${speedDef.rgb}, 0.55)`;
        ctx.lineWidth = 0.75 * dpr;
        ctx.stroke();
      }

      // 3. Head segments: sleek streamlet line (0.95px * dpr)
      if (bin.headSegments.length > 0) {
        ctx.beginPath();
        for (let s = 0; s < bin.headSegments.length; s++) {
          const seg = bin.headSegments[s];
          ctx.moveTo(seg.x0, seg.y0);
          ctx.lineTo(seg.x1, seg.y1);
        }
        ctx.strokeStyle = `rgba(${speedDef.rgb}, 0.88)`;
        ctx.lineWidth = 0.95 * dpr;
        ctx.stroke();
      }

      // 4. Luminous spark head beads (0.85px radius * dpr)
      if (bin.beads.length > 0) {
        ctx.beginPath();
        const r = 0.85 * dpr;
        for (let s = 0; s < bin.beads.length; s++) {
          const bead = bin.beads[s];
          ctx.moveTo(bead.x + r, bead.y);
          ctx.arc(bead.x, bead.y, r, 0, Math.PI * 2);
        }
        ctx.fillStyle = `rgba(${speedDef.rgb}, 0.95)`;
        ctx.fill();
      }
    }

    ctx.restore();
  }

  public dispose(): void {
    this.isDisposed = true;

    if (this.removePostRenderListener) {
      this.removePostRenderListener();
      this.removePostRenderListener = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }

    this.particles = [];
    this.validCells = [];
  }
}
