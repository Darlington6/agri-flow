export type DemoRequestResult = 'sent' | 'failed' | 'ignored'

/** The JSON body the API expects (POST /api/v1/leads/demo-requests/). */
export function demoRequestPayload(data: FormData, locale: string) {
  const text = (key: string) => String(data.get(key) ?? '').trim()
  return {
    name: text('name'),
    organisation: text('organisation'),
    role: text('role'),
    country: text('country'),
    email: text('email'),
    phone: text('phone'),
    message: text('message'),
    consent: data.get('consent') === 'on',
    locale,
  }
}

/**
 * Sends the demo request. Resolves to 'ignored' when the hidden spam-trap
 * field is filled (looks like success to a bot, nothing is sent), 'failed'
 * when there is no endpoint configured or the request doesn't succeed.
 */
export async function submitDemoRequest(
  endpoint: string | undefined,
  data: FormData,
  locale: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DemoRequestResult> {
  if (String(data.get('website') ?? '').trim() !== '') return 'ignored'
  if (!endpoint) return 'failed'
  try {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(demoRequestPayload(data, locale)),
    })
    return res.ok ? 'sent' : 'failed'
  } catch {
    return 'failed'
  }
}
