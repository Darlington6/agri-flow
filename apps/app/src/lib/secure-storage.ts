import * as SecureStore from 'expo-secure-store'

// iOS and Android: the system keychain / keystore, encrypted and kept to
// this app. The web version (secure-storage.web.ts) has the same shape.

export async function getItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key)
}

export async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value)
}

export async function removeItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key)
}
