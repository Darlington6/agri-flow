// The web: localStorage, as the web app keeps its sign-in. Browsers have no
// keychain; the tokens are short-lived and the refresh token works once.
// Private windows can refuse storage, so nothing here throws.

export async function getItem(key: string): Promise<string | null> {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage refused: signed in for this visit only.
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing to remove.
  }
}
