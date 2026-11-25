import { useLocalSearchParams } from 'expo-router'

import { SignIn } from '@/screens/sign-in'

export default function SignInRoute() {
  // Set by /auth/google when Google sign-in didn't work.
  const { google } = useLocalSearchParams<{ google?: string }>()
  return <SignIn googleError={google === 'stale' || google === 'failed' ? google : null} />
}
