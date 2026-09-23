// Register screen. Creating an account also logs the user in.
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { errorMessage, fieldErrors } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors, fonts } from '@/theme/tokens';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    // Same rules as register.php.
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = 'Name is required.';
    else if (name.trim().length > 100) found.name = 'Maximum 100 characters.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = 'Enter a valid email address.';
    if (password.length < 8) found.password = 'Password must be at least 8 characters.';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await signUp(name.trim(), email.trim(), password);
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (Object.keys(fields).length === 0) setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking every bag in your coffee stash."
      footer={
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Link href="/login" style={styles.link}>
            Sign in
          </Link>
        </Text>
      }
    >
      <TextField
        label="Name"
        icon="account-outline"
        placeholder="Juan Dela Cruz"
        value={name}
        onChangeText={setName}
        error={errors.name}
        autoComplete="name"
        textContentType="name"
      />
      <TextField
        label="Email address"
        icon="email-outline"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        icon="lock-outline"
        placeholder="At least 8 characters"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <Button title="Create Account" icon="arrow-right" loading={submitting} onPress={submit} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  link: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  footerText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  formError: { fontFamily: fonts.semibold, fontSize: 13, color: colors.danger, textAlign: 'center' },
});
