import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@dokaandm/shared';
import { AuthLayout } from '../components/layout/AuthLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Field } from '../components/ui/Input.jsx';
import { api, setAccessToken, apiError } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const res = await api.post('/auth/register', values);
      const { seller, accessToken } = res.data.data;
      setAccessToken(accessToken);
      const me = await api.get('/auth/me');
      setSession({ seller, accessToken, plan: me.data.data.plan });
      navigate('/');
    } catch (err) {
      setServerError(apiError(err).message);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Start free — no card required.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {serverError}
          </div>
        )}
        <Field label="Your name" error={errors.fullName?.message}>
          <Input placeholder="Aabesh Subedi" invalid={!!errors.fullName} {...register('fullName')} />
        </Field>
        <Field label="Business name" error={errors.businessName?.message}>
          <Input
            placeholder="Himalaya Handmade"
            invalid={!!errors.businessName}
            {...register('businessName')}
          />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={!!errors.email}
            {...register('email')}
          />
        </Field>
        <Field label="Phone" error={errors.phone?.message} hint="Optional">
          <Input type="tel" placeholder="98XXXXXXXX" {...register('phone')} />
        </Field>
        <Field label="Password" error={errors.password?.message} hint="At least 8 characters">
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register('password')}
          />
        </Field>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link to="/login" className="link-accent">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
