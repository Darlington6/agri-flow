import { useState } from 'react'

import { useAuth } from '@/auth'
import { Button } from '@/components/button'
import { Screen } from '@/components/screen'
import { Text } from '@/components/text'
import { useI18n } from '@/i18n'

/** Signed in, but the account details weren't saved and the API can't be reached. */
export function Unreachable() {
  const { t } = useI18n()
  const { retry } = useAuth()
  const [busy, setBusy] = useState(false)
  return (
    <Screen centered>
      <Text variant="title">{t('unreachable.heading')}</Text>
      <Text color="muted">{t('unreachable.body')}</Text>
      <Button
        label={t('unreachable.retry')}
        busy={busy}
        onPress={async () => {
          setBusy(true)
          await retry()
          setBusy(false)
        }}
      />
    </Screen>
  )
}
