'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { QuantixLogo } from '@/components/branding/QuantixLogo';
import { Button } from '@/components/ui/button';import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getLoginErrorMessage, isNetworkAuthFailure } from '@/lib/auth/login-errors';
import { resolveProfileFromAuthUser } from '@/lib/auth/resolve-profile';
import { createClient } from '@/lib/supabase/client';
import { resolvePostLoginRedirect } from '@/lib/navigation/post-login-redirect';
import { ensureUserProfileAfterSignIn } from '@/services/auth/ensure-user-profile';
import { cn } from '@/lib/utils';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (!EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address';
  }
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) {
    return 'Password is required';
  }
  return undefined;
}

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm(): boolean {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const nextErrors: FormErrors = {
      email: emailError,
      password: passwordError,
    };
    setErrors(nextErrors);
    return !emailError && !passwordError;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrors({ form: getLoginErrorMessage(error) });
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setErrors({ form: 'Invalid email or password' });
        return;
      }

      const authUser = data.user;
      let profileActive = false;

      if (authUser) {
        const { data: profileRow, error: profileError } = await supabase
          .from('users')
          .select('deleted_at')
          .eq('id', userId)
          .maybeSingle();

        if (!profileError && profileRow && !profileRow.deleted_at) {
          profileActive = true;
        } else {
          const metadataProfile = resolveProfileFromAuthUser(authUser);
          profileActive = Boolean(metadataProfile && !metadataProfile.deleted_at);
        }
      }

      if (!profileActive) {
        const ensured = await ensureUserProfileAfterSignIn(userId);

        if (!ensured.ok) {
          const metadataProfile =
            authUser ? resolveProfileFromAuthUser(authUser) : null;

          if (!metadataProfile || metadataProfile.deleted_at) {
            await supabase.auth.signOut();
            setErrors({
              form:
                ensured.error ??
                'Your account is inactive. Contact your administrator.',
            });
            return;
          }
        }
      }

      const destination = await resolvePostLoginRedirect(
        supabase,
        searchParams.get('next')
      );

      router.push(destination);
      router.refresh();
    } catch (error) {
      setErrors({
        form: isNetworkAuthFailure(error)
          ? getLoginErrorMessage(error)
          : 'Unable to connect. Check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-[400px]">
      <CardHeader className="text-center">
        <div className="mb-3 flex justify-center">
          <QuantixLogo variant="full" width={220} />
        </div>
        <CardTitle className="text-xl">Sign in to your account</CardTitle>
      </CardHeader>

      <CardContent>
        {accountError === 'account_inactive' && (
          <p
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            Your account is inactive. Contact your administrator.
          </p>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() =>
                setErrors((current) => ({
                  ...current,
                  email: validateEmail(email),
                }))
              }
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={cn(errors.email && 'border-destructive')}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() =>
                  setErrors((current) => ({
                    ...current,
                    password: validatePassword(password),
                  }))
                }
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
                className={cn('pr-10', errors.password && 'border-destructive')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="link" className="h-auto p-0">
                  Forgot password?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset password</DialogTitle>
                  <DialogDescription>
                    Password reset is not available in Version 1. Please contact
                    your administrator to reset your password.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>

          {errors.form && (
            <p className="text-sm text-destructive" role="alert">
              {errors.form}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
