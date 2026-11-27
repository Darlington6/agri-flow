import { useFonts } from 'expo-font'
import { NavigationBar } from 'expo-navigation-bar'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'

import { AuthProvider, useAuth } from '@/auth'
import { I18nProvider } from '@/i18n'
import { Unreachable } from '@/screens/unreachable'
import { colors, fontFiles, useScheme } from '@/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}

function App() {
  const scheme = useScheme()
  const { status, user } = useAuth()
  const [fontsLoaded, fontError] = useFonts(fontFiles)
  // A font that fails to load falls back to the system font rather than
  // leaving people on the splash screen. The saved session is read while
  // the splash shows, so nobody sees sign-in flash before their home.
  const ready = (fontsLoaded || !!fontError) && status !== 'loading'

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  const palette = colors[scheme]
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.link,
      background: palette.canvas,
      card: palette.surface,
      text: palette.heading,
      border: palette.border,
    },
  }
  const signedIn = status === 'signed-in'
  const settingUp = !!user?.needs_onboarding

  return (
    // The account's language once signed in; the device's before that.
    <I18nProvider language={user?.language}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {/* Android's bottom bar shows the app's colour behind it (screens draw
            to the edges; the plugin in app.json turns off the grey scrim), with
            buttons that suit the theme. Does nothing on iOS and the web. */}
        <NavigationBar style="auto" />
        {status === 'unreachable' ? (
          <Unreachable />
        ) : (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.canvas } }}>
            {/* Signed out: the start and sign-in screens. Signed in but not
                set up (or new terms to agree to): the welcome steps. Then
                home. Signing in, finishing setup or signing out moves to the
                right group by itself. */}
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="index" />
              <Stack.Screen name="sign-in" />
            </Stack.Protected>
            <Stack.Protected guard={signedIn && settingUp}>
              <Stack.Screen name="welcome" />
            </Stack.Protected>
            <Stack.Protected guard={signedIn && !settingUp}>
              <Stack.Screen name="home" />
              <Stack.Screen name="members" />
            </Stack.Protected>
            <Stack.Screen name="auth/google" />
          </Stack>
        )}
      </ThemeProvider>
    </I18nProvider>
  )
}
