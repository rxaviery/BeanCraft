// Short message that pops up just below the header and fades away
// (up top so it never covers the + button or a form's Save button).
// Wrap the app in <ToastProvider>, then in any screen:
//   const toast = useToast();
//   toast('Bean deleted', 'success');
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from './Icon';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

type Tone = 'info' | 'success' | 'error';
type ShowToast = (message: string, tone?: Tone) => void;

const ICONS = { info: 'information-outline', success: 'check-circle-outline', error: 'alert-circle-outline' } as const;
const ICON_COLORS = { info: colors.onInk, success: colors.accent, error: '#FFB4AB' };

const ToastContext = createContext<ShowToast>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; tone: Tone } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback<ShowToast>(
    (message, tone = 'info') => {
      clearTimeout(timer.current);
      setToast({ message, tone });
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        // "finished" is false if a newer toast interrupted the fade, so we keep that one.
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
          if (finished) setToast(null);
        });
      }, 2500);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { top: insets.top + 68, opacity }]}
          accessibilityLiveRegion="polite"
        >
          <Icon name={ICONS[toast.tone]} size={18} color={ICON_COLORS[toast.tone]} />
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
  },
  text: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.onInk },
});
