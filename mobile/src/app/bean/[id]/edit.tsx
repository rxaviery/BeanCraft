// UPDATE: loads the bean from the API, pre-fills the form, saves the changes.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { errorMessage, getBean, updateBean, type Bean } from '@/api/client';
import { BeanForm } from '@/components/BeanForm';
import { Loading, Message } from '@/components/StateView';
import { useToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';

export default function EditBeanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const [bean, setBean] = useState<Bean | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setBean(await getBean(Number(id)));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!bean) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Edit Bean" backLabel="Cancel" onBack={() => router.back()} />
        {error ? <Message icon="alert-circle-outline" tone="error" title="Couldn't load this bean" text={error} actionLabel="Try again" onAction={load} /> : <Loading />}
      </View>
    );
  }

  return (
    <BeanForm
      title="Edit Bean"
      submitLabel="Save Changes"
      initial={bean}
      onSubmit={async (input) => {
        await updateBean(bean.id, input);
        toast('Bean updated.', 'success');
        router.back();
      }}
    />
  );
}
