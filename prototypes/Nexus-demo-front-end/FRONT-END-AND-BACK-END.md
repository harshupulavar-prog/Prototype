# Nexus demo: front end and back end



## The short version

- **Front end:** complete, and in the `app` folder of this package.
- **Back end:** there isn't one. The demo has no server, no database, no AI
  models and no connections to outside systems.

Everything a viewer sees runs in their browser, from data written into the
code. The demo shows what Kaara would build. It is not the working system.

## What each "live" thing really is

| What the demo appears to do | What actually happens |
|---|---|
| Borrowers, amounts, charts | Fixed illustrative data in `src/data.js` and `src/profiles/iciciHfc.js` |
| "Collected today" and other counters going up | A timer in the browser adds to a starting number |
| Live activity feed | A timer cycles through a fixed list of names |
| Risk scores and "why flagged" | Fixed numbers. The bars are worked out from the score by a simple formula. No model runs. |
| Drafted messages in local languages | Fixed templates with the name and amount filled in. No AI writes them. |
| Live AI calls | Scripted lines revealed on a timer. No calls, no audio. |
| Approve, change plan, log an outcome | Updates the page's memory only. Nothing is sent to anyone. |
| Audit trail | A fixed list, plus actions from the current visit. Lost on reload. |
| Rules, model promotion | Changes the page and adds an audit line. Nothing else happens. |
| Data sources, sync times, sample records | Example text. Nothing is connected. |
| Users and sign-in | No sign-in. "View as" is an open switch. |

Only two things are remembered between visits, both in the viewer's browser:
the light or dark choice, and whether they dismissed the tour invitation.

## What a real back end would need

These are the pieces the screens imply. Kaara's tech team should confirm the
design and the 8 to 10 week estimate against them.

1. **Data connectors** to the lender's loan system, payments, bureau,
   collections platform, messaging providers and consent records. Every
   connector on the data screen is an example until agreed with the lender.
2. **A database** for accounts, signals, proposed actions and approvals.
3. **Models:** early warning, next-best action, message drafting.
4. **Voice agents**, with telephony and payment during the call.
5. **Messaging** through WhatsApp, SMS, text and email providers.
6. **Approval workflow:** nothing goes out until a person approves it, and
   hardship and disputes go to a person. In the demo this is only screen
   behaviour. In a real system the server must enforce it.
7. **Guardrails** enforced by the server: contact hours, consent, contact
   limits, opt-outs.
8. **Tamper-proof audit log**, stored permanently.
9. **Sign-in and permissions**, using the lender's company login.
10. **Hosting** inside the lender's own cloud account.

## Using the front end

You need Node.js. In the `app` folder:

    npm install
    npm run dev

To make the website files for hosting, run `npm run build`. The result lands
in `dist`. The `built-website` folder in this package is a ready-made copy of
that output.

See `app/README.md` for link settings and the guided tour.

## Before sharing this package

- It includes the ICICI Home Finance custom build
  (`src/profiles/iciciHfc.js`). Remove that file and its references before
  giving the code to any other prospect.
- All demo data is illustrative. Translations and US scripts have not yet
  been reviewed.
