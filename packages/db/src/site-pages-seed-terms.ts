import type { LegalPageContent } from './site-pages-schema';

export const SEED_TERMS_PAGE: LegalPageContent = {
  metaTitle: 'Terms of Use',
  metaDescription:
    'AskAlert Terms of Use for buyers and vendors using the marketplace, WhatsApp number, and related services.',
  eyebrow: 'Legal',
  title: 'Terms of Use',
  description:
    'Please read these Terms carefully. By creating an account or using AskAlert, you agree to these Terms and our Privacy Policy.',
  versionLabel: 'Version 0.1 (draft)',
  effectiveDate: '[DATE]',
  lastUpdated: '[DATE]',
  draftBanner: {
    enabled: true,
    title: 'DRAFT — not legal advice',
    body: 'Prepared for AskAlert Technologies Limited. A Nigerian lawyer must review, correct, and approve these Terms before they are treated as final. Placeholders in [SQUARE BRACKETS] will be filled before publish.',
  },
  sections: [
    {
      id: 'about',
      heading: '1. About AskAlert and who can use it',
      body: `**1.1 Who we are.** The Services are provided by AskAlert Technologies Limited, RC [NUMBER], [ADDRESS] (“AskAlert,” “we,” “us”). Contact: [support@askalert.com].

**1.2 Eligibility.** You must be at least **18 years old**, able to enter a binding contract, and not barred from using the Services by law. If you use the Services for a business, you confirm you have authority to bind that business.

**1.3 Your account.** You create one account. It has a **buyer profile** and may have a **vendor profile** after verification. You must give accurate information, keep it up to date, keep your sign-in details secure, and tell us promptly about unauthorised use. You are responsible for activity on your account. You may not create multiple accounts to avoid limits, fees, or enforcement, and you may not book, review, or message your own vendor profile.

**1.4 Verification.** “Verified” badges mean we completed the checks described at the time. They are not a guarantee of quality, safety, licensing, or future conduct. Use your own judgement.`,
    },
    {
      id: 'what-askalert-is',
      heading: '2. What AskAlert is, and what it is not',
      body: `**2.1** AskAlert is a **marketplace and technology service** that helps buyers find vendors, request and compare quotes, and arrange bookings, and helps vendors find customers.

**2.2** **AskAlert is not the provider of the services offered by vendors** (for example accommodation, car hire, events, beauty, home care, auto, professional, or tutoring services). The contract for each service is **between the buyer and the vendor**. Vendors are independent businesses, not employees, agents, or partners of AskAlert.

**2.3** AskAlert does not guarantee that any vendor will respond, that any quote will be available or accurate, or that any service will be completed or satisfactory. We are not responsible for vendors’ acts or omissions, except as stated in these Terms or required by law.

**2.4** AskAlert is not a bank, and nothing in the Services is financial, legal, tax, or professional advice.`,
    },
    {
      id: 'ai-agent',
      heading: '3. The AskAlert agent (AI)',
      body: `**3.1 What it does.** The AskAlert agent is an AI system. Depending on the mode you choose, it can ask you questions, find vendors, send requests, collect and compare quotes, suggest replies, and (in Autopilot, where available) negotiate within limits you set.

**3.2 Modes.** **Match** (we find and rank options; you contact them yourself), **Relay** (conversations pass through AskAlert), **Assist** (the agent drafts replies; you approve), **Autopilot** (the agent negotiates within your limits and returns the best options). Availability depends on your plan.

**3.3 Your authority and limits.** You authorise the agent to act only within the instructions, budgets, and limits you set. The agent will not accept a booking or make a payment without your approval. You remain responsible for confirming bookings and payments.

**3.4 AI disclosure.** The agent tells vendors it is an AI assistant acting for a customer. Vendors agree that AskAlert and its agent may communicate with them, record and analyse those conversations, and use automated tools to understand and respond.

**3.5 Errors.** AI output can be wrong, incomplete, or misunderstood. Check key details (price, date, location, scope) before you confirm. AskAlert is not liable for decisions you make relying on agent output, except where the law does not allow that exclusion.

**3.6 Do not misuse the agent.** You must not try to manipulate, deceive, or extract confidential instructions from the agent, or use it for anything unrelated to the Services.`,
    },
    {
      id: 'bookings',
      heading: '4. Requests, quotes, and bookings',
      body: `**4.1 Requests.** A request is an invitation for vendors to quote. It is not an offer to buy.

**4.2 Quotes.** A quote is an offer by a vendor. A booking is formed when you accept a quote and any required payment is made or confirmed. Some jobs need an inspection before a final price. Any change in price or scope requires your approval before extra work starts.

**4.3 Cancellations and changes.** Cancellation, rescheduling, deposit, and refund terms for each category are shown before you book. Where a vendor’s own policy applies, it is shown in the booking.

**4.4 No-shows and delays.** If a vendor or buyer does not show up or is seriously late, the Claims process in section 8 applies.`,
    },
    {
      id: 'fees',
      heading: '5. Fees, plans, and credits',
      body: `**5.1 Free and paid plans.** The Services include a free plan and paid plans or passes (for example **Starter**). Features, limits (such as requests per month, vendors per request, and messages), and prices are shown on our Plans page and may change with notice.

**5.2 WhatsApp messaging.** WhatsApp messaging and alerts are a paid feature (except limited free messages we describe). Sending messages carries third-party costs, which is why limits apply.

**5.3 Commission and fees.** AskAlert charges vendors a commission on bookings arranged through the Services, and may charge buyers a booking fee. The amounts are shown before you confirm and are described in the Vendor Terms.

**5.4 Prepaid passes and credit packs.** Passes and credits are for your use only, are not transferable, are not redeemable for cash, and expire as stated at purchase [LAWYER TO CONFIRM EXPIRY AND REFUND RULES UNDER CONSUMER LAW]. Unused allowances do not carry over unless we say so.

**5.5 Fair use.** We may limit or pause activity that causes unusually high cost, looks like abuse, or breaches these Terms.

**5.6 Taxes.** Prices include or exclude VAT or other taxes as shown. Vendors are responsible for their own taxes.`,
    },
    {
      id: 'payments',
      heading: '6. Payments',
      body: `**6.1** Payments are processed by **[PAYMENT PROCESSOR]** under its own terms. Each payment is a standard payment settled in the normal way. AskAlert does not hold customer funds and does not delay or condition the release of any payment. Where you pay in stages, each stage is a separate payment you initiate (a deposit at booking and a balance after the job), and unpaid balances may affect your account.

**6.2** Commission and processing fees are deducted from each payment as shown at checkout or in the Vendor Terms. Refunds, where due, follow the booking terms and claim outcomes.

**6.3 Paying outside AskAlert.** Payments made outside AskAlert are not covered by AskAlert’s claims process, goodwill policy, reviews, or payment protections, and are subject to section 9 (non-circumvention).

**6.4 Compliance.** We and our payment partners may verify identity, screen for fraud and sanctions, and comply with anti-money-laundering rules. We may refuse or reverse transactions where the law requires.`,
    },
    {
      id: 'messaging',
      heading: '7. Messaging, monitoring, and your content',
      body: `**7.1 Messaging through AskAlert.** Messages that pass through AskAlert are stored and may be scanned **automatically** to detect scams, abuse, attempts to share contact details to avoid the platform, and policy breaches. Humans may review flagged messages and related evidence.

**7.2 Contact details.** Phone numbers, emails, social handles, and exact addresses are normally shared only after a booking is confirmed. We may mask or block them in messages before that.

**7.3 Your content.** You keep ownership of what you upload (messages, photos, reviews, listings). You grant AskAlert a non-exclusive, worldwide, royalty-free licence to host, process, display, and use it to operate, secure, and improve the Services and to enforce these Terms. You confirm you have the rights to give this licence and that your content is lawful and not misleading.

**7.4 Reviews.** Reviews must be honest, based on your own booking, and free of personal data about others, hate speech, or threats. We may remove content that breaks these Terms.`,
    },
    {
      id: 'claims',
      heading: '8. Claims and dispute resolution',
      body: `**8.1 Claims.** If something goes wrong (for example a no-show, a service not as described, poor quality, overcharging, a safety concern, or an unpaid amount), either party can open a claim in the app within the time shown for the category.

**8.2 Process.** We invite both sides to respond with evidence by a deadline and may ask for more information. We act as a neutral facilitator and decide outcomes in line with these Terms and the booking terms. Outcomes can include [a vendor-approved refund, a goodwill credit, a reputation adjustment, or suspension].

**8.3 Goodwill policy.** AskAlert may, at its discretion, offer a limited goodwill refund or credit for eligible bookings paid on AskAlert, up to a published cap [CONFIRM WITH LAWYER THAT THIS IS NOT AN INSURANCE PRODUCT]. This is not a legal guarantee.

**8.4 Your legal rights remain.** Using the claims process does not remove your right to seek other remedies under law.`,
    },
    {
      id: 'non-circumvention',
      heading: '9. Using AskAlert fairly: non-circumvention',
      body: `[LAWYER TO REVIEW ENFORCEABILITY, CONSUMER-PROTECTION AND COMPETITION-LAW LIMITS.]

**9.1 Vendors.** For [12] months after AskAlert introduces you to a buyer, you agree to arrange and take payment for services to that buyer that began as that introduction through AskAlert, and not to ask or encourage the buyer to pay outside AskAlert to avoid fees. If you do, you agree to pay AskAlert a fee equal to the commission that would have applied, and we may suspend or remove your account and benefits.

**9.2 Buyers.** You are free to use any vendor you already know. For a job that began as an introduction through AskAlert, we ask that you complete it through AskAlert. If you pay outside AskAlert, you lose AskAlert’s protections and benefits for that job, and we may limit your access to features.

**9.3 Both sides.** You must not use the Services only to find a counterparty and then move the transaction elsewhere to avoid fees.`,
    },
    {
      id: 'acceptable-use',
      heading: '10. Acceptable use',
      body: `You must not:

- break the law, or offer or request illegal, unsafe, or fraudulent services;
- give false identity, business, licence, or availability information;
- harass, threaten, discriminate against, or abuse anyone;
- share contact details or social handles to avoid the platform, or encourage others to;
- post fake, paid, or retaliatory reviews;
- upload malicious files or content you do not have rights to;
- scrape, copy, reverse-engineer, or overload the Services, or bypass security or usage limits;
- interfere with or manipulate the AskAlert agent, matching, ranking, or reputation systems;
- impersonate others or misuse another person’s account or payment method;
- use the Services for money laundering, sanctions evasion, or any prohibited purpose.`,
    },
    {
      id: 'safety',
      heading: '11. Safety',
      body: `Meeting people and visiting properties involve risk. Take sensible precautions: verify details, meet or work in safe places, tell someone where you are, and report concerns through the app. In an emergency, contact local emergency services first. AskAlert does not supervise vendors or buyers at the job location.`,
    },
    {
      id: 'third-party-services',
      heading: '12. Third-party services',
      body: `The Services use third-party platforms, including WhatsApp (Meta), Google, payment partners, and cloud providers. Their terms and privacy policies apply to your use of them. We are not responsible for their services, outages, or policy changes, including changes to WhatsApp’s rules or prices that affect features or plans.`,
    },
    {
      id: 'ip',
      heading: '13. Intellectual property',
      body: `AskAlert, the logo, software, design, and content we create are owned by AskAlert Technologies Limited or its licensors. We give you a limited, revocable, non-exclusive, non-transferable licence to use the Services for their intended purpose. You may not copy, modify, or create derivative works except as the law allows. Feedback you give us may be used without payment or obligation.`,
    },
    {
      id: 'disclaimers',
      heading: '14. Disclaimers',
      body: `To the fullest extent allowed by law, the Services are provided “as is” and “as available.” We do not promise uninterrupted or error-free service, that vendors or buyers will behave as described, or that AI output is accurate. Nothing in these Terms limits any rights you have under mandatory consumer-protection law.`,
    },
    {
      id: 'liability',
      heading: '15. Limitation of liability',
      body: `[LAWYER TO SET AMOUNTS AND CHECK AGAINST CONSUMER LAW.]

**15.1** Nothing limits liability that cannot be limited by law, including for fraud, death, or personal injury caused by negligence.

**15.2** Subject to that, to the extent allowed by law, AskAlert is not liable for indirect or consequential loss, lost profits, lost opportunities, or loss caused by vendors, buyers, or third parties.

**15.3** Our total liability to you for claims connected with the Services in any 12-month period is limited to the greater of [the fees you paid AskAlert in that period] and [₦ AMOUNT].`,
    },
    {
      id: 'indemnity',
      heading: '16. Indemnity',
      body: `You will compensate AskAlert for losses, claims, and reasonable costs arising from your breach of these Terms, your content, or your unlawful conduct, except where caused by our own breach or negligence.`,
    },
    {
      id: 'suspension',
      heading: '17. Suspension and termination',
      body: `**17.1** You may close your account at any time in Settings. Open bookings, claims, and payment obligations continue until resolved.

**17.2** We may suspend, limit, or end your access if you breach these Terms, create risk or cost for others or for us, fail verification, are involved in fraud, or the law requires. We will tell you why where we reasonably can, and you may appeal by contacting [support@askalert.com].

**17.3** Sections that by their nature should continue (including payments owed, content licence, non-circumvention, disclaimers, liability, and governing law) survive termination.`,
    },
    {
      id: 'changes',
      heading: '18. Changes to the Services and these Terms',
      body: `We may change the Services and these Terms. For material changes we will give reasonable notice in the app or by message. Continuing to use the Services after the effective date means you accept the changes. If you do not agree, stop using the Services and close your account.`,
    },
    {
      id: 'governing-law',
      heading: '19. Governing law and disputes',
      body: `[LAWYER TO CONFIRM FORUM AND ARBITRATION PROVISIONS, AND CONSUMER CARVE-OUTS.]

**19.1** These Terms are governed by the laws of the **Federal Republic of Nigeria**.

**19.2** Please contact us first at [support@askalert.com]. We will try to resolve disputes in good faith within [30] days.

**19.3** If a dispute is not resolved, it will be referred to mediation and then [arbitration seated in Lagos under the Arbitration and Mediation Act 2023] or the courts of [Lagos State], as the lawyer advises. Nothing stops you from contacting a regulator or using rights you cannot waive.`,
    },
    {
      id: 'general',
      heading: '20. General',
      body: `- **Entire agreement:** these Terms, the Privacy Policy, the Vendor Terms, and the booking terms are the whole agreement between us on the Services.
- **Severability:** if a provision is unenforceable, the rest continues.
- **No waiver:** not enforcing a right is not giving it up.
- **Assignment:** we may transfer these Terms in a business transfer; you may not without our written consent.
- **Force majeure:** we are not liable for delays caused by events beyond our reasonable control, including network, power, or third-party platform outages.
- **Notices:** we may give notice in the app, by email, or by message to the contact details on your account.
- **Language:** these Terms are in English.
- **Contact:** AskAlert Technologies Limited, [ADDRESS], [support@askalert.com].`,
    },
    {
      id: 'annex-vendor',
      heading: 'Annex 1: Vendor Terms',
      body: `These Vendor Terms apply in addition to the Terms of Use to anyone who creates a vendor profile or receives requests through AskAlert (“Vendor,” “you”).

**V1. Eligibility and verification.** You must be 18 or older (or a registered business), able to provide the services you list, and complete verification. We may ask for identity documents, proof of business or property, licences, portfolio evidence, and bank details. We may refuse, limit, or remove vendor access at our discretion and will tell you why where we reasonably can. Verification tiers show which checks you passed; they are not endorsements.

**V2. Independent business.** You are an independent business. Nothing creates employment, partnership, agency, or franchise between you and AskAlert. You are responsible for your staff, equipment, insurance, tax, VAT, licences, permits, and compliance with the laws that apply to your services (including safety, consumer, and, where relevant, health and hospitality rules).

**V3. Accurate listings and quotes.** Your profile, rate cards, availability, photos, and quotes must be accurate and not misleading. A quote you submit is an offer you must honour for the validity period stated. Any change in price or scope after inspection must be disclosed and approved by the buyer before extra work starts.

**V4. Service standards.** You agree to respond promptly, attend bookings on time, perform services with reasonable skill and care, use safe and lawful methods, treat buyers respectfully, and keep buyers’ information private. You will not discriminate or harass.

**V5. Commission, fees, and payouts.**

- AskAlert charges a commission of [PERCENT]% on the value of each booking arranged through the Services, plus any applicable processing or partner fees, as shown to you before you accept a booking.
- Commission applies to a booking even if part of the price is later adjusted, and to repeat or follow-on work with a buyer introduced through AskAlert within [12] months (see V8).
- Payouts are made to your verified bank account according to the payment rules in section 6 of the Terms on each standard payment. Payout delays may occur for verification, fraud prevention, or open claims.
- We may deduct commission, fees, refunds, and amounts you owe from payouts [CONFIRM WITH LAWYER AND PARTNER].

**V6. Cancellations, no-shows, and refunds.** If you cancel or fail to attend without good reason, the buyer may be refunded and your reputation score and lead access may be reduced. You will honour the category’s cancellation rules shown in the app.

**V7. Lead alerts, messages, and limits.** Your plan includes an allowance of WhatsApp lead alerts and messages. We may batch alerts, send digests, or reduce alerts if you often do not respond. You can earn more allowance by completing bookings through AskAlert. You consent to receive operational messages from AskAlert and from the AskAlert agent, which is an AI assistant acting for buyers, and you accept that conversations through AskAlert are recorded, scanned for safety, and may be reviewed.

**V8. Non-circumvention.** For [12] months after AskAlert introduces you to a buyer, you will not solicit or accept payment from that buyer outside AskAlert for services that began as that introduction, and you will not ask the buyer to do so to avoid fees. If you do, you agree to pay AskAlert a fee equal to the commission that would have applied, and we may suspend your account, withhold benefits, and recover our reasonable costs. [LAWYER TO CONFIRM ENFORCEABILITY AND SCOPE.]

**V9. Buyer data.** You may use a buyer’s personal data only to provide the booked service and meet legal duties. You must not use it for marketing, share it, or keep it longer than needed, and you must protect it with reasonable security. You are responsible for your own compliance with the Nigeria Data Protection Act for data you receive.

**V10. Reviews and reputation.** Buyers may review you. You may reply once. We may use ratings, response rates, cancellations, claims, and other signals to rank and match you. You must not pay for, trade for, or manipulate reviews.

**V11. Claims.** You will cooperate with claims, provide evidence on time, and accept outcomes made under section 8 of the Terms, including refunds and reputation adjustments.

**V12. Safety and insurance.** You are responsible for the safety of your work and for any insurance needed for your services, including, where relevant, vehicle, property, public liability, and professional cover. For car hire, you confirm that vehicles are legally owned or authorised, roadworthy, insured, and driven by licensed, vetted drivers.

**V13. Indemnity.** You will compensate AskAlert for losses, claims, and costs arising from your services, your listings, your breach of these terms, or your violation of law.

**V14. Suspension and termination.** We may suspend or remove you for breach, fraud, safety concerns, repeated complaints, or inactivity. You may close your vendor profile at any time after completing open bookings and claims. Commission and obligations on past bookings continue.

**V15. No exclusivity.** You may serve customers elsewhere, subject to V8.`,
    },
    {
      id: 'annex-whatsapp',
      heading: 'Annex 2: WhatsApp opt-in wording and messaging policy',
      body: `**Opt-in text for sign-up screens, vendor onboarding, and the WhatsApp profile:**

> “I agree that AskAlert may send me service messages and alerts about my requests, quotes, bookings, and account on WhatsApp. I can reply STOP at any time to opt out. Message and data rates from my network may apply.”

**Rules to follow:**

- Record who opted in, when, how, and the exact wording shown.
- Use WhatsApp templates only for the purpose approved; do not include promotions in operational messages.
- Include a way to opt out in alerts and honour STOP at once.
- Do not message people who have not opted in.
- Keep the AskAlert agent on topic (requests, quotes, bookings, support) and offer human handoff.
- Describe AskAlert in the WhatsApp profile as a marketplace and booking service.
- Do not send sensitive data over WhatsApp.
- Check Meta’s current WhatsApp Business Terms, Commerce Policy, and AI-related policy before launch and when they change.`,
    },
    {
      id: 'annex-cookies',
      heading: 'Annex 3: Cookie and Notification Notice',
      body: `**What we use.**

- **Essential storage:** needed to sign in, keep your session secure, remember your mode (buyer or vendor), and make the app work. You cannot switch these off.
- **Analytics (optional where required):** simple, privacy-conscious measurement of how pages perform, for example which screens are slow. [LIST TOOLS AND WHETHER CONSENT IS REQUESTED.]
- **Push notifications:** only if you turn them on in Settings or your browser. Notification text is kept generic and never contains names, prices, phone numbers, or addresses.
- **Advertising cookies:** none [CONFIRM].

**Your choices.** Manage cookies in your browser. Turn off push notifications in Settings or your device. Withdraw consent for optional analytics in Settings, Privacy.`,
    },
  ],
};
