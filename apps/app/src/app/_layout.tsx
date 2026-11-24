import { useFonts } from 'expo-font'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'

import { I18nProvider } from '@/i18n'
import { colors, fontFiles, useScheme } from '@/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const scheme = useScheme()
  const [fontsLoaded, fontError] = useFonts(fontFiles)
  // A font that fails to load falls back to the system font rather than
  // leaving people on the splash screen.
  const ready = fontsLoaded || !!fontError

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

  return (
    <I18nProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.canvas } }} />
      </ThemeProvider>
    </I18nProvider>
  )
}
