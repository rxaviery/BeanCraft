// Small colored label that can't be tapped, e.g. "LIGHT • WASHED" or "LOW STOCK".
import { StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from './Icon';
import { colors, fonts, radius } from '@/theme/tokens';

const TONES = {
  neutral: { bg: colors.track, fg: colors.textMuted },
  primary: { bg: colors.primarySoft, fg: colors.onPrimarySoft },
  success: { bg: colors.success, fg: colors.onSuccess },
  danger: { bg: colors.dangerSoft, fg: colors.onDangerSoft },
};

type Props = {
  label: string;
  tone?: keyof typeof TONES;
  icon?: IconName;
};

export function Tag({ label, tone = 'neutral', icon }: Props) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={11} color={fg} /> : null}
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
