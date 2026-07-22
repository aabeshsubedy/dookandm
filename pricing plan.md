Pricing Plan
Omnichannel Inbox, Order Capture & Lightweight CRM for Nepali Social Commerce Sellers

Companion document to the MVP Development Plan. Covers proposed pricing tiers, the market research behind them, and launch tactics tied to the Validation Plan.

Market Research Basis

Saney (direct Nepal competitor) structures its three paid tiers around an identical feature checklist — tiers differ only by usage limits and transaction fees:

Grow — NPR 2,499/mo: 300 product listings, 3,000 AI conversation credits, 200 orders/mo, 3 social integrations, 3.5% service charge + 2% third-party payment fee + 1.5% platform fee
Scale — NPR 3,499/mo: 800 listings, 7,500 AI credits, 500 orders/mo, all integrations, 3% service charge
Elevate — NPR 5,499/mo: 2,300 listings, 19,500 AI credits, 1,700 orders/mo, 2.75% service charge
Free tier: 25 product listings, no card required
Annual billing: 2 months free

Regional benchmark (India — Interakt, WhatsApp/Instagram CRM): entry pricing starts around INR 2,499–2,799/month, with Meta conversation fees charged separately on top. Cheapest global tier is closer to $12/month for a shared inbox with unlimited team members.

Takeaway: ~NPR 2,500/month is the established anchor price for entry-level social commerce tooling in this market. This MVP has a real cost advantage over that anchor — no storefront hosting, no AI inference costs, no payment gateway to maintain — which is why pricing should land meaningfully below it, not just marginally under it.

Pricing Principles
No payment gateway in MVP = no transaction-fee revenue lever. Unlike Saney's 2.75–3.5% service charge, this has to be a clean flat subscription.
Keep the feature set constant across paid tiers, differentiate by limits. Mirrors Saney's own model and is far simpler to build/maintain solo.
Undercut the NPR 2,499 anchor clearly. A price like NPR 2,200 doesn't register as different; NPR 800–900 does.
Zero service/transaction fees is itself a sellable differentiator against Saney's cut on processed payments.
Proposed Plans
	Free	Starter	Growth	Business
Price	NPR 0	NPR 899/mo (NPR 8,990/yr)	NPR 1,799/mo (NPR 17,990/yr)	Custom
vs. Saney entry (2,499)	—	64% cheaper	28% cheaper	—
Channels	1 (FB or IG)	FB + IG together	Up to 3 pages/accounts	Unlimited
Orders/month	40	300	1,500	Custom
Customer profiles	25	500	Unlimited	Unlimited
Unified inbox	✔	✔	✔	✔
Order pipeline	Basic	Full (kanban + filters)	Full	Full
CRM notes/tags/reminders	—	✔ Unlimited	✔ Unlimited	✔ Unlimited
COD risk flagging	—	✔ Full (badge + return %)	✔ Full	✔ Full
Business dashboard	—	✔	✔	✔
CSV export	—	✔	✔	✔
Team logins	1	1	Up to 3	Unlimited
Support	Community, 48–72h	Email, 24–48h	Priority, same-day	Dedicated
Transaction/service fees	None	None	None	None
Rationale per tier
Free is deliberately thin — one channel, no COD risk badge, no dashboard — so it's usable during the Meta 25-account test window and pilot recruitment, while the core differentiators (COD risk, CRM, dashboard) stay behind the paywall to actually measure willingness to pay.
Starter is the plan that matters most: first tier where FB+IG are unified together (the core value prop), priced for a true solo seller. 300 orders/month comfortably covers the "15–20 active custom orders" pain point described in Feature 2.
Growth targets sellers who've outgrown solo — multiple pages/sub-brands, a hired helper answering DMs (hence 3 logins), higher order volume.
Business stays "contact us" — no need to build custom-limit UI for what's likely 1–2 sellers in year one.
Annual billing mirrors Saney's "2 months free" convention since that's already the local market's mental model.
Launch Tactics Tied to the Validation Plan

Founding Seller rate: 50% off Starter for the first 3 months for the 5–10 pilot sellers, in exchange for structured willingness-to-pay feedback. Converts the validation cohort into the first paying cohort without discounting the public price.

A/B the Starter price during the pilot: Split pilot sellers across NPR 799 vs. NPR 999 when asking the willingness-to-pay question, rather than guessing at one number — gives a real data point before locking in a public price.

This document should be read alongside the MVP Development Plan. Pricing here assumes the MVP scope as defined there (no storefront, no WhatsApp/TikTok, no AI auto-reply, no payment gateway) — revisit tier structure once any of those fast-follow items ship, since they open up new monetization levers (e.g. transaction fees once payment gateway integration lands).