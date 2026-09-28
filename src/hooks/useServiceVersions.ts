import { useSyncExternalStore } from 'react';
import { catalogService } from '../services/catalogService';
import { userPrefsService } from '../services/userPrefsService';
import { communityService } from '../services/communityService';
import { sessionService } from '../services/sessionService';
import { spotService } from '../services/spotService';
import { placeService } from '../services/placeService';
import { adminService } from '../services/adminService';
import { visitService } from '../services/visitService';

/**
 * Subscriber-version hooks: each service exposes a monotonically increasing
 * version bumped on every mutation. Components call these so memoized queries
 * re-run when the underlying store changes.
 */

export function useCatalogVersion(): number {
  return useSyncExternalStore(catalogService.subscribe, catalogService.getVersion);
}

export function usePrefsVersion(): number {
  return useSyncExternalStore(userPrefsService.subscribe, userPrefsService.getVersion);
}

export function useCommunityVersion(): number {
  return useSyncExternalStore(communityService.subscribe, communityService.getVersion);
}

export function useSessionVersion(): number {
  return useSyncExternalStore(sessionService.subscribe, sessionService.getVersion);
}

export function useSpotVersion(): number {
  return useSyncExternalStore(spotService.subscribe, spotService.getVersion);
}

export function usePlaceVersion(): number {
  return useSyncExternalStore(placeService.subscribe, placeService.getVersion);
}

export function useAdminVersion(): number {
  return useSyncExternalStore(adminService.subscribe, adminService.getVersion);
}

export function useVisitVersion(): number {
  return useSyncExternalStore(visitService.subscribe, visitService.getVersion);
}
