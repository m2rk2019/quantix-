'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.login);
}
