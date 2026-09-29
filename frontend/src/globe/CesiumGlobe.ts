/**
 * OceanX Cesium 3D Globe Engine
 * Core viewer, camera controller, and visual rendering coordinator.
 * Implements Google Earth for the ocean aesthetic with dark space and cinematic transitions.
 */

import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import type { OceanVariable, CameraState } from '../types';
import type { GlobeConfig, GlobeInstance } from '../components/globe/types';
import { OceanLayerRenderer } from './OceanLayerRenderer';
import { CurrentsParticleSystem } from './CurrentsParticleSystem';
import { ArgoMarkerRenderer } from './ArgoMarkerRenderer';
import { createGlobeDataAdapter, type GlobeDataAdapter } from './dataAdapter';

// Configure Cesium static asset base URL before viewer creation
if (typeof window !== 'undefined') {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = '/cesium/';
}

// Ensure Cesium default token is cleared (we use local imagery)
Cesium.Ion.defaultAccessToken = '';

export class CesiumGlobe implements GlobeInstance {
  private viewer: Cesium.Viewer;
  private container: HTMLDivElement;
  private config: GlobeConfig;
  private dataAdapter: GlobeDataAdapter;

  private oceanLayerRenderer: OceanLayerRenderer;
  private currentsSystem: CurrentsParticleSystem;
  private argoRenderer: ArgoMarkerRenderer;

  private resizeObserver: ResizeObserver | null = null;
  private cameraRemoveListener: (() => void) | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isDisposed = false;

  // Track active visualization parameters
  private currentVariable: OceanVariable;
  private currentDepth: number;
  private currentTime: string;
  private isCurrentsVisible: boolean;
  private isArgoVisible: boolean;

  constructor(config: GlobeConfig, viewer: Cesium.Viewer) {
    this.config = config;
    this.container = config.container;
    this.viewer = viewer;

    this.currentVariable = config.initialState.variable;
    this.currentDepth = config.initialState.depth;
    this.currentTime = config.initialState.time;
    this.isCurrentsVisible = config.initialState.showCurrents;
    this.isArgoVisible = config.initialState.showArgo;

    this.dataAdapter = createGlobeDataAdapter(config.demoDataPath || '/demo-data');

    // Initialize sub-renderers
    this.oceanLayerRenderer = new OceanLayerRenderer(this.viewer);
    this.currentsSystem = new CurrentsParticleSystem(this.viewer);
    this.argoRenderer = new ArgoMarkerRenderer(this.viewer, config.events, this.container);

    this.setupCameraSync();
    this.setupResizeHandler();
  }

  public static async create(config: GlobeConfig): Promise<CesiumGlobe> {
    const container = config.container;

    // Clean up any stale canvas or elements in container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Configure base imagery provider using offline NaturalEarthII tiles as reliable base
    let baseImageryProvider: Cesium.ImageryProvider | undefined;
    try {
      baseImageryProvider = await Cesium.TileMapServiceImageryProvider.fromUrl(
        Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
      );
    } catch (e) {
      console.warn('[CesiumGlobe] Could not load NaturalEarthII imagery, using ellipsoid base:', e);
    }

    // Create Cesium Viewer with no default UI clutter
    const viewer = new Cesium.Viewer(container, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      scene3DOnly: true,
      shouldAnimate: true,
      baseLayer: baseImageryProvider ? new Cesium.ImageryLayer(baseImageryProvider) : undefined,
    });

    // Add ultra-sharp high-resolution satellite imagery layer (ESRI World Imagery up to level 19)
    try {
      const highResImagery = new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        maximumLevel: 19,
        credit: 'Esri, Maxar, Earthstar Geographics',
      });
      viewer.imageryLayers.addImageryProvider(highResImagery);
    } catch (err) {
      console.warn('[CesiumGlobe] High-res imagery fallback active:', err);
    }

    // High quality display resolution matching physical device pixels (Retina / 4K)
    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1.0, 2.0);

    // Style the scene for the "advanced Google Earth for the ocean" aesthetic
    const scene = viewer.scene;
    const globe = scene.globe;

    // Multi-sample anti-aliasing (MSAA) & FXAA for sharp, non-jagged rendering
    scene.msaaSamples = 4;
    scene.postProcessStages.fxaa.enabled = true;

    // High detail level of detail (LOD) threshold: loads sharper tiles sooner
    globe.maximumScreenSpaceError = 1.33;
    globe.tileCacheSize = 300;

    // Dark space background
    scene.backgroundColor = Cesium.Color.fromCssColorString('#020617');
    globe.baseColor = Cesium.Color.fromCssColorString('#082f49');

    // Subtle atmospheric glow
    globe.showGroundAtmosphere = true;
    globe.enableLighting = false;
    scene.highDynamicRange = true;

    // Set initial space camera position (looking at Earth from orbit)
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(65.0, 16.0, 16000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-89),
        roll: 0,
      },
    });

    const globeInstance = new CesiumGlobe(config, viewer);
    await globeInstance.initializeLayers();

    return globeInstance;
  }

  /**
   * Initial data loading and camera transition into Bay of Bengal
   */
  private async initializeLayers(): Promise<void> {
    // 1. Load initial ocean slice (temperature / salinity)
    await this.refreshOceanSlice();

    // 2. Load currents vector field
    await this.refreshCurrents();

    // 3. Load Argo markers
    await this.refreshArgoMarkers();

    // 4. Set initial visibility
    this.currentsSystem.setShow(this.isCurrentsVisible);
    this.argoRenderer.setShow(this.isArgoVisible);

    // 5. Notify that globe is ready
    this.container.dataset.globeReady = 'true';
    this.config.events.onGlobeReady();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oceanx:globe-ready'));
    }

    // 6. Smooth cinematic flyTo Bay of Bengal
    this.flyToBayOfBengal(2.5);
  }

  /**
   * Smoothly fly camera to Bay of Bengal demonstration focus
   */
  public flyToBayOfBengal(duration: number = 2.5): void {
    if (this.isDisposed) return;

    // Bay of Bengal center: lon 86.2°E, lat 14.8°N, altitude ~2,500 km
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(86.2, 14.6, 2500000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-76),
        roll: 0,
      },
      duration,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }

  /**
   * Fit camera view to specific geographic bounds
   */
  public fitToBounds(bounds: { north: number; south: number; east: number; west: number }): void {
    if (this.isDisposed) return;
    const rectangle = Cesium.Rectangle.fromDegrees(bounds.west, bounds.south, bounds.east, bounds.north);
    this.viewer.camera.flyTo({
      destination: rectangle,
      duration: 1.8,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }

  public setCamera(camera: Partial<CameraState>): void {
    if (this.isDisposed) return;
    const currentCartographic = this.viewer.camera.positionCartographic;
    const lon = camera.longitude ?? Cesium.Math.toDegrees(currentCartographic.longitude);
    const lat = camera.latitude ?? Cesium.Math.toDegrees(currentCartographic.latitude);
    const height = camera.zoom ? (18 - camera.zoom) * 1000000 : currentCartographic.height;

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
      orientation: {
        heading: camera.bearing ? Cesium.Math.toRadians(camera.bearing) : this.viewer.camera.heading,
        pitch: camera.pitch ? Cesium.Math.toRadians(camera.pitch) : this.viewer.camera.pitch,
        roll: 0,
      },
      duration: 1.0,
    });
  }

  private setupCameraSync(): void {
    const onCameraChange = () => {
      if (this.isDisposed) return;
      const c = this.viewer.camera.positionCartographic;
      if (!c) return;

      const lon = Cesium.Math.toDegrees(c.longitude);
      const lat = Cesium.Math.toDegrees(c.latitude);
      const zoom = Math.max(1, Math.min(18, 18 - c.height / 1000000));
      const bearing = Cesium.Math.toDegrees(this.viewer.camera.heading);
      const pitch = Cesium.Math.toDegrees(this.viewer.camera.pitch);

      this.config.events.onCameraChange({
        longitude: Number(lon.toFixed(4)),
        latitude: Number(lat.toFixed(4)),
        zoom: Number(zoom.toFixed(2)),
        bearing: Number(bearing.toFixed(2)),
        pitch: Number(pitch.toFixed(2)),
      });
    };

    const removeListener = this.viewer.camera.changed.addEventListener(onCameraChange);
    this.cameraRemoveListener = () => {
      removeListener();
    };
  }

  private setupResizeHandler(): void {
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.isDisposed && this.viewer) {
          this.viewer.resize();
        }
      });
      this.resizeObserver.observe(this.container);
    }
  }

  // --- Public State Setters called by UI Store ---

  public async setVariable(variable: OceanVariable): Promise<void> {
    if (this.currentVariable === variable) return;
    this.currentVariable = variable;

    if (variable === 'currents') {
      // In currents mode, enable current particles
      this.setShowCurrents(true);
    } else {
      await this.refreshOceanSlice();
    }
  }

  public async setDepth(depth: number): Promise<void> {
    if (this.currentDepth === depth) return;
    this.currentDepth = depth;
    await this.refreshOceanSlice();
  }

  public async setTime(time: string): Promise<void> {
    if (this.currentTime === time) return;
    this.currentTime = time;
    await Promise.all([
      this.refreshOceanSlice(),
      this.refreshCurrents(),
      this.refreshArgoMarkers(),
    ]);
  }

  public setShowArgo(show: boolean): void {
    this.isArgoVisible = show;
    this.argoRenderer.setShow(show);
  }

  public setShowCurrents(show: boolean): void {
    this.isCurrentsVisible = show;
    this.currentsSystem.setShow(show);
  }

  public highlightMarker(markerId: string, highlight: boolean): void {
    this.argoRenderer.setSelectedId(highlight ? markerId : null);
  }

  // --- Data Fetching & Layer Updates ---

  private async refreshOceanSlice(): Promise<void> {
    try {
      const slice = await this.dataAdapter.getOceanSlice(
        this.currentVariable,
        this.currentDepth,
        this.currentTime
      );
      await this.oceanLayerRenderer.renderSlice(slice);
    } catch (err) {
      console.error('[CesiumGlobe] Error refreshing ocean slice:', err);
    }
  }

  private async refreshCurrents(): Promise<void> {
    try {
      const currentsData = await this.dataAdapter.getCurrents(this.currentTime);
      this.currentsSystem.updateCurrents(currentsData);
    } catch (err) {
      console.error('[CesiumGlobe] Error refreshing currents:', err);
    }
  }

  private async refreshArgoMarkers(): Promise<void> {
    try {
      const profiles = await this.dataAdapter.getArgoProfiles(
        this.currentVariable,
        this.currentDepth,
        this.currentTime
      );
      this.argoRenderer.setProfiles(profiles);
    } catch (err) {
      console.error('[CesiumGlobe] Error refreshing Argo markers:', err);
    }
  }

  // --- Frame Capture & Recording Interface ---

  public async captureFrame(): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      this.viewer.render();
      const canvas = this.viewer.canvas;
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to capture frame'));
      }, 'image/png');
    });
  }

  public async startRecording(options?: { fps?: number; duration?: number }): Promise<void> {
    const fps = options?.fps ?? 30;
    const stream = this.viewer.canvas.captureStream(fps);
    this.recordedChunks = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    this.mediaRecorder = new MediaRecorder(stream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };
    this.mediaRecorder.start(100);

    if (options?.duration) {
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }, options.duration * 1000);
    }
  }

  public async stopRecording(): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not active'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recordedChunks = [];
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.cameraRemoveListener) {
      this.cameraRemoveListener();
      this.cameraRemoveListener = null;
    }

    this.oceanLayerRenderer.dispose();
    this.currentsSystem.dispose();
    this.argoRenderer.dispose();

    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
    }
  }
}
