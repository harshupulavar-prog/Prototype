// Roles, data sources, team, models and rules for the command centre views.
// Everything here is illustrative. Data sources are example connectors:
// the real list is agreed with each lender during discovery, and nothing
// here claims an integration that already exists.

export const ROLES = [
  {
    id: 'officer',
    label: 'Collections Officer',
    short: 'Officer',
    long: 'Collections Officer: Assigned daily queue, borrower contact history, AI-drafted messages, and call outcomes',
    sees: 'Assigned daily queue, borrower contact history, AI-drafted messages, and call outcomes'
  },
  {
    id: 'manager',
    label: 'Collections Manager',
    short: 'Manager',
    long: 'Collections Manager: Team queue, real-time call monitoring, exception overrides, and bulk approvals',
    sees: 'Team queue, real-time call monitoring, exception overrides, and bulk approvals'
  },
  {
    id: 'head',
    label: 'Head of Collections',
    short: 'Head',
    long: 'Head of Collections: Portfolio recovery performance, cure rates, roll-forward trajectories, and SLA tracking',
    sees: 'Portfolio recovery performance, cure rates, roll-forward trajectories, and SLA tracking'
  },
  {
    id: 'audit',
    label: 'Internal Audit',
    short: 'Audit',
    long: 'Internal Audit: Complete immutable decision logs, model explanation records, and regulatory compliance evidence',
    sees: 'Complete immutable decision logs, model explanation records, and regulatory compliance evidence'
  },
  {
    id: 'admin',
    label: 'Admin',
    short: 'Admin',
    long: 'Admin: LOS/LMS data connectors, model monitoring & release, guardrails, and role-based permissions',
    sees: 'LOS/LMS data connectors, model monitoring & release, guardrails, and role-based permissions'
  }
];

export const NAV = {
  officer: [
    { id: 'today', label: 'My day', icon: 'sun' },
    { id: 'case', label: 'Case view', icon: 'case' }
  ],
  manager: [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'queue', label: 'Work queue', icon: 'queue' },
    { id: 'case', label: 'Case view', icon: 'case' },
    { id: 'calls', label: 'Live calls', icon: 'calls' },
    { id: 'team', label: 'Team', icon: 'users' },
    { id: 'audit', label: 'Audit trail', icon: 'audit' }
  ],
  head: [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'queue', label: 'Work queue', icon: 'queue' },
    { id: 'team', label: 'Team', icon: 'users' },
    { id: 'models', label: 'Models', icon: 'spark' },
    { id: 'audit', label: 'Audit trail', icon: 'audit' }
  ],
  audit: [
    { id: 'audit', label: 'Audit trail', icon: 'audit' },
    { id: 'rules', label: 'Rules & guardrails', icon: 'shield' },
    { id: 'models', label: 'Models', icon: 'spark' },
    { id: 'users', label: 'Users & roles', icon: 'users' }
  ],
  admin: [
    { id: 'data', label: 'Works with what you already run', icon: 'database' },
    { id: 'rules', label: 'Rules & guardrails', icon: 'shield' },
    { id: 'models', label: 'Models', icon: 'spark' },
    { id: 'users', label: 'Users & roles', icon: 'users' },
    { id: 'audit', label: 'Audit trail', icon: 'audit' }
  ]
};
// Aliases for compatibility
NAV.agent = NAV.officer;

export const ALL_SCREENS = [...new Set(Object.values(NAV).flat().map((n) => n.id))];

// Which role a screen belongs to when someone lands on it from a link.
export function roleFor(screen, current) {
  if (NAV[current] && NAV[current].some((n) => n.id === screen)) return current;
  return Object.keys(NAV).find((r) => NAV[r] && NAV[r].some((n) => n.id === screen)) || 'manager';
}

export function people(US) {
  const p = US
    ? {
        officer: { name: 'Dana Brooks', short: 'D. Brooks', initials: 'DB', title: 'Collections Officer' },
        manager: { name: 'Marcus Reed', short: 'M. Reed', initials: 'MR', title: 'Collections Manager' },
        head: { name: 'J. Ortiz', short: 'J. Ortiz', initials: 'JO', title: 'Head of Collections' },
        audit: { name: 'Alicia Gomez', short: 'A. Gomez', initials: 'AG', title: 'Internal Audit' },
        admin: { name: 'P. Shah', short: 'P. Shah', initials: 'PS', title: 'Platform Admin' }
      }
    : {
        officer: { name: 'Kavya Rao', short: 'K. Rao', initials: 'KR', title: 'Collections Officer' },
        manager: { name: 'A. Iyer', short: 'A. Iyer', initials: 'AI', title: 'Collections Manager' },
        head: { name: 'R. Menon', short: 'R. Menon', initials: 'RM', title: 'Head of Collections' },
        audit: { name: 'S. Bose', short: 'S. Bose', initials: 'SB', title: 'Internal Audit' },
        admin: { name: 'N. Desai', short: 'N. Desai', initials: 'ND', title: 'Platform Admin' }
      };
  p.agent = p.officer;
  return p;
}

// Example data sources. "kind" says whose system it is.
export function sources(US, hfc) {
  const list = US
    ? [
        { id: 'lms', name: 'Your LOS / LMS (e.g. FinnOne)', kind: 'Your system', feeds: 'Loans, payment schedule, days past due', how: 'Read-only API', every: 'Every 15 min', records: '18,620 loans' },
        { id: 'bank', name: 'Bank account data', kind: 'With borrower consent', feeds: 'Paycheck deposits, balance trend', how: 'Consented API', every: 'Daily', records: '6,140 linked accounts' },
        { id: 'bureau', name: 'Credit bureau', kind: 'Third party', feeds: 'New credit, inquiries, other delinquencies', how: 'Batch file', every: 'Weekly', records: '18,620 refreshed' },
        { id: 'pay', name: 'ACH, card and debit payments', kind: 'Your processors', feeds: 'Payments, returns, failed debits', how: 'Event stream', every: 'Real time', records: '2,310 events today' },
        { id: 'crm', name: 'Your collections platform', kind: 'Your system', feeds: 'Contact history, promises, agent notes', how: 'API, read and write back', every: 'Every 5 min', records: '9,880 contacts' },
        { id: 'comms', name: 'Text, email and voice providers', kind: 'Your vendors', feeds: 'Delivery, replies, STOP opt-outs', how: 'Webhooks', every: 'Real time', records: '4,120 messages' },
        { id: 'consent', name: 'Consent and opt-out records', kind: 'Your system', feeds: 'Contact permissions, time zones, opt-outs', how: 'Read-only API', every: 'Every 15 min', records: '18,620 profiles' }
      ]
    : [
        { id: 'lms', name: 'Your LOS / LMS (e.g. FinnOne)', kind: 'Your system', feeds: 'Loans, EMI schedule, days past due', how: 'Read-only API', every: 'Every 15 min', records: '42,300 loans' },
        { id: 'bank', name: 'Account Aggregator', kind: 'With borrower consent', feeds: 'Salary credits, balance trend', how: 'Consented API', every: 'Daily', records: '11,900 linked accounts' },
        { id: 'bureau', name: 'Credit bureau', kind: 'Third party', feeds: 'New loans, enquiries, other overdues', how: 'Batch file', every: 'Weekly', records: '42,300 refreshed' },
        { id: 'pay', name: 'UPI, NACH and payment gateway', kind: 'Your processors', feeds: 'Payments, mandate bounces', how: 'Event stream', every: 'Real time', records: '5,860 events today' },
        { id: 'crm', name: 'Your collections platform', kind: 'Your system', feeds: 'Contact history, promises, agent notes', how: 'API, read and write back', every: 'Every 5 min', records: '21,400 contacts' },
        { id: 'comms', name: 'WhatsApp, SMS and voice providers', kind: 'Your vendors', feeds: 'Delivery, replies, opt-outs', how: 'Webhooks', every: 'Real time', records: '9,350 messages' },
        { id: 'consent', name: 'Consent and DND records', kind: 'Your system', feeds: 'Contact permissions, language, do-not-disturb', how: 'Read-only API', every: 'Every 15 min', records: '42,300 profiles' }
      ];
  if (hfc) {
    // Housing finance: EMIs run on eNACH, and the property matters on every case.
    const lms = list.find((s) => s.id === 'lms');
    lms.feeds = 'Home loan and LAP accounts, EMI schedule, days past due';
    lms.records = '1,26,000 loans';
    const pay = list.find((s) => s.id === 'pay');
    pay.name = 'eNACH mandates, UPI and payment gateway';
    pay.feeds = 'EMI debits, eNACH bounces, retries, UPI payments';
    list.splice(3, 0, { id: 'property', name: 'Property and collateral records', kind: 'Your system', feeds: 'Property type, location, valuation, loan-to-value, construction stage', how: 'Read-only API', every: 'Daily', records: '1,26,000 properties' });
  }
  // Minutes since last sync, so the screen can tick.
  const ago = { lms: 4, bank: 380, bureau: 2880, pay: 0, crm: 2, comms: 0, consent: 9, property: 610 };
  return list.map((s) => ({ ...s, ago: ago[s.id] }));
}

export const SHORT = { lms: 'Your LOS / LMS (e.g. FinnOne)', bank: 'Bank data', bureau: 'Bureau', pay: 'Payments', crm: 'Collections platform', comms: 'Channels', consent: 'Consent records', nexus: 'Nexus models', property: 'Property records' };

// What Nexus does with the data, in the middle of the diagram.
export const ENGINE = [
  { id: 'features', label: 'Borrower signals', sub: 'joins every source per account' },
  { id: 'ews', label: 'Early-warning model', sub: 'ews-v3.2' },
  { id: 'nba', label: 'Next-best action', sub: 'nba-v1.6' },
  { id: 'msg', label: 'Message drafting', sub: 'msg-v1.4, 8 languages' },
  { id: 'voice', label: 'Voice agents', sub: 'voice-v2.1' },
  { id: 'guard', label: 'Guardrails', sub: 'hours, consent, limits' }
];

export function outputs(US) {
  return [
    { id: 'queue', label: 'Work queue for approval', sub: 'nothing goes out unapproved' },
    { id: 'channels', label: US ? 'Text, email and AI voice' : 'WhatsApp, SMS and AI voice', sub: 'after approval only' },
    { id: 'writeback', label: 'Back to your collections platform', sub: 'outcomes and promises' },
    { id: 'credit', label: 'Credit team review', sub: 'weekly early-warning patterns' }
  ];
}

export function team(US) {
  const names = US
    ? ['Dana Brooks', 'Marcus Reed', 'Alicia Gomez', 'Tom Walsh', 'Priya Patel', 'Kevin O’Neil']
    : ['Kavya Rao', 'Arjun Pillai', 'Sneha Kulkarni', 'Imran Shaikh', 'Pooja Bhatt', 'Rohit Verma'];
  const rows = [
    [18, 22, 9, 82, 3, 'On a call'],
    [21, 26, 11, 78, 2, 'Available'],
    [16, 19, 7, 85, 4, 'On a call'],
    [24, 29, 12, 71, 1, 'Wrap-up'],
    [14, 17, 6, 88, 5, 'Available'],
    [19, 23, 8, 76, 2, 'On a break']
  ];
  return names.map((n, i) => {
    const [cases, calls, ptp, kept, hardship, status] = rows[i];
    return { name: n, cases, calls, ptp, kept, hardship, status };
  });
}

export const MODELS = [
  { id: 'ews', name: 'Early-warning model', version: 'ews-v3.2', outcome: 'Fewer roll-forwards', job: 'Outcome: fewer roll-forwards. Flags distress 30 to 60 days before missed EMI to prevent stage migration.', inputs: ['lms', 'bank', 'bureau', 'pay'], retrained: '2 Oct', next: '2 Nov', candidate: 'ews-v3.3' },
  { id: 'nba', name: 'Next-best action', version: 'nba-v1.6', outcome: 'Fewer field visits', job: 'Outcome: fewer field visits. Solves routine delinquency digitally through personalized channel and timing before dispatching field staff.', inputs: ['lms', 'crm', 'consent', 'comms'], retrained: '25 Sep', next: '25 Oct' },
  { id: 'msg', name: 'Message drafting', version: 'msg-v1.4', outcome: 'Higher cure rate', job: 'Outcome: higher cure rate. Crafts empathetic, multi-lingual payment arrangements with one-tap UPI links to maximize kept promises.', inputs: ['lms', 'consent'], retrained: '18 Sep', next: 'On template change' },
  { id: 'voice', name: 'Voice agent', version: 'voice-v2.1', outcome: 'Higher cure rate', job: 'Outcome: higher cure rate. Handles routine reminder calls in native language, captures instant commitments, and escalates disputes.', inputs: ['lms', 'pay', 'consent'], retrained: '30 Sep', next: '30 Oct' }
];

export function users(US, P) {
  return [
    {
      name: (P.officer || P.agent).name,
      role: 'Collections Officer',
      team: US ? 'Early stage' : 'SMA-0 and SMA-1',
      perms: ['view', 'cases'],
      sees: 'Assigned daily queue, borrower contact history, AI-drafted messages, and call outcomes'
    },
    {
      name: (P.manager || { name: US ? 'M. Chen' : 'A. Iyer' }).name,
      role: 'Collections Manager',
      team: US ? 'Mid & Late stage' : 'SMA-1 and SMA-2',
      perms: ['view', 'cases', 'approve', 'bulk'],
      sees: 'Team queue, real-time call monitoring, exception overrides, and bulk approvals'
    },
    {
      name: (P.head || P.manager).name,
      role: 'Head of Collections',
      team: 'Executive',
      perms: ['view', 'cases', 'approve', 'bulk', 'reports'],
      sees: 'Portfolio recovery performance, cure rates, roll-forward trajectories, and SLA tracking'
    },
    {
      name: (P.audit || { name: US ? 'R. Kim' : 'S. Bose' }).name,
      role: 'Internal Audit',
      team: 'Compliance & Audit',
      perms: ['view', 'reports', 'rules', 'models'],
      sees: 'Complete immutable decision logs, model explanation records, and regulatory compliance evidence'
    },
    {
      name: P.admin.name,
      role: 'Admin',
      team: 'Platform & IT',
      perms: ['view', 'rules', 'models', 'data', 'users'],
      sees: 'LOS/LMS data connectors, model monitoring & release, guardrails, and role-based permissions'
    }
  ];
}

export const PERMS = [
  ['view', 'See the book'],
  ['cases', 'Work cases'],
  ['approve', 'Approve actions'],
  ['bulk', 'Bulk approve'],
  ['reports', 'Reports'],
  ['rules', 'Change rules'],
  ['models', 'Promote models'],
  ['data', 'Data sources'],
  ['users', 'Manage users']
];
