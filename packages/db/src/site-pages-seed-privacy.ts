import type { LegalPageContent } from './site-pages-schema';

export const SEED_PRIVACY_PAGE: LegalPageContent = {
  metaTitle: 'Privacy Policy',
  metaDescription:
    'How AskAlert Technologies Limited collects, uses, shares, and protects personal data under Nigerian law.',
  eyebrow: 'Legal',
  title: 'Privacy Policy',
  description:
    'How we collect, use, share, and protect personal data when you use AskAlert.',
  versionLabel: 'Version 0.1 (draft)',
  effectiveDate: '[DATE]',
  lastUpdated: '[DATE]',
  draftBanner: {
    enabled: true,
    title: 'DRAFT — not legal advice',
    body: 'Prepared for AskAlert Technologies Limited. A Nigerian lawyer must review, correct, and approve this policy before it is treated as final. Placeholders in [SQUARE BRACKETS] will be filled before publish.',
  },
  sections: [
    {
      id: 'who-we-are',
      heading: '1. Who we are and how to contact us',
      body: `AskAlert is operated by **AskAlert Technologies Limited**, a company registered in Nigeria (RC number [NUMBER]), with its registered office at [ADDRESS]. We are the **data controller** for the personal data described in this policy.

- **General privacy contact:** [privacy@askalert.com]
- **Data Protection Officer:** [NAME], [dpo@askalert.com] (if appointed)
- **Registration with the Nigeria Data Protection Commission (NDPC):** [STATUS AND NUMBER, IF APPLICABLE]`,
    },
    {
      id: 'what-this-covers',
      heading: '2. What this policy covers',
      body: `This policy explains how we collect, use, share, and protect personal data when you use the AskAlert website, web app, mobile web app (PWA), the AskAlert WhatsApp number, and related services (together, the **Services**). It applies to **buyers**, **vendors**, visitors, and anyone who communicates with us or whose details are provided to us by a user.

AskAlert is a marketplace service. Buyers describe what they need, and AskAlert’s software helps find vendors, request and compare quotes, and arrange bookings. An AI-powered agent can carry out parts of this on a user’s behalf (see section 5).`,
    },
    {
      id: 'data-we-collect',
      heading: '3. Personal data we collect',
      body: `| Category | Examples | Source |
| --- | --- | --- |
| **Account and contact data** | Name, email, phone or WhatsApp number, password (stored in protected form), profile picture, language, mode (buyer or vendor) | You |
| **Buyer request data** | Category, description, dates, budget, area or location, photos, voice notes, preferences | You |
| **Vendor profile and verification data** | Business or trading name, categories, service areas, rate cards, availability, portfolio photos, identity documents, proof of business or property, licences, bank details for payouts, verification status | You, verification providers, and public sources |
| **Messages and media** | Chats between buyers, vendors, and the AskAlert agent; photos, voice notes (and transcripts), quotes, attachments | You and other users |
| **Transaction data** | Quotes, bookings, payment status and amounts, payout status, invoices and receipts, refunds, claims | You, other users, and payment partners |
| **Reviews and reputation data** | Ratings, reviews, response time, completion and cancellation records, claims history, internal reputation scores | You, other users, and our systems |
| **Technical and usage data** | IP address, device and browser type, language, pages viewed, actions in the app, error logs, push-notification subscription details, approximate location from IP | Your device and our systems |
| **Location data** | The neighbourhood or area you enter; precise location only if you choose to share it | You |
| **Communication preferences and consents** | Marketing choices, WhatsApp opt-in and opt-out records, notification settings, quiet hours | You |
| **Support and claims data** | Messages to support, evidence you upload, outcomes | You and other parties |
| **Information from third parties** | Public business information (for example from mapping services), sign-in details from Google if you choose Google sign-in, results from identity or business verification checks | Third parties |

**Sensitive personal data.** We do not intentionally ask for sensitive personal data (such as health, religion, or political opinions). Please do not include it in messages or uploads. If we use identity checks that involve biometric data (for example a selfie match), we will tell you at that step and ask for your consent where required.

**Payment card data.** We do not store full card numbers. Payments are handled by licensed payment partners (see section 8).`,
    },
    {
      id: 'how-we-use',
      heading: '4. How we use personal data and our legal bases',
      body: `We use personal data only where the law allows. Under the NDPA, the main bases are consent, performance of a contract, legal obligation, and legitimate interests.

| Purpose | Examples | Legal basis |
| --- | --- | --- |
| **Provide the Services** | Create your account; match requests to vendors; send and compare quotes; manage bookings, messages, and notifications | Contract |
| **Verify users and prevent fraud** | Review vendor documents; detect fake accounts, scams, and attempts to avoid fees or share contact details; filter unsafe messages | Legitimate interests; legal obligation; consent where required |
| **Process payments and payouts** | Pass transaction details to payment partners; keep records of payments, fees, and refunds | Contract; legal obligation |
| **Safety, claims, and support** | Handle complaints, claims, and evidence; respond to requests | Contract; legitimate interests |
| **Send service messages** | Booking confirmations, quote alerts, reminders, security alerts, through the app, push, email, SMS, and WhatsApp | Contract; consent for WhatsApp messages |
| **Marketing** | Offers, news, and tips | Consent (you can withdraw it at any time) |
| **Improve and secure the Services** | Analytics, testing, debugging, measuring costs, preventing abuse, training our own matching rules | Legitimate interests |
| **Legal and regulatory compliance** | Tax, accounting, anti-money-laundering requests, court orders | Legal obligation |

Where we rely on legitimate interests, we balance them against your rights and interests.`,
    },
    {
      id: 'ai-processing',
      heading: '5. AI and automated processing',
      body: `- **The AskAlert agent.** Our AI agent can ask clarifying questions, contact vendors, request and parse quotes, suggest replies, and (if you choose that mode) negotiate within limits you set. It identifies itself to vendors as an AI assistant acting for a customer. It cannot commit you to a booking or a payment without your approval.
- **How your data reaches AI providers.** Parts of your request, messages, and relevant profile data are sent to AI service providers to produce responses. We instruct our AI providers not to use this data to train their general models, subject to their terms [LAWYER TO CONFIRM CURRENT PROVIDER TERMS].
- **Automated decisions and profiling.** We use automated processes to match vendors to requests, rank quotes, calculate reputation scores, limit lead alerts for unresponsive vendors, detect fraud, and apply usage limits. These can affect which requests a vendor sees and which features are available to a user.
- **Your choices.** You can ask for human review of an automated decision that significantly affects you, object to certain processing, and choose a mode that limits the agent’s role. See section 12.
- **Accuracy.** AI output can contain mistakes. Please check important details before you confirm a booking.`,
    },
    {
      id: 'whatsapp',
      heading: '6. WhatsApp and other messaging',
      body: `- We send messages through the **WhatsApp Business Platform** provided by Meta. Messages you send to our WhatsApp number and our replies are processed by Meta under its own terms and privacy policy, in addition to this policy.
- We message you on WhatsApp only if you have opted in, for example by messaging us first or ticking an opt-in box. You can opt out at any time by replying STOP or changing your settings. Some WhatsApp features are part of paid plans.
- If you are a vendor, we may send lead alerts and related service messages after you opt in.
- WhatsApp message content may be visible to Meta. Do not send sensitive information over WhatsApp.
- To protect users, we may automatically filter messages that relay through AskAlert to detect contact details, scams, or abuse (see our Terms).`,
    },
    {
      id: 'sharing',
      heading: '7. Who we share personal data with',
      body: `We **do not sell** personal data. We share it only as described below.

- **Other users.** Buyers and vendors see what is needed to arrange a job: a display name or alias, request details, quotes, ratings, and messages in the shared chat. [Phone numbers, exact addresses, and other contact details are shared with the other party only after a booking is confirmed, or earlier if you choose.]
- **Service providers (processors)** that help us run the Services, under written agreements: hosting and database providers (for example Supabase and Cloudflare), AI providers (for example Anthropic), messaging providers (Meta/WhatsApp, email and SMS providers), push-notification infrastructure, error monitoring (for example Sentry), mapping and business-data providers (for example Google), and identity or business verification providers [LIST FINAL PROVIDERS].
- **Payment partners:** see section 8.
- **Professional advisers, auditors, and insurers,** under confidentiality.
- **Authorities and legal requests,** where required by law, court order, or to protect rights, safety, and prevent fraud.
- **Business transfers.** If AskAlert is involved in a merger, acquisition, or sale of assets, personal data may be transferred, and we will tell you if the policy changes.
- **With your consent,** for any other sharing.`,
    },
    {
      id: 'payments',
      heading: '8. Payments',
      body: `Payments are processed by **[PAYMENT PROCESSOR]** under its own terms and privacy policy. We receive payment status and limited transaction details. We do not store full card numbers.`,
    },
    {
      id: 'transfers',
      heading: '9. International transfers',
      body: `We are based in Nigeria. Some of our service providers store or process data outside Nigeria, for example in [COUNTRIES/REGIONS OF HOSTING, AI, MESSAGING, EMAIL AND MONITORING PROVIDERS]. Where personal data leaves Nigeria, we use safeguards required by the NDPA and the GAID, such as adequacy decisions, written agreements with data-protection terms, or your consent where appropriate. Contact us to learn more about the safeguards used.`,
    },
    {
      id: 'retention',
      heading: '10. How long we keep personal data',
      body: `| Data | Retention (to be confirmed with your lawyer) |
| --- | --- |
| Account and profile data | While your account is active, then [X months] after closure |
| Chat messages and media | Full content for [90 days]; after that, summaries and records needed for claims or legal reasons for [X months] |
| Voice notes and uploaded photos | [30 days] unless linked to an open claim |
| Vendor verification documents | While the vendor is active and [X months] after closure |
| Transaction, payment, and invoice records | [6 years], or as required by tax and accounting law |
| Claims and evidence | [X years] after closure |
| Consent and opt-out records | For as long as needed to prove consent, plus [X years] |
| Security and access logs | [12 months] |
| Push-notification subscriptions | Until you unsubscribe, or the subscription expires |

We delete or anonymise data when it is no longer needed, unless the law requires us to keep it.`,
    },
    {
      id: 'security',
      heading: '11. Security',
      body: `We use measures that include encryption in transit, access controls, row-level data protection, multi-factor authentication for administrators, private storage with time-limited access links for sensitive documents, audit logging of administrator actions, vendor verification, and monitoring for abuse. No system is perfectly secure, so please use a strong, unique password and keep your sign-in details private.

If a personal data breach is likely to risk people’s rights and freedoms, we will notify the NDPC within **72 hours** of becoming aware of it, and we will notify affected individuals promptly where the risk is high. Where the law requires, we will also notify the relevant national cybersecurity authority.`,
    },
    {
      id: 'your-rights',
      heading: '12. Your rights',
      body: `Under the NDPA you have rights that include:

- **Access:** ask for a copy of your personal data and information about how we use it.
- **Rectification:** correct inaccurate or incomplete data.
- **Erasure:** ask us to delete your data in certain circumstances.
- **Restriction and objection:** limit or object to certain processing, including direct marketing.
- **Portability:** receive your data in a structured, commonly used format.
- **Withdraw consent** at any time, without affecting earlier lawful processing.
- **Automated decisions:** ask for human review of decisions based solely on automated processing that significantly affect you.
- **Complain** to the Nigeria Data Protection Commission (NDPC).

To exercise these rights, use **Settings, Privacy** in the app, or contact [privacy@askalert.com]. We may need to verify your identity. We will respond within [30 days]. We may keep some data where the law requires it (for example payment records). There is normally no charge unless a request is clearly unfounded or excessive.`,
    },
    {
      id: 'children',
      heading: '13. Children',
      body: `The Services are for people **18 years and older**. We do not knowingly collect data from children. If you believe a child has given us personal data, please contact us and we will delete it.`,
    },
    {
      id: 'cookies',
      heading: '14. Cookies and similar technologies',
      body: `We use essential storage (for sign-in, security, and app function) and, where permitted, limited analytics to understand how the Services perform. We also use push-notification technology if you choose to turn it on. We do not use third-party advertising cookies [CONFIRM]. You can control cookies in your browser and notifications in Settings or your device. See also Annex 3 (Cookie and Notification Notice) in our Terms.`,
    },
    {
      id: 'reviews',
      heading: '15. Reviews and public information',
      body: `Reviews, ratings, and public vendor profile information (such as business name, categories, areas, rate ranges, ratings, response time, and badges) may be visible to other users and to the public. Do not post personal data about other people in reviews.`,
    },
    {
      id: 'third-party',
      heading: '16. Third-party sign-in and links',
      body: `If you sign in with Google, we receive basic profile information (for example name and email) as you permit. Links to other sites are covered by those sites’ own policies.`,
    },
    {
      id: 'changes',
      heading: '17. Changes to this policy',
      body: `We may update this policy. We will post the new version with its date and, for material changes, notify you in the app or by message. Where the law requires, we will ask for your consent again.`,
    },
    {
      id: 'deletion',
      heading: '18. Data deletion instructions',
      body: `You can delete your account and data in any of these ways:

1. **In the app:** Settings, Privacy, Delete my account.
2. **By email:** write to [privacy@askalert.com] from your registered email address with the subject “Delete my data.”
3. **On WhatsApp:** message our AskAlert number with the words “Delete my data,” and we will send a secure confirmation link.

We will confirm and complete deletion within [30 days]. We will keep only the records we must keep by law (for example payment and tax records) and will delete or anonymise them when the retention period ends.`,
    },
  ],
};
