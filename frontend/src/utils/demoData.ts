/**
 * OceanX Demo Data Helpers
 * 
 * PRAHBU OWNS THE IMPLEMENTATION OF THESE FUNCTIONS
 * Anush (UI) and KKJ (globe) only CONSUME these helpers
 * 
 * This file defines the interface. Prabhu implements the actual
 * data fetching from frontend/public/demo-data/
 */

import type { OceanVariable, OceanSlice, ArgoProfile, ArgoComparison, CurrentsData } from '../types';

export interface DemoDataHelpers {
  getOceanSlice: (variable: OceanVariable, depth: number, time: string) => Promise<OceanSlice>;
  getArgoProfiles: (variable: OceanVariable, depth: number, time: string) => Promise<ArgoProfile[]>;
  getComparison: (observationId: string) => Promise<ArgoComparison>;
  getCurrents: (time: string) => Promise<CurrentsData>;
}

/**
 * Initialize demo data helpers
 * Prabhu calls this once at app startup with actual implementations
 */
export function createDemoDataHelpers(basePath: string = '/demo-data'): DemoDataHelpers {
  const fetchJSON = async <T>(path: string): Promise<T> => {
    const response = await fetch(`${basePath}${path}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }
    return response.json();
  };

  return {
    async getOceanSlice(variable, depth, _time) {
      // Format: /demo-data/ocean-slices/temperature-0m.json
      const depthStr = depth === 0 ? '0m' : `${depth}m`;
      return fetchJSON(`/ocean-slices/${variable}-${depthStr}.json`);
    },

    async getArgoProfiles(variable, _depth, _time) {
      // Format: /demo-data/argo-profiles.json (filter client-side or server-side)
      const profiles = await fetchJSON<ArgoProfile[]>('/argo-profiles.json');
      // Filter by variable availability if needed
      return profiles.filter(p => 
        (variable === 'temperature' && p.temperature.length > 0) ||
        (variable === 'salinity' && p.salinity.length > 0)
      );
    },

    async getComparison(observationId) {
      // Format: /demo-data/comparison/argo_demo_001.json
      return fetchJSON(`/comparison/${observationId}.json`);
    },

    async getCurrents(_time) {
      // Format: /demo-data/currents.json
      return fetchJSON('/currents.json');
    },
  };
}

/**
 * Mock data helpers for development (before Prabhu's real implementation)
 * These use static mock data matching the Notion spec
 */
export function createMockDemoDataHelpers(): DemoDataHelpers {
  // Mock ocean slice data
  const mockOceanSlice: OceanSlice = {
    variable: 'temperature',
    depth: 0,
    time: '2026-09-24T12:00:00Z',
    data: Array(100).fill(null).map(() => Array(100).fill(null).map(() => 25 + Math.random() * 5)),
    bounds: { north: 18, south: 12, east: 90, west: 82 },
    metadata: {
      min: 20,
      max: 30,
      unit: '°C',
      colorScale: ['#0ea5e9', '#f97316', '#ef4444'],
    },
  };

  const mockArgoProfiles: ArgoProfile[] = [
    {
      id: 'argo_demo_001',
      latitude: 15.2,
      longitude: 87.1,
      time: '2026-09-24T12:00:00Z',
      depth: [0, 50, 100, 200],
      temperature: [29.1, 27.4, 24.1, 18.3],
      salinity: [34.2, 34.5, 34.8, 35.0],
    },
    {
      id: 'argo_demo_002',
      latitude: 13.5,
      longitude: 85.8,
      time: '2026-09-24T12:00:00Z',
      depth: [0, 50, 100, 200],
      temperature: [28.8, 27.0, 23.8, 18.0],
      salinity: [33.9, 34.3, 34.7, 34.9],
    },
    {
      id: 'argo_demo_003',
      latitude: 16.8,
      longitude: 88.5,
      time: '2026-09-24T12:00:00Z',
      depth: [0, 50, 100, 200],
      temperature: [29.5, 27.8, 24.5, 18.8],
      salinity: [34.5, 34.7, 35.0, 35.1],
    },
    {
      id: 'argo_demo_004',
      latitude: 14.2,
      longitude: 84.5,
      time: '2026-09-24T12:00:00Z',
      depth: [0, 50, 100, 200],
      temperature: [28.2, 26.5, 23.2, 17.5],
      salinity: [33.5, 34.0, 34.5, 34.8],
    },
    {
      id: 'argo_demo_005',
      latitude: 17.0,
      longitude: 83.0,
      time: '2026-09-24T12:00:00Z',
      depth: [0, 50, 100, 200],
      temperature: [27.9, 26.2, 22.8, 17.2],
      salinity: [33.2, 33.8, 34.3, 34.6],
    },
  ];

  const mockComparison: ArgoComparison = {
    id: 'argo_demo_001',
    latitude: 15.2,
    longitude: 87.1,
    time: '2026-09-24T12:00:00Z',
    variable: 'temperature',
    depth: [0, 50, 100, 200],
    observed: [29.1, 27.4, 24.1, 18.3],
    model: [28.8, 27.1, 23.9, 18.0],
    difference: [0.3, 0.3, 0.2, 0.3],
    rmse: 0.28,
  };

  const mockCurrents: CurrentsData = {
    time: '2026-09-24T12:00:00Z',
    u: Array(50).fill(null).map(() => Array(50).fill(null).map(() => (Math.random() - 0.5) * 0.5)),
    v: Array(50).fill(null).map(() => Array(50).fill(null).map(() => (Math.random() - 0.5) * 0.5)),
    bounds: { north: 18, south: 12, east: 90, west: 82 },
  };

  return {
    async getOceanSlice(variable, depth, time) {
      await new Promise(r => setTimeout(r, 100)); // Simulate network
      return { ...mockOceanSlice, variable, depth, time };
    },

    async getArgoProfiles(variable, _depth, _time) {
      await new Promise(r => setTimeout(r, 100));
      return mockArgoProfiles.filter(p => 
        (variable === 'temperature' && p.temperature.length > 0) ||
        (variable === 'salinity' && p.salinity.length > 0)
      );
    },

    async getComparison(observationId) {
      await new Promise(r => setTimeout(r, 150));
      if (!mockArgoProfiles.find(p => p.id === observationId)) {
        throw new Error('Observation not found');
      }
      return { ...mockComparison, id: observationId };
    },

    async getCurrents(_time) {
      await new Promise(r => setTimeout(r, 100));
      return mockCurrents;
    },
  };
}

export type { OceanSlice, ArgoProfile, ArgoComparison, CurrentsData } from '../types';