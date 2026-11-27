import { en, type Dictionary } from './en'

// French. Draft by the AgriFlow team; have a fluent speaker skim it before
// publishing (locales.ts → published: true). French typography: a
// non-breaking space (U+00A0) before : ; ? ! and inside « ».
export const fr: Dictionary = {
  meta: {
    siteName: 'AgriFlow',
    tagline: 'L’agriculture guidée par la demande, pour l’Afrique',
    defaultDescription:
      'AgriFlow relie les acheteurs institutionnels de produits alimentaires aux petits producteurs grâce à des contrats de production, des conseils climato-intelligents, des prévisions de récolte et une livraison coordonnée.',
  },
  a11y: {
    skipToContent: 'Aller au contenu',
    mainNav: 'Navigation principale',
    footerNav: 'Pied de page',
    openMenu: 'Menu',
    language: 'Langue',
    home: 'Accueil AgriFlow',
  },
  nav: {
    howItWorks: 'Fonctionnement',
    buyers: 'Acheteurs',
    farmers: 'Producteurs',
    partners: 'Partenaires',
    about: 'À propos',
    requestDemo: 'Demander une démo',
    logIn: 'Se connecter',
  },
  cta: {
    requestDemo: 'Demander une démo',
    seeHowItWorks: 'Voir le fonctionnement',
    createAccount: 'Créer un compte',
    logIn: 'Se connecter',
  },
  apps: {
    title: 'AgriFlow sur votre téléphone',
    body: 'Des applications mobiles pour les producteurs, les agents de terrain et les transporteurs arrivent bientôt, conçues pour consommer peu de données et fonctionner avec un réseau instable.',
    comingSoon: 'Bientôt disponible',
    appStore: 'App Store',
    googlePlay: 'Google Play',
    notYetAvailable: 'Pas encore disponible',
    webTitle: 'Ou commencez dès aujourd’hui sur le web',
    webBody:
      'Connectez-vous avec votre numéro de téléphone ou votre e-mail. Nouveau sur AgriFlow ? La connexion crée votre compte.',
  },
  media: {
    buyers: 'Des fruits et légumes frais empilés sur un marché animé',
    buyersDetail: 'Poivrons, tomates, concombres et légumes verts empilés sur un étal de marché',
    farmers: 'Une productrice souriante, panier au bras, récolte des feuilles dans son champ',
    farmersDetail: 'Un producteur souriant tient des tomates fraîchement cueillies',
    partners:
      'Un agent de terrain montre des informations sur son téléphone à une productrice souriante, dans un champ de maïs',
    partnersDetail: 'Des ouvriers chargent des caisses de tomates et de choux dans une camionnette',
  },
  home: {
    title: 'AgriFlow : l’agriculture guidée par la demande',
    description:
      'Les producteurs cultivent pour des commandes confirmées, les acheteurs sont approvisionnés de façon fiable. AgriFlow les relie, du contrat à la livraison.',
    hero: {
      eyebrow: 'La demande d’abord, puis la récolte',
      title: 'Cultivez pour des acheteurs qui ont déjà dit oui.',
      lede: 'AgriFlow transforme la demande confirmée des acheteurs en contrats de production pour les petits producteurs, puis accompagne chacun tout au long de la saison : risques climatiques, prévisions de récolte, livraison et paiement.',
      artLabel: 'Illustration : des champs sous un soleil levant',
    },
    problem: {
      title: 'On cultive trop sans acheteur, et trop d’acheteurs peinent à trouver un approvisionnement fiable.',
      body: 'Les producteurs sèment en espérant trouver un marché à la récolte. Transformateurs, hôtels, supermarchés et exportateurs peinent à obtenir des volumes et une qualité réguliers. Tout le monde y perd. AgriFlow part de l’autre bout : une demande vérifiée.',
    },
    loop: {
      title: 'Une saison connectée',
      lede: 'Chaque étape s’appuie sur la précédente, pour que tous voient la même chose.',
      steps: [
        { title: 'Demande', body: 'Un acheteur indique ce qu’il lui faut, en quelle quantité et pour quand.' },
        {
          title: 'Contrats',
          body: 'Les producteurs s’engagent à le cultiver, avec des conditions convenues d’avance.',
        },
        {
          title: 'Production',
          body: 'Les agents de terrain suivent l’avancement et les pratiques climato-intelligentes.',
        },
        {
          title: 'Prévision',
          body: 'Les signaux climatiques et les relevés de terrain affinent la prévision de récolte.',
        },
        { title: 'Livraison', body: 'Chaque chargement reçoit un transport adapté, chaîne du froid comprise.' },
        { title: 'Paiement', body: 'Livraison confirmée, paiement versé, historique enregistré.' },
      ],
    },
    audiences: {
      more: 'En savoir plus',
    },
    climate: {
      title: 'Climato-intelligent par défaut',
      body: 'La météo et les risques climatiques font partie de chaque plan dès le départ. Quand la pluie, la chaleur ou les ravageurs menacent une culture, ceux qui peuvent agir sont prévenus en premier.',
    },
    finalCta: {
      title: 'Intégrez AgriFlow à votre chaîne d’approvisionnement',
      body: 'Nous préparons notre premier pilote. Dites-nous ce que vous achetez ou cultivez, et nous vous montrerons comment AgriFlow peut vous servir.',
    },
  },
  howItWorks: {
    title: 'Le fonctionnement d’AgriFlow',
    description:
      'De la demande confirmée d’un acheteur au paiement d’un producteur : les six étapes d’une saison AgriFlow.',
    lede: 'Sur AgriFlow, une saison commence par la demande, pas par les semis. Voici ce qui se passe à chaque étape, et qui fait quoi.',
    steps: [
      {
        title: 'Un acheteur confirme sa demande',
        body: 'L’acheteur fixe la culture, la quantité, la qualité et la période de livraison. Rien n’est cultivé au hasard.',
      },
      {
        title: 'Des producteurs s’engagent à la fournir',
        body: 'Les producteurs demandent une part de la commande. Une fois les deux parties d’accord, le contrat est établi, ainsi que le plan de production de chacun.',
      },
      {
        title: 'La production est suivie sur le terrain',
        body: 'Les agents de terrain visitent les exploitations, vérifient les pratiques climato-intelligentes et notent l’avancement, pour repérer les problèmes tôt.',
      },
      {
        title: 'Le climat affine la prévision',
        body: 'Les signaux météo et climatiques, avec les relevés de terrain, gardent la prévision de récolte fiable pour tous.',
      },
      {
        title: 'La livraison est coordonnée',
        body: 'Chaque chargement est attribué à un transporteur selon la zone, la capacité et, pour les produits périssables, la chaîne du froid.',
      },
      {
        title: 'Le paiement, puis la réputation',
        body: 'La livraison confirmée déclenche le paiement. Chaque contrat honoré constitue un historique qui inspire confiance pour le suivant.',
      },
    ],
  },
  buyers: {
    title: 'AgriFlow pour les acheteurs',
    description:
      'Sécurisez un approvisionnement prévisible et traçable auprès de petits producteurs, avec une visibilité du contrat à la livraison.',
    lede: 'Transformateurs, hôtels, restaurants, supermarchés, agrégateurs et exportateurs : obtenez les volumes nécessaires, au bon moment, d’exploitations que vous voyez.',
    points: [
      {
        title: 'Un approvisionnement planifiable',
        body: 'Contractualisez les volumes avant les semis et suivez l’exécution semaine après semaine.',
      },
      {
        title: 'Alerte précoce sur les risques',
        body: 'Les signaux climatiques et de terrain signalent les déficits tant qu’il est encore temps d’agir.',
      },
      {
        title: 'Traçable depuis l’exploitation',
        body: 'Sachez quelles exploitations ont produit votre commande, et comment.',
      },
      { title: 'Une livraison fiable', body: 'Un transport adapté à chaque chargement, chaîne du froid comprise.' },
    ],
  },
  farmers: {
    title: 'AgriFlow pour les producteurs',
    description:
      'Cultivez pour un acheteur confirmé, avec des conseils climato-intelligents toute la saison et un paiement fiable à la fin.',
    lede: 'Sachez qui achètera votre récolte avant de semer, et soyez accompagné du champ jusqu’au paiement.',
    points: [
      {
        title: 'Un acheteur avant de semer',
        body: 'Choisissez parmi les commandes ouvertes et convenez des conditions d’avance.',
      },
      {
        title: 'Un accompagnement toute la saison',
        body: 'Agents de terrain et alertes climatiques vous aident à protéger votre culture.',
      },
      {
        title: 'De l’aide à la récolte',
        body: 'Un transport organisé pour vos produits, avec chaîne du froid quand c’est nécessaire.',
      },
      {
        title: 'Un paiement fiable',
        body: 'Payé à la livraison confirmée, avec un historique qui construit votre réputation.',
      },
    ],
  },
  partners: {
    title: 'AgriFlow pour les agents de terrain et transporteurs',
    description:
      'Les agents de terrain suivent la production de leur zone ; les transporteurs réservent des livraisons adaptées à leurs trajets et véhicules.',
    lede: 'Ceux qui font avancer la saison : un travail clair, adapté à votre zone et à votre véhicule.',
    agents: {
      title: 'Agents de terrain',
      body: 'Suivez les exploitations de votre zone, vérifiez les pratiques climato-intelligentes et signalez les problèmes tôt, au même endroit.',
    },
    transporters: {
      title: 'Transporteurs',
      body: 'Consultez les livraisons classées selon vos zones, la capacité de votre véhicule et sa réfrigération. Réservez celles qui vous conviennent.',
    },
  },
  about: {
    title: 'À propos d’AgriFlow',
    description:
      'AgriFlow construit la couche de coordination entre les acheteurs alimentaires et les petits producteurs africains, à partir d’une demande vérifiée.',
    lede: 'Nous construisons la couche de coordination entre les acheteurs alimentaires et les petits producteurs, partout en Afrique.',
    sections: [
      {
        title: 'Pourquoi nous existons',
        body: 'En Afrique, les producteurs cultivent souvent sans savoir qui achètera, et les acheteurs peinent souvent à trouver un approvisionnement régulier et fiable. Les outils existants, des places de marché aux applis météo, ne règlent chacun qu’une partie du problème. AgriFlow les relie autour d’une chose : la demande confirmée.',
      },
      {
        title: 'Où nous en sommes',
        body: 'AgriFlow en est à ses débuts. Nous préparons notre premier pilote et le construisons avec des acheteurs, des groupements de producteurs et des partenaires.',
      },
      {
        title: 'Conçu pour l’Afrique',
        body: 'Plusieurs pays, devises et langues dès le départ, et des applications pensées pour les téléphones et les réseaux réellement utilisés.',
      },
    ],
  },
  requestDemo: {
    title: 'Demander une démo',
    description: 'Présentez-nous votre organisation et nous vous montrerons comment AgriFlow peut vous être utile.',
    lede: 'Parlez-nous un peu de vous et nous vous contacterons pour organiser une présentation.',
    form: {
      name: 'Votre nom',
      organisation: 'Organisation',
      role: 'Vous êtes…',
      roles: {
        buyer: 'Acheteur alimentaire',
        farmerGroup: 'Producteur ou groupement de producteurs',
        partner: 'Agent de terrain ou transporteur',
        other: 'Autre',
      },
      country: 'Pays',
      chooseCountry: 'Choisissez un pays',
      email: 'E-mail',
      phone: 'Téléphone (facultatif)',
      message: 'Que souhaitez-vous voir ? (facultatif)',
      consent: 'J’accepte qu’AgriFlow me contacte au sujet de cette demande.',
      privacyLink: 'Comment nous utilisons vos informations',
      submit: 'Envoyer la demande',
      sending: 'Envoi…',
      success: 'Merci. Nous avons bien reçu votre demande et vous contacterons.',
      error: 'Votre demande n’a pas pu être envoyée. Veuillez réessayer dans un instant.',
      required: 'Obligatoire',
      honeypot: 'Laissez ce champ vide',
    },
  },
  // The privacy notice is being drafted in English for legal review. It's
  // translated once the English is approved, so until then this page shows
  // the English draft's sections (rather than an out-of-date or unreviewed
  // translation) under this language's own title, so every page's title
  // stays unique.
  privacy: {
    ...en.privacy,
    title: 'Avis de confidentialité',
    description:
      'Comment AgriFlow collecte, utilise et protège les informations personnelles que vous nous confiez, y compris les demandes de démo.',
    draftNotice:
      'Brouillon en cours de révision juridique : il est affiché en anglais jusqu’à son approbation, puis sera traduit.',
  },
  terms: {
    title: 'Conditions d’utilisation',
    description:
      'Les conditions qui s’appliquent lorsque vous utilisez le site d’AgriFlow, notamment pour les fonctionnalités en cours de développement.',
    draftNotice:
      'Brouillon : ces conditions sont en cours de préparation avec un conseil juridique et seront finalisées avant le lancement.',
    sections: [
      {
        title: 'Ce site',
        body: 'Ce site présente AgriFlow, en cours de développement. Les fonctionnalités décrites peuvent évoluer avant le lancement.',
      },
    ],
  },
  notFound: {
    title: 'Page introuvable',
    body: 'Nous n’avons pas trouvé cette page. Elle a peut-être été déplacée.',
    home: 'Aller à l’accueil',
  },
  footer: {
    rights: 'AgriFlow. Tous droits réservés.',
    privacy: 'Confidentialité',
    terms: 'Conditions',
  },
}
