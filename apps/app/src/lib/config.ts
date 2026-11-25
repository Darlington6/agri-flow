import Constants from 'expo-constants'
import { Platform } from 'react-native'

/**
 * Where the API is. Set EXPO_PUBLIC_API_URL for staging and production
 * builds. In development it's port 8000 on the computer running Expo: the
 * same address the phone already uses to load the app (so a real phone on
 * the same Wi-Fi works, and so does the Android emulator), or this browser's
 * host on the web.
 */
export function apiUrl(
  env: string | undefined = process.env.EXPO_PUBLIC_API_URL,
  hostUri: string | undefined = Constants.expoConfig?.hostUri,
): string {
  if (env) return env.replace(/\/+$/, '')
  if (!__DEV__) return ''
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`
  }
  const host = hostUri?.split(':')[0]
  return `http://${host || 'localhost'}:8000`
}

export const API_URL = apiUrl()
