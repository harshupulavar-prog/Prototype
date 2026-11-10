// Guided tour content. Time saved is an illustrative estimate worked out
// from this demo's own numbers and the minutes per task below. It is not a
// client result. Change the minutes here if Kaara agrees different ones.
export const MINUTES = {
  screen: 2, // reviewing one account for early-warning signs by hand
  draft: 3, // choosing the action, channel, language and writing the message
  call: 5, // one collections call plus notes
  log: 1 // writing one decision into the audit record
};

export function buildSteps({ D, fmt, settings, live }) {
  const { num } = fmt;
  const { US, prospect } = settings;
  const caseIdx = 0; // Karthik (Tamil, WhatsApp) in India; María (Spanish, text) in the US
  const r = D.rows[caseIdx];
  const hrs = (count, mins) => Math.round((count * mins) / 60);

  return [
    {
      id: 'welcome',
      kind: 'intro',
      title: 'Welcome to the ' + prospect + ' collections command centre',
      body: (settings.profile ? 'Built around your home loan and LAP book, from public information. ' : '') + 'A two-minute tour of what Kaara Technologies would build for your team: the AI at work, where people stay in control, and how much team time it frees up. Everything you see uses illustrative data.'
    },
    {
      id: 'early-warning',
      screen: 'overview',
      target: 'hero',
      tag: 'Early-warning model',
      title: 'It worked while your team slept',
      body: 'Every night Nexus reads bank, bureau and payment signals and flags borrowers who are likely to miss, before they miss. This morning it flagged ' + num(D.flagged) + ' accounts and sent ' + num(D.hardship) + ' sensitive cases straight to your team.',
      saved: { hours: hrs(D.flagged, MINUTES.screen), what: 'screening ' + num(D.flagged) + ' accounts by hand, ' + MINUTES.screen + ' min each' }
    },
    {
      id: 'book',
      screen: 'overview',
      target: 'kpis',
      tag: 'Live book view',
      title: 'Your whole book, live',
      body: 'Due, at risk, collected and cure rate update as payments land. No waiting for the end-of-day report to know where you stand.'
    },
    {
      id: 'next-action',
      screen: 'queue',
      target: 'queue-head',
      tag: 'Next-best action',
      title: num(D.prepared) + ' actions, drafted and ready',
      body: 'For every account Nexus picks the action, the channel, the language and the time to contact. Your team approves all of them in one click, or row by row.',
      saved: { hours: hrs(D.prepared, MINUTES.draft), what: 'deciding and drafting ' + num(D.prepared) + ' actions, ' + MINUTES.draft + ' min each' }
    },
    {
      id: 'human',
      screen: 'queue',
      target: 'queue-human',
      tag: 'Hardship and dispute detection',
      title: 'Hard cases go to people, not bots',
      body: 'Nexus spots hardship and disputes and locks them as “With your team”. It never contacts those borrowers automatically. Everything else waits for a person to approve it. Try it: approve any other row.'
    },
    {
      id: 'explain',
      screen: 'case',
      caseIdx,
      target: 'case-why',
      tag: 'Explainable risk score',
      title: 'Every flag explains itself',
      body: r.name + ' is at ' + r.risk + '% risk of missing. Nexus shows exactly why, so your team can trust it and an auditor can follow it. The model is trained only on your data, inside your environment.'
    },
    {
      id: 'language',
      screen: 'case',
      caseIdx,
      target: 'case-message',
      tag: 'Multilingual drafting',
      title: 'Written in the borrower’s language',
      body: 'This reminder is drafted in ' + r.lang + ' for ' + r.channel + ', the channel ' + r.name.split(' ')[0] + ' prefers. Switch to English to see what your reviewer sees. Nothing is sent until a person approves it.'
    },
    {
      id: 'credit',
      screen: 'case',
      caseIdx,
      target: 'case-credit',
      tag: 'Collections to credit',
      title: 'What collections learns, credit uses',
      body: 'Patterns found in collections feed your credit team’s early-warning review, so the next loan is a better one. Kaara builds across the lending lifecycle, not only collections.'
    },
    {
      id: 'voice',
      screen: 'calls',
      target: 'calls-grid',
      tag: 'AI voice agents',
      title: live + ' calls happening right now',
      body: 'AI voice agents call in the borrower’s language, take payment during the call and hand disputes to a person. Every call opens by saying it is an automated assistant' + (US ? ' and confirms identity before any account details.' : '.'),
      saved: { hours: hrs(D.callsDone, MINUTES.call), what: num(D.callsDone) + ' calls so far today, ' + MINUTES.call + ' min each with notes' }
    },
    {
      id: 'audit',
      screen: 'audit',
      target: 'audit-table',
      tag: 'Automatic audit trail',
      title: 'Every decision, with a name against it',
      body: 'Who approved what, which model version and which checks passed, logged automatically. Anything you approved on this tour is already at the top.',
      saved: { hours: hrs(D.prepared + D.hardship, MINUTES.log), what: 'recording ' + num(D.prepared + D.hardship) + ' decisions, ' + MINUTES.log + ' min each' }
    },
    {
      id: 'roles',
      target: 'roles',
      tag: 'Role-based access',
      title: 'One system, tailored for 5 roles',
      body: 'Collections Officers see daily queues and call notes. Managers track team queues and live calls. Head of Collections monitors portfolio recovery and SLAs. Internal Audit verifies immutable logs. Admins manage connectors and models.'
    },
    {
      id: 'data',
      screen: 'data',
      target: 'data-flow',
      lens: true,
      tag: 'Works with what you already run',
      title: 'Works with what you already run',
      body: 'For your technology team: every system Nexus reads, how it connects, how fresh it is and where results go. Switch on “Data sources” at the top of any screen to tag each number with its source.'
    },
    { id: 'finish', kind: 'finish' }
  ];
}
