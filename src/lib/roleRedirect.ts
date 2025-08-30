// src/lib/roleRedirect.ts
import { supabase } from './supabase'

export type UserType = 'job_seeker' | 'company'
const EMPLOYER_APP_URL = 'https://employerapp.netlify.app'

/**
 * Returns the user's type from auth metadata, then falls back to the profiles table.
 */
export async function getUserType(userId: string): Promise<UserType | null> {
  // 1) Try auth metadata (fast path)
  try {
    const { data } = await supabase.auth.getSession()
    const meta = data.session?.user.user_metadata as Record<string, any> | undefined
    if (meta?.user_type) return meta.user_type as UserType
  } catch (e) {
    console.warn('auth.getSession metadata check failed', e)
  }

  // 2) Fallback to DB
  const { data: row, error } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.warn('profiles.user_type fetch error:', error)
    return null
  }
  return (row?.user_type ?? null) as UserType | null
}

/** Redirects to the employer app if the user is a company. */
export async function maybeRedirectEmployer(userId?: string) {
  if (!userId) return
  const type = await getUserType(userId)
  if (type === 'company') {
    // Use replace() so Back doesn't bounce the user back to the login screen.
    window.location.replace(EMPLOYER_APP_URL)
  }
}