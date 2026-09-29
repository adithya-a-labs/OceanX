/**
 * Globe Types
 * Shared contract between KKJ (globe implementation) and Anush (UI)
 */

import type { OceanVariable, CameraState, ArgoMarker } from '../../types';

/**
 * Globe Events Interface
 * KKJ implements these; Anush consumes via Zustand bridge
 */
export interface GlobeEvents {
  // KKJ (globe) -> Anush (UI)
  onArgoMarkerClick: (marker: ArgoMarker) => void;
  onGlobeReady: () => void;
  onCameraChange: (camera: CameraState) => void;

  // Anush (UI) -> KKJ (globe)
  setVariable: (variable: OceanVariable) => void;
  setDepth: (depth: number) => void;
  setTime: (time: string) => void;
  setShowArgo: (show: boolean) => void;
  setShowCurrents: (show: boolean) => void;
  setSelectedArgoId: (id: string | null) => void;
}

/**
 * Globe Configuration
 * Passed to KKJ's globe initialization
 */
export interface GlobeConfig {
  container: HTMLDivElement;
  initialState: {
    variable: OceanVariable;
    depth: number;
    time: string;
    bounds: { north: number; south: number; east: number; west: number };
    showArgo: boolean;
    showCurrents: boolean;
  };
  events: GlobeEvents;
  demoDataPath: string;
}

/**
 * Globe Instance
 * Returned by KKJ's initialization function
 */
export interface GlobeInstance {
  dispose: () => void;
  setCamera: (camera: Partial<CameraState>) => void;
  setVariable: (variable: OceanVariable) => void;
  setDepth: (depth: number) => void;
  setTime: (time: string) => void;
  setShowArgo: (show: boolean) => void;
  setShowCurrents: (show: boolean) => void;
  highlightMarker: (markerId: string, highlight: boolean) => void;
  fitToBounds: (bounds: { north: number; south: number; east: number; west: number }) => void;
  captureFrame: () => Promise<Blob>;
  startRecording: (options?: { fps?: number; duration?: number }) => Promise<void>;
  stopRecording: () => Promise<Blob>;
}

/**
 * Globe initialization function signature
 * KKJ implements this; Anush calls it
 */
export type InitializeGlobe = (config: GlobeConfig) => Promise<GlobeInstance>;