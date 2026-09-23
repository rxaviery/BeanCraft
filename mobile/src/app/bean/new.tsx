// CREATE: saves a new bean, then returns to the list (which reloads on focus).
import { router } from 'expo-router';

import { createBean } from '@/api/client';
import { BeanForm } from '@/components/BeanForm';
import { useToast } from '@/components/Toast';

export default function NewBeanScreen() {
  const toast = useToast();

  return (
    <BeanForm
      title="New Bean"
      submitLabel="Save to Stash"
      onSubmit={async (input) => {
        await createBean(input);
        toast('Bean added to your stash.', 'success');
        router.back();
      }}
    />
  );
}
