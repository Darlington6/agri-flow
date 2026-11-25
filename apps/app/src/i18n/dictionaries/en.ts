// English: the source language. Every other dictionary translates these
// keys (never the keys themselves). Keep `{name}`-style placeholders as they are.
export const en = {
  'app.name': 'AgriFlow',

  'start.title': 'Grow, sell and deliver with confidence',
  'start.body': 'Farmers, cooperatives, buyers and drivers working from the same plan, online or off.',
  'start.signIn': 'Sign in or create an account',

  'signIn.title': 'Sign in to AgriFlow',
  'signIn.or': 'Or',
  'signIn.back': 'Back',
  'signIn.email.heading': 'Sign in with email',
  'signIn.email.body': "We'll email you a code. New here? The code creates your account.",
  'signIn.email.label': 'Email',
  'signIn.email.placeholder': 'you@example.com',
  'signIn.email.send': 'Email me a code',
  'signIn.email.invalid': 'Enter an email address, like you@example.com.',
  'signIn.email.usePhone': 'Use my phone instead',
  'signIn.phone.heading': 'Sign in with your phone',
  'signIn.phone.body': "We'll text you a 6-digit code. New here? The code creates your account.",
  'signIn.phone.label': 'Phone number',
  'signIn.phone.country': 'Country: {country}',
  'signIn.phone.send': 'Text me a code',
  'signIn.phone.empty': 'Enter your phone number.',
  'signIn.phone.useEmail': 'Use email instead',
  'signIn.code.heading': 'Enter the code',
  'signIn.code.sentToEmail':
    'We sent a 6-digit code to {email}. It works once, for 15 minutes. Can’t find it? Check your spam folder.',
  'signIn.code.sentToPhone': 'We sent a 6-digit code to {phone}.',
  'signIn.code.label': '6-digit code',
  'signIn.code.invalid': 'Enter the 6 digits from the message.',
  'signIn.code.verify': 'Sign in',
  'signIn.code.resend': 'Send a new code',
  'signIn.code.resent': 'New code sent.',
  'signIn.code.otherEmail': 'Use a different email',
  'signIn.code.otherPhone': 'Use a different number',
  'signIn.code.dev': 'Dev mode: the code is {code}. Never shown outside a local API.',
  'signIn.google': 'Continue with Google',
  'signIn.google.opening': 'Opening Google…',
  'signIn.google.stale': 'That Google sign-in had expired. Try again.',
  'signIn.google.failed': 'Google sign-in didn’t work. Try again.',
  'signIn.google.signingIn': 'Signing you in…',
  'signIn.offline': 'You’re offline. Connect to the internet to sign in.',
  'signIn.failed': 'Something went wrong. Try again.',

  'countries.title': 'Choose your country',
  'countries.search': 'Search countries',
  'countries.none': 'No country matches “{query}”.',
  'countries.close': 'Close',

  'home.greeting': 'Welcome, {name}',
  'home.greetingNoName': 'Welcome',
  'home.signedInAs': 'Signed in as {who}.',
  'home.setup.heading': 'Finish setting up your account',
  'home.setup.body': 'Setting up your account comes to the app next. Until then, finish it on the AgriFlow website.',
  'home.ready.body': 'Your account is set up. Your farm, sales and deliveries come to the app next.',
  'home.offline': 'You’re offline. You’re still signed in, and we’ll catch up when you’re back.',
  'home.signOut': 'Sign out',

  'unreachable.heading': 'We can’t reach AgriFlow',
  'unreachable.body': 'Check your internet connection, then try again. You’re still signed in.',
  'unreachable.retry': 'Try again',
} as const

export type MessageKey = keyof typeof en
export type Dictionary = Record<MessageKey, string>
