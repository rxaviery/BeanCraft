// Contents of the "Delete Coffee Bag?" bottom sheet. Calls the API itself;
// the screen decides what happens after (onDeleted).
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { deleteBean, errorMessage, type Bean } from '@/api/client';
import { Button } from './Button';
import { Icon } from './Icon';
import { useToast } from './Toast';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { formatDate } from '@/utils/bean';

type Props = {
  bean: Bean;
  onCancel: () => void;
  onDeleted: () => void;
};

export function DeleteConfirm({ bean, onCancel, onDeleted }: Props) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setDeleting(true);
    try {
      await deleteBean(bean.id);
      onDeleted();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setDeleting(false);
    }
  }

  const detail = [bean.roaster, bean.process_method].filter(Boolean).join(' • ');

  return (
    <>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Icon name="trash-can-outline" size={22} color={colors.danger} />
        </View>
        <Text style={type.heading}>Delete Coffee Bag?</Text>
      </View>

      <Text style={type.body}>
        This will permanently remove this bag from your stash. This action cannot be undone.
      </Text>

      <View style={styles.summary}>
        <Icon name="coffee-outline" size={22} color={colors.primary} />
        <View style={styles.summaryText}>
          <Text style={styles.name} numberOfLines={1}>
            {bean.name}
          </Text>
          <Text style={type.caption}>{detail}</Text>
          <Text style={type.caption}>
            Added {formatDate(bean.created_at)} • {bean.bag_weight_g}g bag
          </Text>
        </View>
      </View>

      <Button title="Delete Bag" variant="danger" icon="trash-can-outline" loading={deleting} onPress={confirm} />
      <Button title="Cancel" variant="secondary" disabled={deleting} onPress={onCancel} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTint,
  },
  summaryText: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
});
