// ICICI Home Finance profile. Open with ?profile=icici-hfc
//
// Two kinds of content live here, and they must never be mixed:
// 1. PUBLIC FACTS about ICICI Home Finance, each with its source. Shown only
//    in the "Built around ICICI Home Finance" panel, with citations.
// 2. ILLUSTRATIVE operating data (borrowers, amounts, rates) shaped to look
//    like a home loan and LAP book. None of it is ICICI Home Finance data.
//
// Check public facts again before sending: figures change every quarter.

export const ICICI_HFC = {
  id: 'icici-hfc',
  prospect: 'ICICI Home Finance',
  // Close to the ICICI maroon. Approximated, not taken from a brand guide.
  accent: '#A3262C',
  market: 'India',

  facts: [
    { k: 'Who you are', v: 'Wholly owned subsidiary of ICICI Bank, set up in 1999, registered with the National Housing Bank.', src: 'crisil' },
    { k: 'Book size', v: 'AUM of about ₹38,900 crore at 31 March 2025, up about 30% in a year.', src: 'icra' },
    { k: 'Product mix', v: 'Home loans 63%, loan against property 33%, developer finance 4% of AUM (December 2024).', src: 'crisil' },
    { k: 'Borrowers', v: 'Around 60% of retail customers are self-employed.', src: 'care' },
    { k: 'Reach', v: '225 branches at 31 December 2024.', src: 'crisil' },
    { k: 'Repayment and service', v: 'EMIs by eNACH auto-debit; WhatsApp and a toll-free line for customer service.', src: 'site' },
    { k: 'Products', v: 'Home loans for salaried and self-employed, PMAY-U 2.0, plot and construction, renovation, balance transfer and top-up, LAP, lease rental discounting.', src: 'site' }
  ],
  sources: {
    crisil: { name: 'CRISIL Ratings rationale, 21 March 2025', url: 'https://www.crisil.com/mnt/winshare/Ratings/RatingList/RatingDocs/ICICIHomeFinanceCompanyLimited_March%2021_%202025_RR_365004.html' },
    icra: { name: 'ICRA rating rationale, May 2025', url: 'https://www.icra.in/Rating/GetRationalReportFilePdf?id=135218' },
    care: { name: 'CARE Ratings press release, July 2025', url: 'https://www.careratings.com/upload/CompanyFiles/PR/202507140751_ICICI_Home_Finance_Company_Limited.pdf' },
    site: { name: 'icicihfc.com', url: 'https://www.icicihfc.com/' }
  },
  // How each public fact shaped this build.
  shaped: [
    'Every borrower is a home loan, LAP, PMAY, plot, renovation or top-up customer, with EMIs and tickets to match.',
    'Self-employed borrowers get signals from business inflows and bureau changes, and plans that follow their cash cycle.',
    'eNACH bounces are the first warning sign, and Nexus prepares the retry before the next presentation date.',
    'The property sits on every case: type, location and loan-to-value, because secured recovery is a different conversation.',
    'NPA cases move to your legal team for SARFAESI. Nexus never contacts them.',
    'Messages and calls cover Gujarati and Marathi as well as Hindi, Tamil, Telugu, Kannada and English.'
  ]
};

const MSG = {
  gu: 'નમસ્તે {n}, તમારા {a} ના EMI ની ચુકવણી બાકી છે. એક ટૅપમાં ચૂકવો: [UPI લિંક]. વધુ સમય જોઈએ છે? HELP લખીને જવાબ આપો.'
};

// Illustrative book, sized like a large housing finance company.
export function iciciHfcData(prospect) {
  return {
    rows: [
      {
        id: 'CASE-3008',
        hero: true,
        name: 'Rajesh Patel',
        city: 'Surat',
        product: 'Home loan, self-employed',
        bucket: 'SMA-0',
        dpd: '2 DPD',
        overdue: 56800,
        emi: 28400,
        outstanding: 3420000,
        risk: 54,
        priorityScore: 54,
        flaggedAt: '09:12',
        decisionAt: '09:28',
        escalationAt: '09:45',
        segment: 'Thin file',
        bureauScore: 'No / limited bureau history',
        creditScore: 'No / limited bureau history',
        intent: 'Salary credit missed',
        tone: 'warn',
        action: 'Escalate to manager review',
        secondaryAction: 'Soft-touch AI call with split EMI on manager sign-off',
        channel: 'AI voice',
        lang: 'Gujarati',
        code: 'gu',
        property: 'Flat, Adajan',
        ltv: 58,
        factors: [
          ['Late EMIs two cycles running', 20],
          ['Salary / business credit missing for 45 days', 16],
          ['Account balance down 35%', 11],
          ['Partial payments in last 60 days', 7]
        ],
        story: 'Early warning (54% in amber): SMA-0 (2 DPD) early warning watch, not a critical default. Thin-file borrower with seasonal cash-flow lag. Next-Best-Action simulation predicts 94% cure with a soft-touch restructuring call, while policy routes high-exposure early accounts for supervisor sign-off.',
        creditStory: 'This pattern (thin-file borrower with no bureau history, missing business inflows, home loan, Surat) triggered early delinquency rules. Collections intelligence advises alternative Account Aggregator cash-flow underwriting for thin-file applicants.',
        memoryExamples: [
          {
            id: 'HL-SUR-2041',
            title: 'Surat · Adajan',
            product: 'Home loan, self-employed',
            match: 96,
            matchReason: 'Late EMIs two cycles running with seasonal textile trading cash-flow lag',
            action: 'Staged split repayment plan with debit aligned to 12th of month',
            outcome: 'Cured in 45 days · 0 DPD restored (₹56,800 recovered)',
            creditLearning: 'Prompted underwriting to accept 12-month AA bank statements for Surat textile firms',
            statusTone: 'good'
          },
          {
            id: 'HL-SUR-1893',
            title: 'Surat · Vesu',
            product: 'Home loan, self-employed',
            match: 93,
            matchReason: 'Mandate bounce preceded by 35% account balance drop & missing business credit',
            action: 'Proactive soft-touch restructuring call before 60 DPD SARFAESI escalation',
            outcome: 'Kept in SMA-0 · 94% cure rate across Surat cluster',
            creditLearning: 'Surat cluster risk weight normalized after verification of export invoice cycle',
            statusTone: 'good'
          }
        ],
        policyReason: {
          title: 'High exposure requires manager review',
          statedReason: 'High exposure always needs manager review',
          detail: 'Stated reason on screen: SMA-0 (2 DPD) early-warning watch with overdue ₹56,800. While NBA predicts 94% cure with soft-touch restructuring, housing finance policy mandates supervisor review before contact.',
          cureComparison: {
            softTouch: 94,
            standardNotice: 40,
            escalate: 'Mandated by Policy'
          }
        }
      },
      {
        id: 'CASE-3002',
        hero: true,
        name: 'Sunita Deshmukh',
        city: 'Pune',
        product: 'Home loan, salaried',
        bucket: 'SMA-0',
        dpd: '4 days',
        overdue: 34200,
        emi: 34200,
        outstanding: 3860000,
        risk: 14,
        segment: 'Prime salaried',
        bureauScore: '790 (CIBIL)',
        creditScore: '790',
        intent: 'eNACH presentation pending',
        tone: 'ok',
        action: 'WhatsApp reminder with UPI link',
        channel: 'WhatsApp',
        lang: 'Marathi',
        code: 'mr',
        property: 'Flat, Wakad',
        ltv: 66,
        factors: [
          ['Average bank balance 4.8x EMI', 6],
          ['Salary credited on schedule', 5],
          ['Zero bounce history in past 24 months', 3]
        ],
        story: 'Low risk (14% in green): Healthy liquidity buffers and salaried stability. Nexus sends a courteous WhatsApp reminder with one-tap payment link.',
        creditStory: 'Salaried home loan with strong balance buffer. Low risk profile qualifies for automated reminder.',
        memoryExamples: [
          {
            id: 'HL-PUN-3108',
            title: 'Pune · Wakad',
            product: 'Home loan, salaried',
            match: 97,
            matchReason: 'Prime salaried profile with 4.8x EMI liquidity; 4-day technical delay',
            action: 'Marathi WhatsApp courtesy nudge with 1-tap UPI payment link',
            outcome: 'Paid in 12 hours · 100% cure rate',
            creditLearning: 'Confirms high cure resilience for Pune Hinjawadi IT corridor salaried borrowers',
            statusTone: 'good'
          },
          {
            id: 'HL-PUN-2945',
            title: 'Pune · Baner',
            product: 'Home loan, salaried',
            match: 94,
            matchReason: 'Routine travel oversight; pristine bureau history (790 CIBIL)',
            action: 'Digital SMS reminder with automated payment confirmation',
            outcome: 'Cleared same day · Account remained Current',
            creditLearning: 'Eliminated manual collection call overhead for low-risk salaried accounts',
            statusTone: 'good'
          }
        ]
      },
      {
        id: 'CASE-3005',
        hero: true,
        name: 'Anil Yadav',
        city: 'Lucknow',
        product: 'PMAY home loan',
        bucket: 'Pre-due',
        dpd: 'due in 5 days',
        overdue: 0,
        emi: 9800,
        outstanding: 2240000,
        risk: 62,
        segment: 'Near-prime PMAY',
        bureauScore: '710 (CIBIL)',
        creditScore: '710',
        intent: 'Payroll deposit shifted',
        tone: 'warn',
        action: 'Offer debit reschedule to 10th',
        channel: 'AI voice',
        lang: 'Hindi',
        code: 'hi',
        property: 'Independent house, Gomti Nagar ext.',
        ltv: 71,
        factors: [
          ['Salary deposit arriving 6 days late', 28],
          ['Bank balance down 22% over 30 days', 21],
          ['eNACH presentation date precedes payday', 13]
        ],
        story: 'Medium risk (62% in amber): Payday shifted past auto-debit date. Nexus proactively adjusts eNACH retry date to avoid bounce charges.',
        creditStory: 'Pre-due cash-flow alert. Debit rescheduling mitigates technical default risk.',
        memoryExamples: [
          {
            id: 'HL-LKO-4412',
            title: 'Lucknow · Gomti Nagar',
            product: 'PMAY home loan',
            match: 96,
            matchReason: 'State government salary date shifted 6 days; pre-due bounce risk',
            action: 'Proactive eNACH presentation date shifted to 10th with Hindi voice confirmation',
            outcome: 'Debit cleared on 10th · Zero bounce fee incurred',
            creditLearning: 'Aligned PMAY mandate presentation dates with state treasury disbursement schedules',
            statusTone: 'good'
          },
          {
            id: 'HL-LKO-3801',
            title: 'Lucknow · Alambagh',
            product: 'PMAY home loan',
            match: 92,
            matchReason: 'Seasonal cash-flow tightening prior to festive cycle',
            action: 'Offered 5-day grace period with Hindi SMS reminder',
            outcome: 'Full EMI payment received on 11th · SMA-0 prevented',
            creditLearning: 'PMAY portfolio default rate dropped 28% following proactive pre-due adjustments',
            statusTone: 'good'
          }
        ]
      },
      {
        id: 'CASE-3011',
        hero: true,
        name: 'Vijay Venkatesh',
        city: 'Hyderabad',
        product: 'Loan against property',
        bucket: 'SMA-2',
        dpd: '68 days',
        overdue: 124000,
        emi: 62000,
        outstanding: 4200000,
        risk: 91,
        segment: 'Self-employed MSME',
        bureauScore: '635 (CIBIL)',
        creditScore: '635',
        intent: 'Commercial cash-flow contraction (42%)',
        tone: 'bad',
        action: 'Dedicated hardship specialist review',
        channel: 'Your caller',
        lang: 'Telugu',
        code: 'te',
        property: 'Shop, Ameerpet',
        ltv: 49,
        human: true,
        factors: [
          ['Commercial rental inflows down 42%', 34],
          ['Two consecutive eNACH bounces', 28],
          ['Dispute on loan interest reset', 17],
          ['Multiple bureau inquiries', 12]
        ],
        story: 'Critical risk (91% in red): Secured LAP case with sharp commercial cash flow drop and active interest rate dispute. Automated outreach paused; assigned to senior team.',
        creditStory: 'High-value LAP account under commercial stress. Underwriting flags collateral for reassessment.',
        memoryExamples: [
          {
            id: 'LAP-HYD-5120',
            title: 'Hyderabad · Ameerpet',
            product: 'Loan against property',
            match: 98,
            matchReason: 'Commercial tenant vacancy & active billing dispute; 68 DPD in SMA-2',
            action: 'Dedicated hardship specialist review; 60-day SARFAESI pause & EMI restructuring',
            outcome: 'Full recovery of ₹1,24,000 overdue · Normalcy restored',
            creditLearning: 'Tightened commercial shop collateral appraisal criteria in older Hyderabad trade hubs',
            statusTone: 'warn'
          },
          {
            id: 'LAP-HYD-4890',
            title: 'Hyderabad · Banjara Hills',
            product: 'Loan against property',
            match: 93,
            matchReason: 'Consecutive NACH mandate bounces and rental inflow drop (42%)',
            action: 'Assigned to senior portfolio workout officer for collateral reappraisal',
            outcome: 'Settlement plan executed; avoided non-performing asset classification',
            creditLearning: 'Updated LAP loan-to-value caps from 65% to 55% for volatile retail commerce sectors',
            statusTone: 'warn'
          }
        ]
      },
      { id: 'CASE-3015', name: 'Vijay Iyer', city: 'Chennai', product: 'Home loan, salaried', bucket: 'Pre-due', dpd: 'due in 7 days', overdue: 0, emi: 41500, outstanding: 3950000, risk: 69, intent: 'Salary credit missed', tone: 'warn', action: 'Reminder with UPI link', channel: 'WhatsApp', lang: 'Tamil', code: 'ta', property: 'Flat, Velachery', ltv: 63 },
      { id: 'CASE-3018', name: 'Prakash Jadhav', city: 'Nagpur', product: 'Plot and construction loan', bucket: 'SMA-0', dpd: '8 days', overdue: 18600, emi: 18600, outstanding: 2480000, risk: 44, intent: 'Partial UPI repayment', tone: 'ok', action: 'AI voice call', channel: 'AI voice', lang: 'Marathi', code: 'mr', property: 'Plot with house under construction', ltv: 55 },
      { id: 'CASE-3022', name: 'Farhan Qureshi', city: 'Mumbai', product: 'Balance transfer and top-up', bucket: 'SMA-2', dpd: '68 days', overdue: 96000, emi: 48000, outstanding: 3650000, risk: 89, intent: 'Interest reset dispute', tone: 'bad', action: 'Review by your team', channel: 'Your caller', lang: 'English', code: 'en', human: true, property: 'Flat, Kurla', ltv: 68 },
      { id: 'CASE-3025', name: 'Kiran Shetty', city: 'Mangaluru', product: 'Home renovation loan', bucket: 'Pre-due', dpd: 'due in 9 days', overdue: 0, emi: 12300, outstanding: 2320000, risk: 63, intent: 'Multiple bureau inquiries', tone: 'warn', action: 'Call from your team', channel: 'Your caller', lang: 'Kannada', code: 'kn', property: 'Independent house, Kadri', ltv: 22 },
      { id: 'CASE-3029', name: 'Vikram Rathore', city: 'Jaipur', product: 'Home loan, self-employed', bucket: 'SMA-0', dpd: '4 days', overdue: 26700, emi: 26700, outstanding: 3100000, risk: 33, intent: 'Mandate bounce (insufficient funds)', tone: 'ok', action: 'eNACH retry and SMS', channel: 'SMS', lang: 'Hindi', code: 'hi', property: 'Flat, Mansarovar', ltv: 61 },
      { id: 'CASE-3034', name: 'Shabana Ansari', city: 'Indore', product: 'PMAY home loan', bucket: 'SMA-2', dpd: '79 days', overdue: 21400, emi: 10700, outstanding: 2280000, risk: 78, intent: 'Medical hardship declaration', tone: 'bad', action: 'Hardship team', channel: 'Your caller', lang: 'Hindi', code: 'hi', human: true, property: 'Flat, PMAY project', ltv: 74 },
      { id: 'CASE-3020', name: 'Suresh Naidu', city: 'Coimbatore', product: 'Home loan, self-employed', bucket: 'NPA', dpd: '207 DPD', overdue: 198000, emi: 33000, outstanding: 3450000, risk: 98, segment: 'Self-employed', bureauScore: '540 (CIBIL)', creditScore: '540', intent: 'SARFAESI 13(2) notice issued', tone: 'bad', action: 'NPA: legal / recovery track', channel: 'Legal / Recovery', lang: 'Tamil', code: 'ta', property: 'Independent house, RS Puram', ltv: 72, human: true },
      { id: 'CASE-3030', name: 'Suresh Raman', city: 'Bengaluru', product: 'Loan against property', bucket: 'NPA', dpd: '181 DPD', overdue: 252000, emi: 42000, outstanding: 3820000, risk: 97, segment: 'Self-employed MSME', bureauScore: '560 (CIBIL)', creditScore: '560', intent: 'Commercial collateral recall', tone: 'bad', action: 'NPA: legal / recovery track', channel: 'Legal / Recovery', lang: 'Kannada', code: 'kn', property: 'Commercial unit, Peenya', ltv: 65, human: true }
    ],
    calls: [
      { name: 'Hitesh Shah', city: 'Ahmedabad', lang: 'Gujarati', lines: ['Namaste, this is the digital assistant for ' + prospect + '. Am I speaking with Hitesh Shah?', 'Yes, speaking.', 'Your EMI of ₹31,200 bounced on the 5th. Is everything all right?', 'Payments from my buyers are late this month.', 'You could pay ₹15,600 now and the rest on the 20th.', 'Okay, send the link.'], outcome: 'Paid ₹15,600 by UPI', tone: 'ok' },
      { name: 'Lakshmi Narayanan', city: 'Coimbatore', lang: 'Tamil', lines: ['Vanakkam, this is the digital assistant for ' + prospect + '. Is this Lakshmi Narayanan?', 'Yes.', 'Your home loan EMI of ₹22,800 is due on the 5th. Shall I keep the auto-debit as it is?', 'Yes, the money will be there.', 'Thank you. I will confirm once it is debited.', 'Okay.'], outcome: 'Auto-debit confirmed', tone: 'info' },
      { name: 'Ramesh Kulkarni', city: 'Nashik', lang: 'Marathi', lines: ['Namaskar, this is the digital assistant for ' + prospect + '. Is this Ramesh Kulkarni?', 'Yes.', 'Your EMI of ₹18,450 is 12 days overdue.', 'I will pay on the 10th, after my rent comes in.', 'I will send a reminder that morning.', 'Okay, thanks.'], outcome: 'Promise to pay · 10th', tone: 'info' },
      { name: 'Nikhil Mehta', city: 'Mumbai', lang: 'English', lines: ['Hello, this is the digital assistant for ' + prospect + '. Am I speaking with Nikhil Mehta?', 'Yes.', 'I am calling about ₹52,000 overdue on your top-up loan.', 'That includes an insurance charge I never agreed to.', 'Understood. I am passing this to a person on the team.', 'Thank you.'], outcome: 'Dispute · sent to your team', tone: 'bad' },
      { name: 'Srinivas Rao', city: 'Vijayawada', lang: 'Telugu', lines: ['Namaskaram, this is the digital assistant for ' + prospect + '. Is this Srinivas Rao?', 'Yes.', 'Your EMI of ₹14,900 was due 6 days ago.', 'The auto-debit failed. I can pay now.', 'Sending a UPI request now.', 'Done.'], outcome: 'Paid ₹14,900 by UPI', tone: 'ok' },
      { name: 'Pooja Verma', city: 'Bhopal', lang: 'Hindi', lines: ['Namaste, this is the digital assistant for ' + prospect + '. Is this Pooja Verma?', 'Yes.', 'Your PMAY home loan EMI of ₹8,600 was due on the 5th.', 'Oh, I forgot. Paying now.', 'Sending the UPI link.', 'Paid.'], outcome: 'Paid ₹8,600 by UPI', tone: 'ok' }
    ],
    feedPool: [
      ['Devang Parekh', 'Ahmedabad', 15600], ['Anupama Menon', 'Kochi', 38200], ['Amit Joshi', 'Vadodara', 0],
      ['Chaitanya Varma', 'Vijayawada', 14900], ['Neha Kapoor', 'Gurugram', 46500], ['Imran Sheikh', 'Aurangabad', 21300],
      ['Tanvi Saxena', 'Bhopal', 8600], ['Sachin Bhave', 'Nashik', 0], ['Mahesh Hegde', 'Mysuru', 27400],
      ['Kavita Bansal', 'Ludhiana', 33800], ['Kishore Nambiar', 'Thrissur', 19200], ['Balamurugan S.', 'Coimbatore', 0]
    ].map(([name, city, amt]) => ({ name, city, amt, ptp: !amt })),
    message: (code, base) => MSG[code] || base,
    prepared: 2740,
    flagged: 3860,
    hardship: 112,
    accounts: 126000,
    due: 5400000000,
    atRisk: 1680000000,
    collectedBase: 216000000,
    collectedPerSec: 64000,
    bulkBoost: 41000000,
    cure: 71,
    cureDelta: 9,
    dailyTarget: 240000000,
    buckets: [
      { label: 'Pre-due', sub: 'Current · 0 DPD (due in 10 days)', n: 3860, amt: 1680000000 },
      { label: 'SMA-0', sub: '1 to 30 DPD · Special Mention 0', n: 5240, amt: 2120000000 },
      { label: 'SMA-1', sub: '31 to 60 DPD · Special Mention 1', n: 1870, amt: 960000000 },
      { label: 'SMA-2', sub: '61 to 90 DPD · Special Mention 2', n: 720, amt: 540000000 },
      { label: 'NPA', sub: '90+ DPD · SARFAESI / Legal track', n: 410, amt: 610000000 }
    ],
    regions: [['Maharashtra', 73], ['Gujarat', 72], ['Tamil Nadu', 69], ['Telangana', 64], ['Karnataka', 62]],
    channels: [['eNACH retry', 27], ['WhatsApp and UPI', 31], ['AI voice', 19], ['Your callers', 16], ['Field', 7]],
    factors: ['eNACH bounce on the last EMI', 'Business inflows down over 60 days', 'New loan taken elsewhere in 90 days'],
    altActions: ['Call from your team', 'Branch visit', 'Restructure review'],
    callsDone: 6400,
    paidOnCalls: 74000000,
    paidOnCallsPerSec: 9800,
    handedOff: 186,
    languages: ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada'],
    npaLabel: 'SARFAESI and legal (NPA)',
    ladder: [
      ['Pre-due', ['WhatsApp', 'SMS']],
      ['eNACH bounce', ['eNACH retry', 'WhatsApp and UPI']],
      ['SMA-0', ['WhatsApp', 'AI voice', 'Your caller']],
      ['SMA-1', ['AI voice', 'Your caller', 'Branch visit']],
      ['SMA-2', ['Your caller', 'Branch visit']],
      ['NPA', ['Legal team, SARFAESI']]
    ],
    hfc: true
  };
}
