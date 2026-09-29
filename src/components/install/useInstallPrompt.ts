import { useSyncExternalStore } from 'react';
import { isStandaloneDisplay } from '../../utils/router';
import { detectInstallPlatform, resolveInstallMode, type InstallMode, type InstallPlatform } from './installPlatform';
import { installPrompt, type PromptResult } from './installPromptStore';

export function useInstallPrompt(): {
  platform: InstallPlatform;
  mode: InstallMode;
  promptInstall: () => Promise<PromptResult>;
} {
  useSyncExternalStore(installPrompt.subscribe, installPrompt.getSnapshot);
  const platform = detectInstallPlatform(navigator.userAgent, navigator.maxTouchPoints ?? 0);
  const mode = resolveInstallMode(platform, {
    standalone: isStandaloneDisplay() || installPrompt.isInstalled(),
    hasDeferredPrompt: installPrompt.hasDeferredPrompt(),
  });
  return { platform, mode, promptInstall: installPrompt.promptInstall };
}
