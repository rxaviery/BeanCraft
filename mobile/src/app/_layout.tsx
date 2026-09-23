// Root of the app: loads fonts, provides toasts + login state, and decides
// which screens exist. Logged out -> only Login/Register. Logged in -> the app.
// When the user logs out (or the session expires) the guard flips and the
// router sends them back to Login automatically.
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { ToastProvider } from '@/components/Toast';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Wait for the fonts so text doesn't flash in the wrong font.
  if (!loaded && !error) return null;

  return (
    <ToastProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Screens />
      </AuthProvider>
    </ToastProvider>
  );
}

function Screens() {
  const { user, restoring } = useAuth();

  // Don't show Login for a split second while the saved session loads.
  if (restoring) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={user !== null}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bean/new" />
        <Stack.Screen name="bean/[id]/index" />
        <Stack.Screen name="bean/[id]/edit" />
      </Stack.Protected>

      <Stack.Protected guard={user === null}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}
