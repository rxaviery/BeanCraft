// Design tokens taken from the BeanCraft Figma file.
// Every screen and component reads colors, fonts, sizes and spacing from here.
import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#FFF8F2', // cream page background
  surface: '#FFFFFF', // cards
  surfaceMuted: '#F5EDE3', // inputs, tasting-note chips, image wells
  surfaceTint: '#FBF2E8', // panels inside cards
  surfaceStrong: '#EFE7DD', // secondary buttons, banners
  track: '#E9E1D7', // progress track, dividers
  border: 'rgba(210, 195, 191, 0.4)',
  borderStrong: 'rgba(210, 195, 191, 0.7)',

  primary: '#994703', // rust brand color
  primarySoft: '#FFDBC9',
  onPrimarySoft: '#321200',
  accent: '#FC934F', // orange progress bar

  ink: '#000000', // main buttons, selected chip
  onInk: '#FFFFFF',

  text: '#1E1B15',
  textMuted: '#4F4541',
  textSubtle: '#817471',

  success: '#DAE7C8',
  onSuccess: '#141E0B',
  danger: '#BA1A1A',
  dangerSoft: '#FFDAD6',
  onDangerSoft: '#93000A',

  scrim: 'rgba(30, 27, 21, 0.45)', // dim layer behind the bottom sheet
};

// Plus Jakarta Sans, loaded in src/app/_layout.tsx.
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

// Text styles. Use them as: style={type.title}
export const type = {
  title: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32, letterSpacing: -0.65, color: colors.text },
  heading: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.text },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textSubtle },
  label: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 16, letterSpacing: 0.55, textTransform: 'uppercase', color: colors.textMuted },
  eyebrow: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 16, letterSpacing: 0.55, textTransform: 'uppercase', color: colors.primary },
} satisfies Record<string, TextStyle>;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

// Soft card shadow. boxShadow works the same on Android, iOS and web.
export const shadow: ViewStyle = { boxShadow: '0px 1px 3px rgba(30, 27, 21, 0.08)' };
