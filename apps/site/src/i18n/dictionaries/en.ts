// English: the source language. Every other language must provide exactly
// these keys (enforced by the `Dictionary` type and a test).
//
// Copy rules: plain, specific, honest. No invented numbers, customers,
// partners or testimonials. AgriFlow is preparing its first pilot.
export const en = {
  meta: {
    siteName: 'AgriFlow',
    tagline: 'Demand-led farming for Africa',
    defaultDescription:
      'AgriFlow connects institutional food buyers with smallholder farmers through production contracts, climate-smart guidance, harvest forecasts and coordinated delivery.',
  },
  a11y: {
    skipToContent: 'Skip to content',
    mainNav: 'Main',
    footerNav: 'Footer',
    openMenu: 'Menu',
    language: 'Language',
    home: 'AgriFlow home',
  },
  nav: {
    howItWorks: 'How it works',
    buyers: 'For buyers',
    farmers: 'For farmers',
    partners: 'For partners',
    about: 'About',
    requestDemo: 'Request a demo',
    logIn: 'Log in',
  },
  cta: {
    requestDemo: 'Request a demo',
    seeHowItWorks: 'See how it works',
    createAccount: 'Create account',
    logIn: 'Log in',
  },
  apps: {
    title: 'AgriFlow on your phone',
    body: 'Mobile apps for farmers, field agents and delivery partners are on the way, built for low data use and patchy signal.',
    comingSoon: 'Coming soon',
    appStore: 'App Store',
    googlePlay: 'Google Play',
    notYetAvailable: 'Not yet available',
    webTitle: 'Or start on the web today',
    webBody: 'Sign in with your phone number or email. New to AgriFlow? Signing in creates your account.',
  },
  media: {
    buyers: 'Fresh fruit and vegetables piled high at a busy market',
    buyersDetail: 'Peppers, tomatoes, cucumbers and greens piled high on a market stall',
    farmers: 'A smiling farmer carrying a basket as she harvests leaves on her farm',
    farmersDetail: 'A smiling farmer holding freshly picked tomatoes',
    partners: 'A field officer showing a smiling farmer information on his phone in a maize field',
    partnersDetail: 'Workers loading crates of tomatoes and cabbages onto a pickup truck',
  },
  home: {
    title: 'AgriFlow: demand-led farming for Africa',
    description:
      'Farmers grow to confirmed orders. Buyers get reliable supply. AgriFlow links them with contracts, climate-smart guidance, harvest forecasts and coordinated delivery.',
    hero: {
      eyebrow: 'Demand first, then the harvest',
      title: 'Grow for buyers who have already said yes.',
      lede: 'AgriFlow turns confirmed demand from food buyers into production contracts for smallholder farmers, then helps both sides through the season: climate risk, harvest forecasts, delivery and payment.',
      artLabel: 'Illustration: fields under a rising sun',
    },
    problem: {
      title: 'Too much food is grown without a buyer, and too many buyers can’t find reliable supply.',
      body: 'Farmers plant and hope there will be a market at harvest. Processors, hotels, supermarkets and exporters struggle to secure steady volumes and quality. Both lose. AgriFlow starts from the other end: verified demand.',
    },
    loop: {
      title: 'One connected season',
      lede: 'Every step builds on the one before, so everyone sees the same picture.',
      steps: [
        { title: 'Demand', body: 'A buyer states what they need, how much, and when.' },
        { title: 'Contracts', body: 'Farmers commit to grow it, with terms agreed up front.' },
        { title: 'Production', body: 'Field agents follow progress and climate-smart practices.' },
        { title: 'Forecast', body: 'Climate signals and field updates shape the harvest forecast.' },
        { title: 'Delivery', body: 'Transport is matched to each load, including cold chain.' },
        { title: 'Payment', body: 'Delivery confirmed, payment released, history recorded.' },
      ],
    },
    audiences: {
      more: 'Learn more',
    },
    climate: {
      title: 'Climate-smart by default',
      body: 'Weather and climate risk are part of every plan, not an afterthought. When rain, heat or pests threaten a crop, the people who can act hear about it first.',
    },
    finalCta: {
      title: 'Bring AgriFlow to your supply chain',
      body: 'We’re preparing our first pilot. Tell us what you buy or grow, and we’ll show you how it could work for you.',
    },
  },
  howItWorks: {
    title: 'How AgriFlow works',
    description: 'From a buyer’s confirmed demand to a farmer’s payment: the six steps of an AgriFlow season.',
    lede: 'A season on AgriFlow starts with demand, not with planting. Here’s what happens at each step, and who does what.',
    steps: [
      { title: 'A buyer confirms demand', body: 'The buyer sets the crop, quantity, quality and delivery window. Nothing is grown on guesswork.' },
      { title: 'Farmers contract to supply it', body: 'Farmers request a share of the order. Once both sides confirm, the contract is set, and each farmer’s production plan with it.' },
      { title: 'Production is followed in the field', body: 'Field agents visit farms, check climate-smart practices and log progress, so issues surface early.' },
      { title: 'Climate risk shapes the forecast', body: 'Weather and climate signals, together with field updates, keep the harvest forecast honest for everyone.' },
      { title: 'Delivery is coordinated', body: 'Each load is matched with a transporter by area, capacity and, for perishable crops, cold chain.' },
      { title: 'Payment, then a track record', body: 'Confirmed delivery releases payment. Every completed contract builds a record that earns trust for the next one.' },
    ],
  },
  buyers: {
    title: 'AgriFlow for food buyers',
    description: 'Secure predictable, traceable supply from smallholder farmers, with visibility from contract to delivery.',
    lede: 'Processors, hotels, restaurants, supermarkets, aggregators and exporters: get the volumes you need, when you need them, from farms you can see.',
    points: [
      { title: 'Supply you can plan around', body: 'Contract volumes before planting and follow fulfilment week by week.' },
      { title: 'Early warning on risk', body: 'Climate and field signals flag shortfalls while there’s still time to act.' },
      { title: 'Traceable from the farm', body: 'Know which farms grew your order and how.' },
      { title: 'Delivery you can count on', body: 'Transport matched to each load, cold chain included.' },
    ],
  },
  farmers: {
    title: 'AgriFlow for farmers',
    description: 'Grow for a confirmed buyer, with climate-smart guidance through the season and reliable payment at the end.',
    lede: 'Know who will buy your harvest before you plant, and get support from the field to the payment.',
    points: [
      { title: 'A buyer before you plant', body: 'Choose open orders and agree terms up front.' },
      { title: 'Guidance through the season', body: 'Field agents and climate alerts help protect your crop.' },
      { title: 'Help at harvest', body: 'Transport arranged for your produce, including cold chain where it matters.' },
      { title: 'Reliable payment', body: 'Paid on confirmed delivery, with a record that builds your reputation.' },
    ],
  },
  partners: {
    title: 'AgriFlow for field agents and transporters',
    description: 'Field agents follow production in their area; transporters book delivery jobs matched to their routes and vehicles.',
    lede: 'The people who keep a season moving: clear work, matched to where you are and what you drive.',
    agents: {
      title: 'Field agents',
      body: 'Follow the farms in your area, verify climate-smart practices and report issues early, all in one place.',
    },
    transporters: {
      title: 'Transporters',
      body: 'See delivery jobs ranked for your areas, your vehicle’s capacity and whether it’s refrigerated. Book the ones that fit.',
    },
  },
  about: {
    title: 'About AgriFlow',
    description: 'AgriFlow is building the coordination layer between African food buyers and smallholder farmers, starting from verified demand.',
    lede: 'We’re building the coordination layer between food buyers and smallholder farmers across Africa.',
    sections: [
      {
        title: 'Why we exist',
        body: 'Across Africa, farmers often grow without knowing who will buy, and buyers often can’t find steady, reliable supply. The tools that exist, from marketplaces to weather apps, each solve one piece. AgriFlow connects them around one thing: confirmed demand.',
      },
      {
        title: 'Where we are',
        body: 'AgriFlow is early. We’re preparing our first pilot and working with buyers, farmer groups and partners to shape it.',
      },
      {
        title: 'Built for Africa',
        body: 'Multiple countries, currencies and languages from the start, and apps designed for the phones and networks people actually use.',
      },
    ],
  },
  requestDemo: {
    title: 'Request a demo',
    description: 'Tell us about your organisation and we’ll show you how AgriFlow could work for you.',
    lede: 'Tell us a little about you and we’ll be in touch to arrange a walkthrough.',
    form: {
      name: 'Your name',
      organisation: 'Organisation',
      role: 'You are a…',
      roles: {
        buyer: 'Food buyer',
        farmerGroup: 'Farmer or farmer group',
        partner: 'Field agent or transporter',
        other: 'Other',
      },
      country: 'Country',
      chooseCountry: 'Choose a country',
      email: 'Email',
      phone: 'Phone (optional)',
      message: 'What would you like to see? (optional)',
      consent: 'I agree that AgriFlow may contact me about this request.',
      privacyLink: 'How we use your information',
      submit: 'Send request',
      sending: 'Sending…',
      success: 'Thank you. We’ve received your request and will be in touch.',
      error: 'We couldn’t send your request just now. Please try again in a moment.',
      required: 'Required',
      honeypot: 'Leave this field empty',
    },
  },
  privacy: {
    title: 'Privacy notice',
    description: 'How AgriFlow collects, uses and protects the personal information you share with us, including demo requests.',
    draftNotice: 'Draft: this notice is being prepared with legal advice and will be completed before launch.',
    sections: [
      { title: 'What we collect', body: 'When you request a demo we collect the details you enter: your name, organisation, role, country, email, and optionally your phone number and message.' },
      { title: 'Why', body: 'Only to respond to your request and arrange a demo. We don’t sell your information or use it for unrelated marketing.' },
      { title: 'Contact', body: 'Questions about your information: use the request form and we’ll respond.' },
    ],
  },
  terms: {
    title: 'Terms of use',
    description: 'The terms that apply when you use the AgriFlow website, including how to read information about features in development.',
    draftNotice: 'Draft: these terms are being prepared with legal advice and will be completed before launch.',
    sections: [
      { title: 'This website', body: 'This site describes AgriFlow, which is in development. Features described may change before launch.' },
    ],
  },
  notFound: {
    title: 'Page not found',
    body: 'We couldn’t find that page. It may have moved.',
    home: 'Go to the home page',
  },
  footer: {
    rights: 'AgriFlow. All rights reserved.',
    privacy: 'Privacy',
    terms: 'Terms',
  },
}

/** The shape every language must match: same keys, string values. */
type Widen<T> = T extends string ? string : T extends readonly (infer U)[] ? readonly Widen<U>[] : { [K in keyof T]: Widen<T[K]> }
export type Dictionary = Widen<typeof en>
