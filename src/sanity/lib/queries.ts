// Shared GROQ fragment for a "siteMedia" object: image is fetched raw (so
// @sanity/image-url can build URLs without another round-trip), video is
// dereferenced to its file URL since there's no equivalent builder for files.
const mediaFragment = `{ hint, image, video{ asset-> { url } } }`

export const SITE_CONTENT_QUERY = `*[_type == "siteContent"][0]{
  brandName,
  whatsapp,
  email,
  addressLine,
  addressNote,
  hoursLine,
  hoursNote,
  footerTagline,

  heroMedia ${mediaFragment},
  heroEyebrow,
  heroTitlePt,
  heroTitleEn,
  heroSubtitle,

  houseIntroEyebrow,
  houseIntroParagraph,
  stats,

  massagesEyebrow,
  massages[]{
    title, homeDescription, rateDescription,
    duration1, duration2, price1, price2,
    media ${mediaFragment}
  },

  videoBannerQuote,
  videoBannerCaption,
  videoBannerMedia ${mediaFragment},

  homeGallery[] ${mediaFragment},

  houseHeroMedia ${mediaFragment},
  houseHeroEyebrow,
  houseHeroTitle,
  houseHeroSubtitle,

  timelineEyebrow,
  timelineNote,
  timelineSteps[]{
    kicker, title, body,
    media ${mediaFragment}
  },

  quoteText,

  houseGallery[] ${mediaFragment},

  rulesEyebrow,
  rulesNote,
  rulesIntro,
  houseRules[]{ title, body },

  faqEyebrow,
  faq[]{ question, answer },

  ratesEyebrow,
  ratesTitle,

  eveningRitualMedia ${mediaFragment},
  eveningRitualQuote,
  eveningRitualLabel,

  additionsEyebrow,
  additions[]{ title, value, body },

  paymentTitle,
  paymentBody,
  cancellationTitle,
  cancellationBody,

  bookingEyebrow,
  bookingTitle,
  bookingSidebarMedia ${mediaFragment},
  bookingBeforeSendNote,
  bookingConfirmation
}`
