/**
 * OceanX Cesium Currents Particle System
 * Animated ocean-current particle flow field rendered with Cesium PointPrimitiveCollection.
 * Consumes u/v vector components from CurrentsData and computes smooth particle trajectories.
 */

import * as Cesium from 'cesium';
import type { CurrentsData } from '../types';

interface Particle {
  lon: number;
  lat: number;
  prevLon: number;
  prevLat: number;
  age: number;
  maxAge: number;
  speed: number;
}

/** Samples a nullable u/v grid. Missing values yield 0 rather than NaN. */
function bilinear(
  grid: (number | null)[][],
  r0: number,
  c0: number,
  r1: number,
  c1: number,
  fx: number,
  fy: number,
): number {
  const a = grid[r0][c0];
  const b = grid[r0][c1];
  const c = grid[r1][c0];
  const d = grid[r1][c1];
  if (a === null || b === null || c === null || d === null) return 0;
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

export class CurrentsParticleSystem {
  private viewer: Cesium.Viewer;
  private pointsCollection: Cesium.PointPrimitiveCollection | null = null;
  private particles: Particle[] = [];
  private headPoints: Cesium.PointPrimitive[] = [];
  private tailPoints: Cesium.PointPrimitive[] = [];
  private currentData: CurrentsData | null = null;
  private removePreRenderListener: (() => void) | null = null;
  private isVisible = false;
  private particleCount = 1000;
  private isDisposed = false;
  private lastTime = 0;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.initCollection();
    this.attachRenderLoop();
  }

  private initCollection(): void {
    const scene = this.viewer.scene;
    this.pointsCollection = scene.primitives.add(new Cesium.PointPrimitiveCollection());
    if (!this.pointsCollection) return;

    this.pointsCollection.show = false;

    // Create particles and primitive points
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.createRandomParticle();
      this.particles.push(p);

      const head = this.pointsCollection.add({
        position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 2500),
        color: Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.0),
        pixelSize: 3.5,
      });
      this.headPoints.push(head);

      const tail = this.pointsCollection.add({
        position: Cesium.Cartesian3.fromDegrees(p.prevLon, p.prevLat, 2000),
        color: Cesium.Color.fromCssColorString('#0ea5e9').withAlpha(0.0),
        pixelSize: 2.0,
      });
      this.tailPoints.push(tail);
    }
  }

  private createRandomParticle(): Particle {
    const bounds = this.currentData?.bounds || { north: 18, south: 12, west: 82, east: 90 };
    const lon = bounds.west + Math.random() * (bounds.east - bounds.west);
    const lat = bounds.south + Math.random() * (bounds.north - bounds.south);

    return {
      lon,
      lat,
      prevLon: lon,
      prevLat: lat,
      age: Math.random() * 2.0,
      maxAge: 1.8 + Math.random() * 2.2,
      speed: 0.2,
    };
  }

  public updateCurrents(data: CurrentsData): void {
    this.currentData = data;
    // Respawn existing particles smoothly within new bounds
    for (const p of this.particles) {
      const bounds = data.bounds;
      p.lon = bounds.west + Math.random() * (bounds.east - bounds.west);
      p.lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      p.prevLon = p.lon;
      p.prevLat = p.lat;
      p.age = Math.random() * p.maxAge;
    }
  }

  public setShow(show: boolean): void {
    this.isVisible = show;
    if (this.pointsCollection) {
      this.pointsCollection.show = show;
    }
    if (show && !this.lastTime) {
      this.lastTime = performance.now();
    }
  }

  private sampleVelocity(lon: number, lat: number): { u: number; v: number } {
    if (!this.currentData || !this.currentData.u || this.currentData.u.length === 0) {
      return { u: 0.1, v: 0.1 };
    }

    const { bounds, u, v } = this.currentData;
    const rows = u.length;
    const cols = u[0].length;

    // Fractional coordinates in grid
    const normX = (lon - bounds.west) / (bounds.east - bounds.west);
    const normY = (bounds.north - lat) / (bounds.north - bounds.south);

    if (normX < 0 || normX > 1 || normY < 0 || normY > 1) {
      return { u: 0, v: 0 };
    }

    const gx = normX * (cols - 1);
    const gy = normY * (rows - 1);

    const c0 = Math.floor(gx);
    const c1 = Math.min(cols - 1, c0 + 1);
    const r0 = Math.floor(gy);
    const r1 = Math.min(rows - 1, r0 + 1);

    const fx = gx - c0;
    const fy = gy - r0;

    // Bilinear interpolation for u and v. A cell touching a missing value has no
    // defined interpolation, so it samples as zero velocity and the particle
    // stalls there rather than being given an invented direction.
    const uInterp = bilinear(u, r0, c0, r1, c1, fx, fy);
    const vInterp = bilinear(v, r0, c0, r1, c1, fx, fy);

    return { u: uInterp, v: vInterp };
  }

  private attachRenderLoop(): void {
    const onPreRender = () => {
      if (this.isDisposed || !this.isVisible || !this.pointsCollection) return;

      const now = performance.now();
      const dt = Math.min(0.05, (now - (this.lastTime || now)) / 1000);
      this.lastTime = now;

      const bounds = this.currentData?.bounds || { north: 18, south: 12, west: 82, east: 90 };
      const speedScale = 0.95; // Visual scaling factor for particle speed

      for (let i = 0; i < this.particleCount; i++) {
        const p = this.particles[i];
        const head = this.headPoints[i];
        const tail = this.tailPoints[i];

        p.prevLon = p.lon;
        p.prevLat = p.lat;

        const { u, v } = this.sampleVelocity(p.lon, p.lat);
        p.speed = Math.hypot(u, v);

        // Convert velocity to geographic displacement
        const cosLat = Math.max(0.1, Math.cos((p.lat * Math.PI) / 180));
        const dLon = ((u * speedScale) / cosLat) * dt;
        const dLat = v * speedScale * dt;

        p.lon += dLon;
        p.lat += dLat;
        p.age += dt;

        // Check if out of bounds or exceeded max age
        const isOutOfBounds =
          p.lon < bounds.west ||
          p.lon > bounds.east ||
          p.lat < bounds.south ||
          p.lat > bounds.north;

        if (isOutOfBounds || p.age >= p.maxAge) {
          p.lon = bounds.west + Math.random() * (bounds.east - bounds.west);
          p.lat = bounds.south + Math.random() * (bounds.north - bounds.south);
          p.prevLon = p.lon;
          p.prevLat = p.lat;
          p.age = 0;
          p.maxAge = 1.8 + Math.random() * 2.2;
        }

        // Life alpha fade curve: sin(0 to PI)
        const lifeFraction = p.age / p.maxAge;
        const alpha = Math.sin(lifeFraction * Math.PI);

        // Color based on speed: fast particles brighter white/cyan
        const speedNorm = Math.min(1.0, p.speed / 0.5);
        const r = Math.round(34 + speedNorm * 180);
        const g = Math.round(211 + speedNorm * 44);
        const b = 255;

        // Update Cesium primitives in-place
        head.position = Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 2500);
        head.color = new Cesium.Color(r / 255, g / 255, b / 255, alpha * 0.95);

        tail.position = Cesium.Cartesian3.fromDegrees(p.prevLon, p.prevLat, 2000);
        tail.color = new Cesium.Color(14 / 255, 165 / 255, 233 / 255, alpha * 0.45);
      }
    };

    const removeListener = this.viewer.scene.preRender.addEventListener(onPreRender);
    this.removePreRenderListener = () => {
      removeListener();
    };
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.removePreRenderListener) {
      this.removePreRenderListener();
      this.removePreRenderListener = null;
    }
    if (this.pointsCollection) {
      this.viewer.scene.primitives.remove(this.pointsCollection);
      this.pointsCollection = null;
    }
    this.particles = [];
    this.headPoints = [];
    this.tailPoints = [];
  }
}
