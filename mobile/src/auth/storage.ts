// Saves the login session on the device.
// Phones: expo-secure-store (encrypted). Web (browser testing only): localStorage.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function saveItem(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

export async function loadItem(key: string) {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}
