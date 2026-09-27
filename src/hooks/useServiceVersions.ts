import { useSyncExternalStore } from 'react';
import { catalogService } from '../services/catalogService';
import { userPrefsService } from '../services/userPrefsService';
import { communityService } from '../services/communityService';
import { authService } from '../services/authService';

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

export function useAuthVersion(): number {
  return useSyncExternalStore(authService.subscribe, authService.getVersion);
}
