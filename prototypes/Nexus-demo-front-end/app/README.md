# Nexus collections demo

A clickable collections command centre that Kaara sales can send to
prospects. Five screens: Overview, Work queue, Case view, Live calls and
Audit trail. All data is illustrative.

## Run it on your laptop

You need Node.js installed once (free, from nodejs.org, pick "LTS").
It is already on this laptop.

**Easiest:** open the `app` folder and double-click `start-demo.bat`.
A black window opens and your browser shows the demo a few seconds later.
Keep the black window open while you use the demo. Close it to stop.

**Or, from a terminal** in the `app` folder:

1. `npm install` (only the first time; it downloads what the demo needs)
2. `npm run dev` (starts the demo and opens it at http://localhost:5173)

## Make a personalised link for a prospect

Add settings to the end of the address:

| Setting  | What it does                  | Example                         |
|----------|-------------------------------|---------------------------------|
| prospect | Their company name            | `prospect=Acme%20Finance`       |
| market   | `India` or `US`               | `market=US`                     |
| accent   | Their brand colour (hex code) | `accent=1F4FD8`                 |
| logo     | Link to their logo image      | `logo=https://.../logo.png`     |
| contact  | Your email for "Talk to Kaara" | `contact=you@kaaratech.com`    |
| tour     | `1` opens the guided tour first | `tour=1`                      |

Example:
`http://localhost:5173/?prospect=Acme%20Finance&market=US&accent=1F4FD8`

You do not have to type these by hand. Open the address with `?builder`
at the end (for example `http://localhost:5173/?builder`), fill in the
form and click **Copy link**. Prospects never see the builder.

Anything left out falls back to a safe default: "Your Company", India,
Kaara red, no logo, no contact button.

## The guided tour

For prospects exploring on their own. It moves through all five screens,
spotlights one AI feature at a time, explains it in plain words and keeps a
running total of team time freed up. At the end they see a summary, can
star the features that matter to them, and (if you set `contact`) email
that shortlist straight to you.

- Links made with the builder open with the tour by default (`tour=1`).
- Without `tour=1`, a small "Take the 2-minute tour" card appears in the
  corner after a couple of seconds. It never blocks the screen.
- The red **Guided tour** button at the top starts it any time.
- Arrow keys move through it; Esc leaves.

Time saved is an **illustrative estimate**, worked out from the demo's own
numbers and fixed minutes per task (2 min to screen an account, 3 to draft
an action, 5 per call, 1 to log a decision). The assumptions are shown on
the summary screen. To change them, edit `MINUTES` at the top of
`src/components/tourSteps.js`. The tour wording is in the same file.

## Custom builds for a named prospect

ICICI Home Finance has its own build:
`http://localhost:5173/?profile=icici-hfc`

It uses their name and a colour close to ICICI maroon, a home loan and LAP
book, eNACH repayments, property details on every case, a SARFAESI legal
track and Gujarati. The public facts it is based on, with links, are in the
"How Kaara builds this" panel. Every figure on the screens is still
illustrative. Edit `src/profiles/iciciHfc.js` to change it.

## Role-based views and data sources

"View as" at the top of the left menu switches between 5 tailored roles:

- **Collections Officer**: Assigned daily queue, borrower contact history, AI-drafted messages, and call outcomes.
- **Collections Manager**: Team queue, real-time call monitoring, exception overrides, and bulk approvals.
- **Head of Collections**: Portfolio recovery performance, cure rates, roll-forward trajectories, and SLA tracking.
- **Internal Audit**: Complete immutable decision logs, model explanation records, and regulatory compliance evidence.
- **Admin**: LOS/LMS data connectors, model monitoring & release, guardrails, and role-based permissions.

For technical teams, the **Data sources** button at the top tags every
number on every screen with the system it comes from. The Data &
integrations screen shows the full picture: each source, how it connects,
how fresh it is, a masked sample record and where results go. The sources
are examples; the real list is agreed with each lender. Their wording is in
`src/framework.js`.

## Light and dark mode

The demo opens in light mode. The sun/moon button at the top switches it,
and the choice is remembered on that device.

## Presenting tips

- Keys **1 to 5** jump between the five screens.
- The demo clock starts at 9:12 am and everything ticks live from there.
- Approving or changing a case shows up instantly in the Audit trail with
  your name against it. Reload the page to reset the demo.
- "How Kaara builds this" (bottom left) opens the positioning panel.

## Put it online

`npm run build` creates a `dist` folder. That folder is the whole website.
Upload it to any static host (Netlify, Vercel, AWS S3, Azure Static Web
Apps). Prerna's team can do this in a few minutes.

## Before it goes to real prospects

- **Translations** (Tamil, Hindi, Marathi, Bengali, Telugu, Kannada,
  Spanish) have not been checked by native speakers yet.
- **US** text messages and call scripts need a US collections compliance
  review.
- The overall look and the copy need Shri's sign-off.

## For developers

React 18 + Vite, no other libraries. Settings parsing is in
`src/settings.js`, all demo data in `src/data.js`, one file per screen in
`src/screens/`, styles in `src/styles.css`.
