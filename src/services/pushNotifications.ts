/**
 * Push notification setup for Capacitor (iOS + Android via FCM).
 *
 * Call `initPushNotifications(onNavigate)` once after a successful login.
 * Call `removePushToken()` on logout.
 *
 * Requirements (run once in mobpae-app directory):
 *   npm install @capacitor/core @capacitor/cli @capacitor/push-notifications
 *   npx cap init "MobPae" com.mobpae.app --web-dir dist
 *   npx cap add ios
 *   npx cap add android
 *   npx cap sync
 */

import type { View } from '../types/app';
import { employeeApi } from './api';

// Map notification data.screen values to app views
const SCREEN_TO_VIEW: Record<string, View> = {
  home: 'home',
  advance: 'advance',
  activity: 'activity',
  profile: 'profile',
  notifications: 'notifications',
};

let _registeredToken: string | null = null;

/**
 * Initialise push notifications.
 * Safe to call in both Capacitor (native) and browser (no-op in browser).
 */
export async function initPushNotifications(
  onNavigate: (view: View) => void,
): Promise<void> {
  // Guard: only run inside Capacitor native runtime
  if (!isCapacitorNative()) {
    console.info('[Push] Running in browser — push notifications skipped.');
    return;
  }

  // Dynamic import so the module tree-shakes cleanly in browser builds
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { PushNotifications } = await import('@capacitor/push-notifications' as any);

  // Check / request permission
  let permStatus = await PushNotifications.checkPermissions();
  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }
  if (permStatus.receive !== 'granted') {
    console.warn('[Push] Permission not granted');
    return;
  }

  // Create Android notification channel (must match channelId sent by backend)
  // On Android 8+ notifications are silently dropped if the channel doesn't exist.
  if ((window as any).Capacitor?.getPlatform() === 'android') {
    await PushNotifications.createChannel({
      id: 'mobpae_default',
      name: 'MobPae Notifications',
      description: 'General app notifications',
      importance: 4, // 4 = high — shows heads-up banner
      sound: 'default',
      vibration: true,
      visibility: 1, // public
    });
  }

  // Register with FCM / APNs
  await PushNotifications.register();

  // Token received — send to backend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PushNotifications.addListener('registration', async (token: any) => {
    _registeredToken = token.value as string;
    console.info('[Push] Token registered');
    await registerTokenWithBackend(_registeredToken);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PushNotifications.addListener('registrationError', (err: any) => {
    console.error('[Push] Registration error:', err.error);
  });

  // Foreground notification — log only (add in-app banner here if desired)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PushNotifications.addListener('pushNotificationReceived', (_notification: any) => {
    // intentionally ignored in foreground for now
  });

  // User tapped a notification — navigate to the relevant screen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
    const data = action.notification.data as Record<string, string> | undefined;
    const screen = data?.screen;
    if (screen && SCREEN_TO_VIEW[screen]) {
      onNavigate(SCREEN_TO_VIEW[screen]);
    }
  });
}

/**
 * Remove the current device token from the backend on logout.
 */
export async function removePushToken(): Promise<void> {
  if (!_registeredToken) return;
  try {
    await employeeApi.removeDeviceToken(_registeredToken);
    _registeredToken = null;
  } catch {
    // Non-critical — stale token gets pruned on next FCM send attempt
  }
}

// ── Internals ────────────────────────────────────────────────────────────────

async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    const platform = detectPlatform();
    await employeeApi.registerDeviceToken(token, platform);
  } catch (err) {
    console.error('[Push] Failed to register token with backend:', err);
  }
}

function detectPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window !== 'undefined') {
    // Capacitor sets window.Capacitor.getPlatform()
    const cap = (window as any).Capacitor;
    if (cap?.getPlatform() === 'ios') return 'ios';
    if (cap?.getPlatform() === 'android') return 'android';
  }
  return 'web';
}

function isCapacitorNative(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.()
  );
}
