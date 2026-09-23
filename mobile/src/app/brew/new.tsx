// CREATE a brew. Opened from the Brew Log tab, or from Bean Details with
// ?beanId=N so that bean is already picked. The server takes the dose out
// of the bean's remaining coffee.
import { router, useLocalSearchParams } from 'expo-router';

import { createBrew } from '@/api/client';
import { BrewForm } from '@/components/BrewForm';
import { useToast } from '@/components/Toast';

export default function NewBrewScreen() {
  const { beanId } = useLocalSearchParams<{ beanId?: string }>();
  const toast = useToast();

  return (
    <BrewForm
      title="Log a Brew"
      submitLabel="Save Brew"
      beanId={beanId ? Number(beanId) : undefined}
      onSubmit={async (input) => {
        const brew = await createBrew(input);
        toast(`Brew logged. ${brew.dose_g}g used from ${brew.bean_name}.`, 'success');
        router.back();
      }}
    />
  );
}
