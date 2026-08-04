import type { Image } from 'sanity'

export interface LocaleString {
  pt?: string
  en?: string
}

export type LocaleText = LocaleString

export interface SiteMedia {
  hint?: string
  image?: Image
  video?: { asset?: { url?: string } }
}

export interface Stat {
  number?: string
  label?: LocaleString
}

export interface Massage {
  title?: LocaleString
  homeDescription?: LocaleText
  rateDescription?: LocaleText
  duration1?: string
  duration2?: string
  price1?: string
  price2?: string
  media?: SiteMedia
}

export interface TimelineStep {
  kicker?: LocaleString
  title?: LocaleString
  body?: LocaleText
  media?: SiteMedia
}

export interface HouseRule {
  title?: LocaleString
  body?: LocaleText
}

export interface FaqItem {
  question?: LocaleString
  answer?: LocaleText
}

export interface Addition {
  title?: LocaleString
  value?: LocaleString
  body?: LocaleText
}

export interface SiteContent {
  brandName?: string
  whatsapp?: string
  email?: string
  addressLine?: string
  addressNote?: LocaleString
  hoursLine?: LocaleString
  hoursNote?: LocaleString
  footerTagline?: LocaleString

  heroMedia?: SiteMedia
  heroEyebrow?: LocaleString
  heroTitlePt?: string
  heroTitleEn?: string
  heroSubtitle?: LocaleText

  houseIntroEyebrow?: LocaleString
  houseIntroParagraph?: LocaleText
  stats?: Stat[]

  massagesEyebrow?: LocaleString
  massages?: Massage[]

  videoBannerQuote?: LocaleText
  videoBannerCaption?: LocaleString
  videoBannerMedia?: SiteMedia

  homeGallery?: SiteMedia[]

  houseHeroMedia?: SiteMedia
  houseHeroEyebrow?: LocaleString
  houseHeroTitle?: LocaleString
  houseHeroSubtitle?: LocaleText

  timelineEyebrow?: LocaleString
  timelineNote?: LocaleString
  timelineSteps?: TimelineStep[]

  quoteText?: LocaleText

  houseGallery?: SiteMedia[]

  rulesEyebrow?: LocaleString
  rulesNote?: LocaleString
  rulesIntro?: LocaleText
  houseRules?: HouseRule[]

  faqEyebrow?: LocaleString
  faq?: FaqItem[]

  ratesEyebrow?: LocaleString
  ratesTitle?: LocaleString

  eveningRitualMedia?: SiteMedia
  eveningRitualQuote?: LocaleText
  eveningRitualLabel?: LocaleString

  additionsEyebrow?: LocaleString
  additions?: Addition[]

  paymentTitle?: LocaleString
  paymentBody?: LocaleText
  cancellationTitle?: LocaleString
  cancellationBody?: LocaleText

  bookingEyebrow?: LocaleString
  bookingTitle?: LocaleString
  bookingSidebarMedia?: SiteMedia
  bookingBeforeSendNote?: LocaleText
  bookingConfirmation?: LocaleString
}
