/**
 * OceanX Data Hooks
 * Wrappers around Prabhu's helper functions
 * We only import types and call helpers - Prabhu implements the helpers
 */

import { useQuery } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { OceanVariable } from '../types';
import type { DemoDataHelpers } from '../utils/demoData';

// The helper contract is defined once in utils/demoData. Importing it here
// instead of re-declaring it keeps the adapter and these hooks in agreement.
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
 * Hook for fetching comparison data for a specific Argo float.
 *
 * The observation id is part of the query key, so switching floats can never
 * show one float's model series under another's name. Pass `enabled: false`
 * while the manifest reports the model assets are not ready; the hook then
 * stays idle instead of requesting a file that does not exist.
 */
export function useArgoComparison(observationId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['argoComparison', observationId],
    queryFn: () => {
      if (!observationId) throw new Error('No observation ID');
      return getHelpers().getComparison(observationId);
    },
    enabled: enabled && !!observationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
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
 * Prefetch a float's comparison so the panel can paint immediately.
 *
 * Warm only: a failure here is not surfaced, because a missing comparison
 * asset is an expected state until the Copernicus export lands. The panel's own
 * query then reports the real outcome.
 *
 * Takes the client rather than calling `useQueryClient` itself, so it is safe to
 * call from an effect or an event handler; a hook cannot be invoked from a
 * nested callback.
 */
export function prefetchArgoComparison(
  queryClient: QueryClient,
  observationId: string | undefined,
  enabled: boolean,
) {
  if (!observationId || !enabled) return;
  void queryClient.prefetchQuery({
    queryKey: ['argoComparison', observationId],
    queryFn: () => getHelpers().getComparison(observationId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Prefetch functions for performance
 */
export function prefetchOceanSlice(
  queryClient: QueryClient,
  variable: OceanVariable,
  depth: number,
  time: string,
) {
  void queryClient.prefetchQuery({
    queryKey: ['oceanSlice', variable, depth, time],
    queryFn: () => getHelpers().getOceanSlice(variable, depth, time),
    staleTime: 5 * 60 * 1000,
  });
}

export function prefetchArgoProfiles(
  queryClient: QueryClient,
  variable: OceanVariable,
  depth: number,
  time: string,
) {
  void queryClient.prefetchQuery({
    queryKey: ['argoProfiles', variable, depth, time],
    queryFn: () => getHelpers().getArgoProfiles(variable, depth, time),
    staleTime: 5 * 60 * 1000,
  });
}
