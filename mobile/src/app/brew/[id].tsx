// UPDATE / DELETE a brew: loads it from the API into the form.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { deleteBrew, errorMessage, getBrew, updateBrew, type Brew } from '@/api/client';
import { BrewForm } from '@/components/BrewForm';
import { Loading, Message } from '@/components/StateView';
import { useToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';

export default function EditBrewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const [brew, setBrew] = useState<Brew | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setBrew(await getBrew(Number(id)));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!brew) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Edit Brew" backLabel="Cancel" onBack={() => router.back()} />
        {error ? <Message icon="alert-circle-outline" tone="error" title="Couldn't load this brew" text={error} actionLabel="Try again" onAction={load} /> : <Loading />}
      </View>
    );
  }

  return (
    <BrewForm
      title="Edit Brew"
      submitLabel="Save Changes"
      initial={brew}
      onSubmit={async (input) => {
        await updateBrew(brew.id, input);
        toast('Brew updated.', 'success');
        router.back();
      }}
      onDelete={async () => {
        await deleteBrew(brew.id);
        toast(`Brew deleted. ${brew.dose_g}g went back to ${brew.bean_name}.`, 'success');
        router.back();
      }}
    />
  );
}
