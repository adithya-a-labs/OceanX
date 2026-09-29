/**
 * OceanX Data Hooks
 * Wrappers around Prabhu's helper functions
 * We only import types and call helpers - Prabhu implements the helpers
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OceanVariable, OceanSlice, ArgoProfile, ArgoComparison, CurrentsData } from '../types';

// Type definitions for Prabhu's helper functions
// These are the functions Prabhu will implement in demoData.ts
interface DemoDataHelpers {
  getOceanSlice: (variable: OceanVariable, depth: number, time: string) => Promise<OceanSlice>;
  getArgoProfiles: (variable: OceanVariable, depth: number, time: string) => Promise<ArgoProfile[]>;
  getComparison: (observationId: string) => Promise<ArgoComparison>;
  getCurrents: (time: string) => Promise<CurrentsData>;
}

// We'll import the actual helpers from Prabhu's module
// For now, define the interface
let demoDataHelpers: DemoDataHelpers | null = null;

export function setDemoDataHelpers(helpers: DemoDataHelpers) {
  demoDataHelpers = helpers;
}

function getHelpers(): DemoDataHelpers {
  if (!demoDataHelpers) {
    throw new Error('Demo data helpers not initialized. Call setDemoDataHelpers() first.');
  }
  return demoDataHelpers;
}

/**
 * Hook for fetching ocean slice data
 */
export function useOceanSlice(variable: OceanVariable, depth: number, time: string) {
  return useQuery({
    queryKey: ['oceanSlice', variable, depth, time],
    queryFn: () => getHelpers().getOceanSlice(variable, depth, time),
    enabled: !!variable && depth >= 0 && !!time,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching Argo profiles
 */
export function useArgoProfiles(variable: OceanVariable, depth: number, time: string) {
  return useQuery({
    queryKey: ['argoProfiles', variable, depth, time],
    queryFn: () => getHelpers().getArgoProfiles(variable, depth, time),
    enabled: !!variable && depth >= 0 && !!time,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching comparison data for a specific Argo float
 */
export function useArgoComparison(observationId: string | undefined) {
  return useQuery({
    queryKey: ['argoComparison', observationId],
    queryFn: () => {
      if (!observationId) throw new Error('No observation ID');
      return getHelpers().getComparison(observationId);
    },
    enabled: !!observationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching currents data
 */
export function useCurrents(time: string) {
  return useQuery({
    queryKey: ['currents', time],
    queryFn: () => getHelpers().getCurrents(time),
    enabled: !!time,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation for triggering comparison fetch
 * Used when user clicks an Argo marker
 */
export function useFetchComparison() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (observationId: string) => getHelpers().getComparison(observationId),
    onSuccess: (data) => {
      queryClient.setQueryData(['argoComparison', data.id], data);
    },
  });
}

/**
 * Prefetch functions for performance
 */
export function prefetchOceanSlice(variable: OceanVariable, depth: number, time: string) {
  const queryClient = useQueryClient();
  queryClient.prefetchQuery({
    queryKey: ['oceanSlice', variable, depth, time],
    queryFn: () => getHelpers().getOceanSlice(variable, depth, time),
    staleTime: 5 * 60 * 1000,
  });
}

export function prefetchArgoProfiles(variable: OceanVariable, depth: number, time: string) {
  const queryClient = useQueryClient();
  queryClient.prefetchQuery({
    queryKey: ['argoProfiles', variable, depth, time],
    queryFn: () => getHelpers().getArgoProfiles(variable, depth, time),
    staleTime: 5 * 60 * 1000,
  });
}