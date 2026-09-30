/**
 * OceanX Cesium Ocean Layer Renderer
 * Renders scientific scalar fields (temperature, salinity) onto the Cesium globe.
 * Creates a smooth, continuous oceanographic heatmap over the source grid.
 */

import * as Cesium from 'cesium';
import type { OceanSlice } from '../types';

interface ColorStop {
  stop: number;
  r: number;
  g: number;
  b: number;
}

// Continuous scientific temperature gradient: Deep Blue -> Cyan -> Yellow -> Orange -> Red
const TEMP_COLOR_STOPS: ColorStop[] = [
  { stop: 0.0, r: 14, g: 130, b: 215 },   // #0e82d7 deep ocean blue
  { stop: 0.25, r: 6, g: 182, b: 212 },   // #06b6d4 vibrant cyan
  { stop: 0.50, r: 234, g: 179, b: 8 },   // #eab308 warm golden yellow
  { stop: 0.75, r: 249, g: 115, b: 22 },  // #f97316 bright orange
  { stop: 1.0, r: 239, g: 68, b: 68 },    // #ef4444 warm crimson red
];

// Continuous scientific salinity gradient: Deep Navy -> Ocean Blue -> Teal -> Aqua -> Light Seafoam
const SALINITY_COLOR_STOPS: ColorStop[] = [
  { stop: 0.0, r: 12, g: 74, b: 110 },   // #0c4a6e deep ocean navy
  { stop: 0.30, r: 2, g: 132, b: 199 },  // #0284c7 medium ocean blue
  { stop: 0.60, r: 6, g: 182, b: 212 },  // #06b6d4 teal cyan
  { stop: 0.85, r: 103, g: 232, b: 249 },// #67e8f9 bright aqua
  { stop: 1.0, r: 207, g: 250, b: 254 }, // #cffafe light seafoam
];

function buildColorLUT(stops: ColorStop[]): Uint8Array {
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let s0 = stops[0];
    let s1 = stops[stops.length - 1];

    for (let j = 0; j < stops.length - 1; j++) {
      if (t >= stops[j].stop && t <= stops[j + 1].stop) {
        s0 = stops[j];
        s1 = stops[j + 1];
        break;
      }
    }

    const range = Math.max(0.0001, s1.stop - s0.stop);
    const factor = (t - s0.stop) / range;

    lut[i * 3 + 0] = Math.round(s0.r + (s1.r - s0.r) * factor);
    lut[i * 3 + 1] = Math.round(s0.g + (s1.g - s0.g) * factor);
    lut[i * 3 + 2] = Math.round(s0.b + (s1.b - s0.b) * factor);
  }
  return lut;
}

const TEMP_LUT = buildColorLUT(TEMP_COLOR_STOPS);
const SALINITY_LUT = buildColorLUT(SALINITY_COLOR_STOPS);

export class OceanLayerRenderer {
  private viewer: Cesium.Viewer;
  private currentLayer: Cesium.ImageryLayer | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private canvasSize = 1024;
  private isDisposed = false;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvasSize;
    this.canvas.height = this.canvasSize;
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to get 2D context for OceanLayerRenderer');
    this.ctx = ctx;
  }

  /**
   * Update the active ocean scalar layer (temperature or salinity)
   * Renders a continuous, translucent heatmap across the source grid bounds.
   */
  public async renderSlice(slice: OceanSlice): Promise<void> {
    if (this.isDisposed) return;

    const { variable, data, bounds, metadata } = slice;
    if (!data || data.length === 0 || !data[0] || data[0].length === 0) return;

    const rows = data.length;
    const cols = data[0].length;
    const minVal = metadata?.min ?? 20;
    const maxVal = metadata?.max ?? 32;
    const valRange = Math.max(0.001, maxVal - minVal);

    const lut = variable === 'salinity' ? SALINITY_LUT : TEMP_LUT;

    // Draw high-resolution smooth interpolated image onto 1024x1024 canvas
    const imgData = this.ctx.createImageData(this.canvasSize, this.canvasSize);
    const pixels = imgData.data;

    const oceanAlpha = Math.round(0.52 * 255); // Satellite imagery remains visible

    for (let py = 0; py < this.canvasSize; py++) {
      // Row 0 in canvas is North (top)
      const gy = (py / (this.canvasSize - 1)) * (rows - 1);
      const r0 = Math.floor(gy);
      const r1 = Math.min(rows - 1, r0 + 1);
      const fy = gy - r0;
      // Smooth Hermite curve for vertical interpolation
      const sfy = fy * fy * (3 - 2 * fy);

      for (let px = 0; px < this.canvasSize; px++) {
        const pIdx = (py * this.canvasSize + px) * 4;

        // Col 0 in canvas is West (left)
        const gx = (px / (this.canvasSize - 1)) * (cols - 1);
        const c0 = Math.floor(gx);
        const c1 = Math.min(cols - 1, c0 + 1);
        const fx = gx - c0;
        // Smooth Hermite curve for horizontal interpolation
        const sfx = fx * fx * (3 - 2 * fx);

        // Smoothly interpolated scalar value
        const v00 = data[r0][c0];
        const v10 = data[r0][c1];
        const v01 = data[r1][c0];
        const v11 = data[r1][c1];

        // A cell touching a missing value has no defined interpolation: lerping
        // null yields NaN, and a NaN colour index would paint a bogus value.
        // Leave the cell fully transparent instead of inventing data.
        if (v00 === null || v10 === null || v01 === null || v11 === null) {
          pixels[pIdx + 0] = 0;
          pixels[pIdx + 1] = 0;
          pixels[pIdx + 2] = 0;
          pixels[pIdx + 3] = 0;
          continue;
        }

        const top = v00 * (1 - sfx) + v10 * sfx;
        const bottom = v01 * (1 - sfx) + v11 * sfx;
        const val = top * (1 - sfy) + bottom * sfy;

        // Continuous normalized gradient lookup
        const norm = Math.max(0, Math.min(1, (val - minVal) / valRange));
        const lutIdx = Math.round(norm * 255);

        pixels[pIdx + 0] = lut[lutIdx * 3 + 0];
        pixels[pIdx + 1] = lut[lutIdx * 3 + 1];
        pixels[pIdx + 2] = lut[lutIdx * 3 + 2];
        pixels[pIdx + 3] = oceanAlpha;
      }
    }

    this.ctx.putImageData(imgData, 0, 0);

    const rectangle = Cesium.Rectangle.fromDegrees(
      bounds.west,
      bounds.south,
      bounds.east,
      bounds.north
    );

    const dataUrl = this.canvas.toDataURL('image/png');

    try {
      const provider = await Cesium.SingleTileImageryProvider.fromUrl(dataUrl, {
        rectangle,
      });

      if (this.isDisposed) return;

      const oldLayer = this.currentLayer;
      const newLayer = this.viewer.imageryLayers.addImageryProvider(provider);
      newLayer.alpha = 1.0; // Opacity controlled per pixel; missing cells remain transparent

      this.currentLayer = newLayer;

      if (oldLayer) {
        this.viewer.imageryLayers.remove(oldLayer, true);
      }
    } catch (err) {
      console.error('[OceanLayerRenderer] Failed to create imagery layer:', err);
    }
  }

  public setVisible(visible: boolean): void {
    if (this.currentLayer) {
      this.currentLayer.show = visible;
    }
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.currentLayer) {
      this.viewer.imageryLayers.remove(this.currentLayer, true);
      this.currentLayer = null;
    }
  }
}
