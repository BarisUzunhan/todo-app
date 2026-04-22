import * as SecureStore from 'expo-secure-store';

const KEYS = {
  access:  'sb_access',
  refresh: 'sb_refresh',
  user:    'sb_user',
  expires: 'sb_expires',
};

export async function saveSession(data) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.access,  data.access_token),
    SecureStore.setItemAsync(KEYS.refresh, data.refresh_token),
    SecureStore.setItemAsync(KEYS.user,    JSON.stringify(data.user)),
    SecureStore.setItemAsync(KEYS.expires, String(Date.now() + data.expires_in * 1000)),
  ]);
}

export async function loadSession() {
  const [access, refresh, userRaw, expiresStr] = await Promise.all([
    SecureStore.getItemAsync(KEYS.access),
    SecureStore.getItemAsync(KEYS.refresh),
    SecureStore.getItemAsync(KEYS.user),
    SecureStore.getItemAsync(KEYS.expires),
  ]);

  if (!access || !refresh || !userRaw) return null;

  return {
    access_token:  access,
    refresh_token: refresh,
    user:          JSON.parse(userRaw),
    expires_at:    Number(expiresStr),
  };
}

export async function clearSession() {
  await Promise.all(Object.values(KEYS).map(k => SecureStore.deleteItemAsync(k)));
}
