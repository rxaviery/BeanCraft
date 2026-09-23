// One icon set for the whole app: Material Community Icons (bundled with Expo).
// Browse names at https://icons.expo.fyi (filter by MaterialCommunityIcons).
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export const Icon = MaterialCommunityIcons;
