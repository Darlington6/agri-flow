import type { Dictionary } from './en'

// Swahili (standard East African). Draft by the AgriFlow team; have a fluent
// speaker skim it before publishing (locales.ts → published: true).
export const sw: Dictionary = {
  meta: {
    siteName: 'AgriFlow',
    tagline: 'Kilimo kinachoongozwa na mahitaji, kwa ajili ya Afrika',
    defaultDescription:
      'AgriFlow inawaunganisha wanunuzi wakubwa wa chakula na wakulima wadogo kupitia mikataba ya uzalishaji, ushauri wa kilimo kinachostahimili mabadiliko ya tabianchi, makadirio ya mavuno na usafirishaji ulioratibiwa.',
  },
  a11y: {
    skipToContent: 'Ruka hadi maudhui',
    mainNav: 'Urambazaji mkuu',
    footerNav: 'Kijachini',
    openMenu: 'Menyu',
    language: 'Lugha',
    home: 'Ukurasa wa mwanzo wa AgriFlow',
  },
  nav: {
    howItWorks: 'Jinsi inavyofanya kazi',
    buyers: 'Kwa wanunuzi',
    farmers: 'Kwa wakulima',
    partners: 'Kwa washirika',
    about: 'Kuhusu sisi',
    requestDemo: 'Omba onyesho',
    logIn: 'Ingia',
  },
  cta: {
    requestDemo: 'Omba onyesho',
    seeHowItWorks: 'Ona jinsi inavyofanya kazi',
    createAccount: 'Fungua akaunti',
    logIn: 'Ingia',
  },
  apps: {
    title: 'AgriFlow kwenye simu yako',
    body: 'Programu za simu kwa wakulima, maafisa ugani na wasafirishaji zinakuja hivi karibuni, zimeundwa kutumia data kidogo na kufanya kazi hata mtandao ukiwa dhaifu.',
    comingSoon: 'Inakuja hivi karibuni',
    appStore: 'App Store',
    googlePlay: 'Google Play',
    notYetAvailable: 'Bado haipatikani',
    webTitle: 'Au anza kwenye wavuti leo',
    webBody: 'Ingia kwa namba yako ya simu au barua pepe. Mgeni kwenye AgriFlow? Kuingia kunakufungulia akaunti.',
  },
  media: {
    buyers: 'Matunda na mboga mbichi zimerundikwa katika soko lenye shughuli nyingi',
    buyersDetail: 'Pilipili hoho, nyanya, matango na mboga za majani zimerundikwa kwenye meza ya sokoni',
    farmers: 'Mkulima mwanamke akitabasamu na kikapu huku akivuna majani shambani kwake',
    farmersDetail: 'Mkulima akitabasamu akiwa ameshika nyanya zilizochumwa punde',
    partners: 'Afisa ugani akimwonyesha mkulima mwenye tabasamu taarifa kwenye simu yake shambani mwa mahindi',
    partnersDetail: 'Wafanyakazi wakipakia kreti za nyanya na kabichi kwenye gari dogo la mizigo',
  },
  home: {
    title: 'AgriFlow: kilimo kinachoongozwa na mahitaji',
    description:
      'Wakulima wanalima kwa oda zilizothibitishwa. Wanunuzi wanapata bidhaa za uhakika. AgriFlow inawaunganisha kwa mikataba, ushauri na usafirishaji ulioratibiwa.',
    hero: {
      eyebrow: 'Mahitaji kwanza, kisha mavuno',
      title: 'Lima kwa ajili ya wanunuzi ambao tayari wamekubali.',
      lede: 'AgriFlow hubadilisha mahitaji yaliyothibitishwa ya wanunuzi wa chakula kuwa mikataba ya uzalishaji kwa wakulima wadogo, kisha huwasaidia wote katika msimu mzima: hatari za hali ya hewa, makadirio ya mavuno, usafirishaji na malipo.',
      artLabel: 'Mchoro: mashamba chini ya jua linalochomoza',
    },
    problem: {
      title: 'Chakula kingi hulimwa bila mnunuzi, na wanunuzi wengi hukosa bidhaa za uhakika.',
      body: 'Wakulima hupanda wakitumaini kupata soko wakati wa mavuno. Viwanda vya usindikaji, hoteli, maduka makubwa na wasafirishaji nje hutaabika kupata kiasi na ubora unaotabirika. Wote hupoteza. AgriFlow huanzia upande mwingine: mahitaji yaliyothibitishwa.',
    },
    loop: {
      title: 'Msimu mmoja uliounganishwa',
      lede: 'Kila hatua hujengwa juu ya iliyotangulia, ili kila mtu aone picha moja.',
      steps: [
        { title: 'Mahitaji', body: 'Mnunuzi anaeleza anachohitaji, kiasi gani na lini.' },
        { title: 'Mikataba', body: 'Wakulima wanajitolea kukilima, kwa masharti yaliyokubaliwa mapema.' },
        {
          title: 'Uzalishaji',
          body: 'Maafisa ugani wanafuatilia maendeleo na mbinu za kilimo kinachostahimili tabianchi.',
        },
        { title: 'Makadirio', body: 'Taarifa za hali ya hewa na za shambani huboresha makadirio ya mavuno.' },
        { title: 'Usafirishaji', body: 'Kila mzigo hupangiwa usafiri unaofaa, pamoja na mnyororo wa ubaridi.' },
        { title: 'Malipo', body: 'Usafirishaji ukithibitishwa, malipo hutolewa na kumbukumbu kuhifadhiwa.' },
      ],
    },
    audiences: {
      more: 'Jifunze zaidi',
    },
    climate: {
      title: 'Kilimo kinachostahimili tabianchi kama msingi',
      body: 'Hali ya hewa na hatari za tabianchi ni sehemu ya kila mpango tangu mwanzo. Mvua, joto au wadudu wanapotishia zao, wale wanaoweza kuchukua hatua hupata taarifa kwanza.',
    },
    finalCta: {
      title: 'Leta AgriFlow kwenye mnyororo wako wa ugavi',
      body: 'Tunaandaa majaribio yetu ya kwanza. Tuambie unachonunua au unacholima, nasi tutakuonyesha jinsi inavyoweza kukufaa.',
    },
  },
  howItWorks: {
    title: 'Jinsi AgriFlow inavyofanya kazi',
    description:
      'Kutoka mahitaji yaliyothibitishwa ya mnunuzi hadi malipo ya mkulima: hatua sita za msimu wa AgriFlow.',
    lede: 'Kwenye AgriFlow, msimu huanza na mahitaji, si kupanda. Hiki ndicho kinachotokea katika kila hatua, na nani anafanya nini.',
    steps: [
      {
        title: 'Mnunuzi anathibitisha mahitaji',
        body: 'Mnunuzi anaweka zao, kiasi, ubora na kipindi cha kupokea. Hakuna kinacholimwa kwa kubahatisha.',
      },
      {
        title: 'Wakulima wanaingia mkataba wa kuyatimiza',
        body: 'Wakulima wanaomba sehemu ya oda. Pande zote mbili zikikubali, mkataba unawekwa, pamoja na mpango wa uzalishaji wa kila mkulima.',
      },
      {
        title: 'Uzalishaji unafuatiliwa shambani',
        body: 'Maafisa ugani hutembelea mashamba, hukagua mbinu za kilimo kinachostahimili tabianchi na kuandika maendeleo, ili matatizo yaonekane mapema.',
      },
      {
        title: 'Tabianchi huongoza makadirio',
        body: 'Taarifa za hali ya hewa na tabianchi, pamoja na taarifa za shambani, huweka makadirio ya mavuno kuwa ya kweli kwa wote.',
      },
      {
        title: 'Usafirishaji unaratibiwa',
        body: 'Kila mzigo hupangiwa msafirishaji kulingana na eneo, uwezo wa gari na, kwa mazao yanayoharibika haraka, mnyororo wa ubaridi.',
      },
      {
        title: 'Malipo, kisha sifa njema',
        body: 'Usafirishaji uliothibitishwa huachilia malipo. Kila mkataba uliotimizwa hujenga kumbukumbu inayoleta imani kwa mkataba unaofuata.',
      },
    ],
  },
  buyers: {
    title: 'AgriFlow kwa wanunuzi wa chakula',
    description:
      'Pata ugavi unaotabirika na unaofuatilika kutoka kwa wakulima wadogo, ukiona kila kitu kuanzia mkataba hadi usafirishaji.',
    lede: 'Viwanda vya usindikaji, hoteli, migahawa, maduka makubwa, wakusanyaji na wasafirishaji nje: pata kiasi unachohitaji, wakati unapohitaji, kutoka mashamba unayoyaona.',
    points: [
      {
        title: 'Ugavi unaoweza kupangia',
        body: 'Weka mikataba ya kiasi kabla ya kupanda na fuatilia utekelezaji wiki kwa wiki.',
      },
      {
        title: 'Tahadhari ya mapema',
        body: 'Taarifa za tabianchi na za shambani huonyesha upungufu wakati bado kuna muda wa kuchukua hatua.',
      },
      { title: 'Inafuatilika kutoka shambani', body: 'Jua ni mashamba gani yamelima oda yako, na kwa namna gani.' },
      { title: 'Usafirishaji wa kuaminika', body: 'Usafiri unaolingana na kila mzigo, pamoja na mnyororo wa ubaridi.' },
    ],
  },
  farmers: {
    title: 'AgriFlow kwa wakulima',
    description:
      'Lima kwa ajili ya mnunuzi aliyethibitishwa, ukipata ushauri wa kilimo kinachostahimili tabianchi msimu mzima na malipo ya uhakika mwishoni.',
    lede: 'Jua nani atanunua mavuno yako kabla hujapanda, na upate msaada kuanzia shambani hadi malipo.',
    points: [
      { title: 'Mnunuzi kabla ya kupanda', body: 'Chagua oda zilizo wazi na ukubaliane masharti mapema.' },
      { title: 'Ushauri msimu mzima', body: 'Maafisa ugani na tahadhari za hali ya hewa hukusaidia kulinda zao lako.' },
      {
        title: 'Msaada wakati wa mavuno',
        body: 'Usafiri hupangwa kwa mazao yako, pamoja na mnyororo wa ubaridi inapohitajika.',
      },
      { title: 'Malipo ya uhakika', body: 'Unalipwa usafirishaji ukithibitishwa, na kumbukumbu inayojenga sifa yako.' },
    ],
  },
  partners: {
    title: 'AgriFlow kwa maafisa ugani na wasafirishaji',
    description:
      'Maafisa ugani hufuatilia uzalishaji katika maeneo yao; wasafirishaji huchagua kazi za usafirishaji zinazolingana na njia na magari yao.',
    lede: 'Watu wanaoufanya msimu usonge mbele: kazi iliyo wazi, inayolingana na mahali ulipo na gari unaloendesha.',
    agents: {
      title: 'Maafisa ugani',
      body: 'Fuatilia mashamba katika eneo lako, hakiki mbinu za kilimo kinachostahimili tabianchi na ripoti matatizo mapema, mahali pamoja.',
    },
    transporters: {
      title: 'Wasafirishaji',
      body: 'Ona kazi za usafirishaji zilizopangwa kulingana na maeneo yako, uwezo wa gari lako na kama lina ubaridi. Chukua zile zinazokufaa.',
    },
  },
  about: {
    title: 'Kuhusu AgriFlow',
    description:
      'AgriFlow inajenga mfumo wa uratibu kati ya wanunuzi wa chakula na wakulima wadogo barani Afrika, ikianzia na mahitaji yaliyothibitishwa.',
    lede: 'Tunajenga mfumo wa uratibu kati ya wanunuzi wa chakula na wakulima wadogo kote Afrika.',
    sections: [
      {
        title: 'Kwa nini tupo',
        body: 'Barani Afrika, mara nyingi wakulima hulima bila kujua nani atanunua, na wanunuzi mara nyingi hukosa ugavi wa kudumu na wa kuaminika. Zana zilizopo, kuanzia masoko ya mtandaoni hadi programu za hali ya hewa, kila moja hutatua sehemu moja tu. AgriFlow inaziunganisha kuzunguka jambo moja: mahitaji yaliyothibitishwa.',
      },
      {
        title: 'Tulipo sasa',
        body: 'AgriFlow bado iko mwanzoni. Tunaandaa majaribio yetu ya kwanza na tunashirikiana na wanunuzi, vikundi vya wakulima na washirika kuyaunda.',
      },
      {
        title: 'Imeundwa kwa ajili ya Afrika',
        body: 'Nchi nyingi, sarafu na lugha mbalimbali tangu mwanzo, na programu zilizoundwa kwa simu na mitandao ambayo watu hutumia kwa kweli.',
      },
    ],
  },
  requestDemo: {
    title: 'Omba onyesho',
    description: 'Tueleze kuhusu taasisi yako nasi tutakuonyesha jinsi AgriFlow inavyoweza kukufaa.',
    lede: 'Tueleze kidogo kukuhusu nasi tutawasiliana nawe kupanga onyesho.',
    form: {
      name: 'Jina lako',
      organisation: 'Taasisi',
      role: 'Wewe ni…',
      roles: {
        buyer: 'Mnunuzi wa chakula',
        farmerGroup: 'Mkulima au kikundi cha wakulima',
        partner: 'Afisa ugani au msafirishaji',
        other: 'Mwingine',
      },
      country: 'Nchi',
      chooseCountry: 'Chagua nchi',
      email: 'Barua pepe',
      phone: 'Simu (si lazima)',
      message: 'Ungependa kuona nini? (si lazima)',
      consent: 'Nakubali AgriFlow iwasiliane nami kuhusu ombi hili.',
      privacyLink: 'Jinsi tunavyotumia taarifa zako',
      submit: 'Tuma ombi',
      sending: 'Inatuma…',
      success: 'Asante. Tumepokea ombi lako na tutawasiliana nawe.',
      error: 'Hatukuweza kutuma ombi lako sasa hivi. Tafadhali jaribu tena baada ya muda mfupi.',
      required: 'Lazima',
      honeypot: 'Acha sehemu hii wazi',
    },
  },
  privacy: {
    title: 'Taarifa ya faragha',
    description:
      'Jinsi AgriFlow inavyokusanya, kutumia na kulinda taarifa binafsi unazotupa, ikiwemo maombi ya onyesho.',
    draftNotice: 'Rasimu: taarifa hii inaandaliwa kwa ushauri wa kisheria na itakamilishwa kabla ya kuzinduliwa.',
    sections: [
      {
        title: 'Tunachokusanya',
        body: 'Unapoomba onyesho, tunakusanya taarifa unazoweka: jina, taasisi, nafasi yako, nchi, barua pepe, na ukipenda, namba ya simu na ujumbe.',
      },
      {
        title: 'Kwa nini',
        body: 'Ni kwa ajili ya kujibu ombi lako na kupanga onyesho tu. Hatuuzi taarifa zako wala kuzitumia kwa matangazo mengine.',
      },
      { title: 'Mawasiliano', body: 'Kwa maswali kuhusu taarifa zako, tumia fomu ya ombi nasi tutakujibu.' },
    ],
  },
  terms: {
    title: 'Masharti ya matumizi',
    description:
      'Masharti yanayotumika unapotumia tovuti ya AgriFlow, ikiwemo jinsi ya kuelewa taarifa kuhusu huduma zinazoendelea kuundwa.',
    draftNotice: 'Rasimu: masharti haya yanaandaliwa kwa ushauri wa kisheria na yatakamilishwa kabla ya kuzinduliwa.',
    sections: [
      {
        title: 'Tovuti hii',
        body: 'Tovuti hii inaeleza AgriFlow, ambayo bado inaundwa. Huduma zilizoelezwa zinaweza kubadilika kabla ya kuzinduliwa.',
      },
    ],
  },
  notFound: {
    title: 'Ukurasa haukupatikana',
    body: 'Hatukuweza kupata ukurasa huo. Huenda umehamishwa.',
    home: 'Nenda ukurasa wa mwanzo',
  },
  footer: {
    rights: 'AgriFlow. Haki zote zimehifadhiwa.',
    privacy: 'Faragha',
    terms: 'Masharti',
  },
}
