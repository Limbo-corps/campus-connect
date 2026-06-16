import { Shield, FileText, Accessibility, type LucideIcon } from 'lucide-react'

export interface LegalSection {
  id: string
  heading: string
  body: string[]
}

export interface LegalDoc {
  slug: 'privacy' | 'terms' | 'accessibility'
  title: string
  tagline: string
  icon: LucideIcon
  updated: string
  sections: LegalSection[]
}

const UPDATED = 'June 2026'

export const LEGAL_DOCS: Record<LegalDoc['slug'], LegalDoc> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    tagline: 'What we collect, why, and the control you keep over it.',
    icon: Shield,
    updated: UPDATED,
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        body: [
          'Campus Connect is a student community platform. This policy explains, in plain language, what information the app stores and how it is used. We aim to collect only what we need to make the product work.',
        ],
      },
      {
        id: 'what-we-collect',
        heading: 'What we collect',
        body: [
          'Account details you provide: username, email, name, and an optional bio, tagline, and avatar.',
          'Content you create: posts, comments, likes, and the campus you choose to join.',
          'Basic technical data needed to keep you signed in, such as authentication tokens stored in your browser.',
        ],
      },
      {
        id: 'how-we-use-it',
        heading: 'How we use it',
        body: [
          'To show your profile and content to other members of the community, to power your feed, and to keep your session secure.',
          'We do not sell your personal data, and we do not run third-party advertising trackers.',
        ],
      },
      {
        id: 'your-choices',
        heading: 'Your choices',
        body: [
          'You can edit your profile, posts, and comments at any time, or delete content you have created.',
          'You can leave a campus from the Campuses page, and you can sign out to clear your session from a device.',
        ],
      },
      {
        id: 'contact',
        heading: 'Questions?',
        body: [
          'Reach us through the Help & support form in the app and we will get back to you.',
        ],
      },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    tagline: 'The ground rules for using Campus Connect.',
    icon: FileText,
    updated: UPDATED,
    sections: [
      {
        id: 'acceptance',
        heading: 'Acceptance',
        body: [
          'By creating an account and using Campus Connect, you agree to these terms. If you do not agree, please do not use the service.',
        ],
      },
      {
        id: 'your-account',
        heading: 'Your account',
        body: [
          'You are responsible for activity on your account and for keeping your credentials secure.',
          'Provide accurate information when you register, and keep your profile up to date.',
        ],
      },
      {
        id: 'acceptable-use',
        heading: 'Acceptable use',
        body: [
          'Be respectful. Do not post content that is harassing, hateful, illegal, or that infringes on someone else’s rights.',
          'Do not attempt to disrupt the service, scrape it at scale, or abuse other members.',
          'You own the content you post. By posting, you grant Campus Connect permission to display it within the platform.',
        ],
      },
      {
        id: 'content-moderation',
        heading: 'Content & moderation',
        body: [
          'Content that violates these terms may be removed, and accounts that repeatedly break the rules may be suspended.',
        ],
      },
      {
        id: 'disclaimer',
        heading: 'Disclaimer',
        body: [
          'Campus Connect is provided “as is.” It is a student-built community project and may change or have downtime as it evolves.',
        ],
      },
    ],
  },
  accessibility: {
    slug: 'accessibility',
    title: 'Accessibility',
    tagline: 'Our commitment to a product everyone can use.',
    icon: Accessibility,
    updated: UPDATED,
    sections: [
      {
        id: 'commitment',
        heading: 'Our commitment',
        body: [
          'We want Campus Connect to be usable by everyone, including people who rely on assistive technologies. Accessibility is treated as part of building features, not an afterthought.',
        ],
      },
      {
        id: 'what-we-do',
        heading: 'What we do',
        body: [
          'Interactive controls use semantic markup and accessible labels so screen readers can describe them.',
          'Colour is driven by a single themeable accent with light and dark modes, so you can pick a comfortable palette and contrast.',
          'The interface is keyboard navigable, and focus states are visible.',
        ],
      },
      {
        id: 'preferences',
        heading: 'Personalisation',
        body: [
          'Switch between light and dark themes from the navbar, and change the accent colour from the palette picker to suit your needs.',
        ],
      },
      {
        id: 'feedback',
        heading: 'Feedback',
        body: [
          'Found a barrier? Tell us through Help & support. Accessibility reports are prioritised.',
        ],
      },
    ],
  },
}

export const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Accessibility', href: '/accessibility' },
] as const
