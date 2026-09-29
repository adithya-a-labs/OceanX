/**
 * Argo-specific types
 * Extends base ocean types with Argo-specific data
 */

import type { OceanVariable, ArgoProfile, ArgoComparison, ArgoMarker } from './ocean';

export type { ArgoProfile, ArgoComparison, ArgoMarker, OceanVariable };

export interface ArgoPanelState {
  isOpen: boolean;
  selectedArgoId: string | null;
  profile: ArgoProfile | null;
  comparison: ArgoComparison | null;
  isLoading: boolean;
  error: string | null;
}

export interface ArgoMetadata {
  platformNumber: string;
  projectName: string;
  piName: string;
  dataMode: 'R' | 'D' | 'A'; // Real-time, Delayed, Adjusted
  deploymentDate: string;
  lastLocationDate: string;
  cycleNumber: number;
}

export interface ArgoFloatSummary {
  id: string;
  platformNumber: string;
  latitude: number;
  longitude: number;
  lastProfileDate: string;
  profileCount: number;
  variables: OceanVariable[];
}

export type ArgoDataMode = 'real-time' | 'delayed' | 'adjusted';