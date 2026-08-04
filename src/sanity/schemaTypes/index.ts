import type { SchemaTypeDefinition } from 'sanity'

import { localeString } from './objects/localeString'
import { localeText } from './objects/localeText'
import { media } from './objects/media'
import { massage } from './objects/massage'
import { timelineStep } from './objects/timelineStep'
import { houseRule } from './objects/houseRule'
import { faqItem } from './objects/faqItem'
import { addition } from './objects/addition'
import { siteContent } from './siteContent'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    localeString,
    localeText,
    media,
    massage,
    timelineStep,
    houseRule,
    faqItem,
    addition,
    siteContent,
  ],
}
