'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function loginServerAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (!email || !password) {
    redirect('/login?err=Por%20favor%20ingresa%20correo%20y%20contrase%C3%B1a');
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?err=${encodeURIComponent(error.message)}`);
  }

  redirect('/');
}

export async function signupServerAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (!email || !password) {
    redirect('/login?mode=signup&err=Por%20favor%20ingresa%20correo%20y%20contrase%C3%B1a');
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/login?mode=signup&err=${encodeURIComponent(error.message)}`);
  }

  redirect('/login?ok=Cuenta%20creada%20con%20%C3%A9xito');
}
