// All demo data. Every borrower, amount and rate here is illustrative.
// Ported from reference/Demo.dc.html, with a few consistency fixes:
// - Live calls and the audit trail use borrowers from earlier approved
//   batches, so nobody in the work queue is contacted before approval.
// - Every call opens with an AI disclosure; US calls verify identity
//   before any account details are mentioned.

import { iciciHfcData } from './profiles/iciciHfc.js';

export function formatters(US) {
  const money = (n) => {
    if (US) {
      if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
      if (n >= 10000) return '$' + Math.round(n / 1000) + 'K';
      return '$' + Math.round(n).toLocaleString('en-US');
    }
    if (n >= 1000000000) return '₹' + Math.round(n / 10000000).toLocaleString('en-IN') + ' cr';
    if (n >= 10000000) return '₹' + parseFloat((n / 10000000).toFixed(2)) + ' cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };
  const num = (n) => Math.round(n).toLocaleString(US ? 'en-US' : 'en-IN');
  return { money, num };
}

const MSG_IN = {
  ta: 'வணக்கம் {n}, உங்கள் {a} EMI செலுத்த வேண்டிய நாள் நெருங்குகிறது. ஒரே தட்டலில் செலுத்துங்கள்: [UPI இணைப்பு]. கூடுதல் நேரம் வேண்டுமா? HELP என்று பதிலளிக்கவும்.',
  hi: 'नमस्ते {n} जी, आपकी {a} की EMI बाकी है। एक टैप में भुगतान करें: [UPI लिंक]। ज़्यादा समय चाहिए? HELP लिखकर जवाब दें।',
  mr: 'नमस्कार {n}, तुमचा {a} चा EMI बाकी आहे. एका टॅपमध्ये भरा: [UPI लिंक]. अधिक वेळ हवा आहे? HELP असे उत्तर द्या.',
  bn: 'নমস্কার {n}, আপনার {a}-এর কিস্তি বাকি আছে। এক ট্যাপে পেমেন্ট করুন: [UPI লিঙ্ক]। আরও সময় লাগবে? HELP লিখে উত্তর দিন।',
  te: 'నమస్కారం {n} గారు, మీ {a} చెల్లింపు పెండింగ్‌లో ఉంది. ఒక్క ట్యాప్‌తో చెల్లించండి: [UPI లింక్]. మరింత సమయం కావాలా? HELP అని రిప్లై చేయండి.',
  kn: 'ನಮಸ್ಕಾರ {n}, ನಿಮ್ಮ {a} EMI ಬಾಕಿ ಇದೆ. ಒಂದೇ ಟ್ಯಾಪ್‌ನಲ್ಲಿ ಪಾವತಿಸಿ: [UPI ಲಿಂಕ್]. ಹೆಚ್ಚಿನ ಸಮಯ ಬೇಕೇ? HELP ಎಂದು ಉತ್ತರಿಸಿ.',
  en: 'Hi {n}, your EMI of {a} is pending. Pay in one tap: [UPI link]. Need more time? Reply HELP.'
};
// English versions shown under each drafted message, so the reviewer
// knows what is being sent.
const MSG_IN_EN = 'Hello {n}, your EMI of {a} is pending. Pay in one tap: [UPI link]. Need more time? Reply HELP.';

const MSG_US = {
  en: 'Hi {n}, your payment of {a} is coming up. Pay in one tap or pick a new date: [secure link]. Need help? Reply HELP. Reply STOP to opt out.',
  es: 'Hola {n}, su pago de {a} está por vencer. Pague en un toque o elija otra fecha: [enlace seguro]. ¿Necesita ayuda? Responda AYUDA. Responda STOP para no recibir más mensajes.'
};
const MSG_US_EN = 'Hi {n}, your payment of {a} is coming up. Pay in one tap or pick a new date: [secure link]. Need help? Reply HELP. Reply STOP to opt out.';

const ROWS_IN = [
  {
    id: 'CASE-3008',
    hero: true,
    name: 'Karthik S.',
    city: 'Madurai',
    product: 'Personal loan',
    bucket: 'SMA-0',
    dpd: '2 DPD',
    overdue: 28400,
    emi: 14200,
    outstanding: 2840000,
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
    lang: 'Tamil',
    code: 'ta',
    factors: [
      ['Late EMIs two cycles running', 20],
      ['Salary credit missing for 45 days', 16],
      ['Account balance down 35%', 11],
      ['Partial payments in last 60 days', 7]
    ],
    story: 'Early warning (54% in amber): SMA-0 (2 DPD) early warning watch, not a critical default. Thin-file borrower with early cash-flow signal. Next-Best-Action simulation predicts 94% cure with a soft-touch reminder call, while policy routes high-exposure early accounts for supervisor sign-off.',
    creditStory: 'This pattern (thin-file borrower with no bureau history, missing salary credit, personal loan, Madurai) triggered early delinquency rules. Collections intelligence advises alternative Account Aggregator cash-flow underwriting for thin-file applicants.',
    policyReason: {
      title: 'High exposure requires manager review',
      statedReason: 'High-exposure accounts mandate supervisor review before automated outreach.',
      detail: 'SMA-0 (2 DPD) early-warning watch with ₹28,400 overdue. Next-Best-Action simulation predicts 94% cure with soft-touch outreach, but credit governance policy routes high loan balances for supervisor review before automated dispatch.',
      cureComparison: {
        softTouch: 94,
        standardNotice: 38,
        escalate: 'Mandated by Policy'
      }
    },
    memoryExamples: [
      {
        id: 'PL-MDU-6102',
        title: 'Madurai · KK Nagar',
        product: 'Personal loan',
        match: 95,
        matchReason: 'Missing salary credit with 2 consecutive EMI delays and 35% liquidity drawdown',
        action: 'Tamil voice agent courtesy reminder with instant UPI payment link',
        outcome: 'Paid ₹14,200 within 48h · 92% cure rate',
        creditLearning: 'Account Aggregator balance thresholds calibrated for Madurai manufacturing sector',
        statusTone: 'good'
      },
      {
        id: 'PL-MDU-5833',
        title: 'Madurai · Anna Nagar',
        product: 'Personal loan',
        match: 91,
        matchReason: 'Cash-flow delay following employer payroll cycle shift to 10th of month',
        action: 'Rescheduled auto-debit presentation date to 10th with SMS confirmation',
        outcome: 'Mandate cleared on presentation · Zero bounce penalties',
        creditLearning: 'Added employer disbursement cycle verification to personal loan credit rules',
        statusTone: 'good'
      }
    ]
  },
  {
    id: 'CASE-3002',
    hero: true,
    name: 'Shanthi Patil',
    city: 'Pune',
    product: 'Home loan',
    bucket: 'SMA-0',
    dpd: '4 days',
    overdue: 18450,
    emi: 18450,
    outstanding: 2850000,
    risk: 14,
    segment: 'Prime salaried',
    bureauScore: '790 (CIBIL)',
    creditScore: '790',
    intent: 'eNACH mandate retry pending',
    tone: 'ok',
    action: 'WhatsApp reminder with UPI link',
    channel: 'WhatsApp',
    lang: 'Marathi',
    code: 'mr',
    factors: [
      ['Average bank balance 4.8x EMI', 6],
      ['Salary credited on schedule on 1st', 5],
      ['Zero bounce history in past 24 months', 3]
    ],
    story: 'Low risk (14% in green): Strong financial health and punctual income credit. Minor delay due to oversight. Nexus recommends a low-touch WhatsApp reminder with 1-tap UPI link.',
    creditStory: 'Clean borrower profile with high liquidity buffers. Low risk (14%) qualifies for automatic digital nudge without agent intervention.',
    memoryExamples: [
      {
        id: 'HL-PUN-3108',
        title: 'Pune · Wakad',
        product: 'Home loan',
        match: 97,
        matchReason: 'Prime salaried profile with 4.8x EMI liquidity; 4-day technical delay in IT corridor',
        action: 'Marathi WhatsApp courtesy nudge with 1-tap UPI payment link',
        outcome: 'Paid in 12 hours · 100% cure rate',
        creditLearning: 'Confirms high cure resilience for Pune Hinjawadi IT corridor salaried borrowers',
        statusTone: 'good'
      },
      {
        id: 'HL-PUN-2945',
        title: 'Pune · Baner',
        product: 'Home loan',
        match: 94,
        matchReason: 'Routine travel oversight; pristine bureau history (790 CIBIL)',
        action: 'Digital SMS reminder with automated payment confirmation',
        outcome: 'Cleared same day · Account remained Current',
        creditLearning: 'Eliminated manual collection call overhead for low-risk salaried accounts in Pune',
        statusTone: 'good'
      }
    ]
  },
  {
    id: 'CASE-3005',
    hero: true,
    name: 'Ravi Kumar',
    city: 'Lucknow',
    product: 'Personal loan',
    bucket: 'Pre-due',
    dpd: 'due in 5 days',
    overdue: 0,
    emi: 9600,
    outstanding: 2240000,
    risk: 62,
    segment: 'Near-prime salaried',
    bureauScore: '710 (CIBIL)',
    creditScore: '710',
    intent: 'Payroll deposit shifted',
    tone: 'warn',
    action: 'Offer debit reschedule to 10th & send reminder',
    channel: 'WhatsApp',
    lang: 'Hindi',
    code: 'hi',
    factors: [
      ['Salary deposit arriving 6 days late', 28],
      ['Bank balance down 22% over 30 days', 21],
      ['Scheduled EMI debit precedes payday', 13]
    ],
    story: 'Medium risk (62% in amber): Account aggregator reveals employer salary date shifted by 6 days. Proactive rescheduling to the 10th prevents an avoidable bounce and protects borrower relationship.',
    creditStory: 'Pre-due warning triggered by account aggregator transaction flow. Rescheduling prevents technical default and reduces bounce servicing costs.',
    memoryExamples: [
      {
        id: 'PL-LKO-4412',
        title: 'Lucknow · Gomti Nagar',
        product: 'Personal loan',
        match: 95,
        matchReason: 'Employer payroll date shifted 6 days past scheduled debit; pre-due alert',
        action: 'Automated Hindi WhatsApp notification offering debit date shift to 10th',
        outcome: 'Borrower confirmed shift; debited successfully on 10th with zero bounce',
        creditLearning: 'Pre-due date alignment reduced technical default rate by 31% in Lucknow',
        statusTone: 'good'
      },
      {
        id: 'PL-LKO-3801',
        title: 'Lucknow · Alambagh',
        product: 'Personal loan',
        match: 92,
        matchReason: 'Account balance drop 22% preceding month-end presentation',
        action: 'Digital reminder with split repayment link across two tranches',
        outcome: 'Full EMI recovered within 5 days · Kept in Pre-due',
        creditLearning: 'Account Aggregator balance alerts enabled 7-day advance loss prevention',
        statusTone: 'good'
      }
    ]
  },
  {
    id: 'CASE-3011',
    hero: true,
    name: 'Mohammed Irfan',
    city: 'Hyderabad',
    product: 'MSME loan',
    bucket: 'SMA-2',
    dpd: '68 days',
    overdue: 84000,
    emi: 42000,
    outstanding: 4200000,
    risk: 91,
    segment: 'Self-employed MSME',
    bureauScore: '635 (CIBIL)',
    creditScore: '635',
    intent: 'Commercial turnover dip (42%)',
    tone: 'bad',
    action: 'Dedicated hardship specialist review',
    channel: 'Your caller',
    lang: 'Hindi',
    code: 'hi',
    human: true,
    factors: [
      ['GST business turnover down 42%', 34],
      ['Two consecutive NACH mandate bounces', 28],
      ['Dispute raised regarding interest calculation', 17],
      ['Multiple bureau inquiries for emergency credit', 12]
    ],
    story: 'Critical risk (91% in red): Severe business distress compounded by an active billing dispute. Automated outreach is blocked; assigned immediately to human hardship specialists with dossier.',
    creditStory: 'Severe commercial cash-flow contraction and formal dispute. Underwriting flags this sector for tightened collateral appraisal on renewal.',
    memoryExamples: [
      {
        id: 'MSME-HYD-5120',
        title: 'Hyderabad · Ameerpet',
        product: 'MSME loan',
        match: 97,
        matchReason: 'Commercial wholesale turnover drop 40% with dual NACH mandate bounces',
        action: 'Dedicated business workout manager review & structured working capital milestone',
        outcome: 'Recovered ₹84,000 overdue across 2 scheduled installments',
        creditLearning: 'MSME credit underwriting lowered permissible debt-to-turnover ratio for trade hubs',
        statusTone: 'warn'
      },
      {
        id: 'MSME-HYD-4890',
        title: 'Hyderabad · Banjara Hills',
        product: 'MSME loan',
        match: 93,
        matchReason: 'Receivables supply chain lag causing acute liquidity crunch in SMA-2',
        action: 'Hardship intervention with supplier invoice reconciliation and grace extension',
        outcome: 'Account normalized to SMA-1 in 30 days · Avoided NPA classification',
        creditLearning: 'Mandatory working capital cycle audit introduced for MSME loans > ₹40 lakh',
        statusTone: 'warn'
      }
    ]
  },
  { id: 'CASE-3015', name: 'Soumya Das', city: 'Durgapur', product: 'Microfinance', bucket: 'SMA-1', dpd: '44 days', overdue: 2300, emi: 1150, outstanding: 2450000, risk: 69, intent: 'Unreachable (3 call cycles)', tone: 'bad', action: 'Field visit, route 3', channel: 'Field', lang: 'Bengali', code: 'bn' },
  { id: 'CASE-3018', name: 'Lakshmi Reddy', city: 'Warangal', product: 'Gold loan', bucket: 'SMA-0', dpd: '9 days', overdue: 6800, emi: 6800, outstanding: 2360000, risk: 40, intent: 'Partial UPI repayment', tone: 'ok', action: 'AI voice call', channel: 'AI voice', lang: 'Telugu', code: 'te' },
  { id: 'CASE-3022', name: 'Divya Nair', city: 'Kochi', product: 'Personal loan', bucket: 'SMA-2', dpd: '67 days', overdue: 24400, emi: 12200, outstanding: 3120000, risk: 88, intent: 'Interest reset dispute', tone: 'bad', action: 'Review by your team', channel: 'Your caller', lang: 'English', code: 'en', human: true },
  { id: 'CASE-3025', name: 'Manjunath G.', city: 'Hubballi', product: 'MSME loan', bucket: 'Pre-due', dpd: 'due in 9 days', overdue: 0, emi: 42000, outstanding: 3360000, risk: 66, intent: 'GST filing lapse', tone: 'warn', action: 'Call from your team', channel: 'Your caller', lang: 'Kannada', code: 'kn' },
  { id: 'CASE-3029', name: 'Deepak Sharma', city: 'Jaipur', product: 'Two-wheeler', bucket: 'SMA-0', dpd: '5 days', overdue: 3100, emi: 3100, outstanding: 2650000, risk: 35, intent: 'Mandate bounce (insufficient funds)', tone: 'ok', action: 'SMS with UPI link', channel: 'SMS', lang: 'Hindi', code: 'hi' },
  { id: 'CASE-3034', name: 'Fatima Shaikh', city: 'Mumbai', product: 'Personal loan', bucket: 'SMA-2', dpd: '74 days', overdue: 31600, emi: 15800, outstanding: 2980000, risk: 77, intent: 'Medical hardship declaration', tone: 'bad', action: 'Hardship team', channel: 'Your caller', lang: 'Hindi', code: 'hi', human: true },
  { id: 'CASE-3020', name: 'Gopal Krishnan', city: 'Coimbatore', product: 'Personal loan', bucket: 'NPA', dpd: '207 DPD', overdue: 184500, emi: 26400, outstanding: 3450000, risk: 98, segment: 'Self-employed', bureauScore: '540 (CIBIL)', creditScore: '540', intent: 'SARFAESI 13(2) notice issued', tone: 'bad', action: 'NPA: legal / recovery track', channel: 'Legal / Recovery', lang: 'Tamil', code: 'ta', human: true },
  { id: 'CASE-3030', name: 'Ramesh Murugan', city: 'Bengaluru', product: 'MSME loan', bucket: 'NPA', dpd: '181 DPD', overdue: 252000, emi: 42000, outstanding: 3820000, risk: 97, segment: 'Self-employed MSME', bureauScore: '560 (CIBIL)', creditScore: '560', intent: 'Commercial invoice default', tone: 'bad', action: 'NPA: legal / recovery track', channel: 'Legal / Recovery', lang: 'Kannada', code: 'kn', human: true }
];

const ROWS_US = [
  {
    id: 'CASE-3008',
    hero: true,
    name: 'María González',
    city: 'San Antonio, TX',
    product: 'Auto loan',
    bucket: 'SMA-0',
    dpd: '2 DPD',
    overdue: 824,
    emi: 412,
    outstanding: 28400,
    risk: 54,
    priorityScore: 54,
    flaggedAt: '09:12 AM',
    decisionAt: '09:28 AM',
    escalationAt: '09:45 AM',
    segment: 'Thin file',
    bureauScore: 'No / limited bureau history',
    creditScore: 'No / limited bureau history',
    intent: 'Salary credit missed',
    tone: 'warn',
    action: 'Escalate to manager review',
    secondaryAction: 'Soft-touch AI call with payment plan on manager sign-off',
    channel: 'AI voice',
    lang: 'Spanish',
    code: 'es',
    factors: [
      ['Late EMIs two cycles running', 20],
      ['Salary / paycheck deposit missing for 45 days', 16],
      ['Bank balance down 35%', 11],
      ['Partial payments in last 60 days', 7]
    ],
    story: 'Early warning (54% in amber): SMA-0 (2 DPD) early warning watch, not a critical default. Thin-file borrower with early cash-flow signal. Next-Best-Action simulation predicts 94% cure with a soft-touch restructuring call, while policy routes high-exposure early accounts for supervisor sign-off.',
    creditStory: 'This pattern triggered early warning delinquency rules. Collections intelligence recommends alternative cash-flow underwriting for thin-file applicants.',
    policyReason: {
      title: 'High exposure requires manager review',
      statedReason: 'High-exposure accounts mandate supervisor review before automated outreach.',
      detail: 'SMA-0 (2 DPD) early-warning watch with $824 overdue. While NBA predicts 94% cure with a soft-touch restructuring call, governance policy mandates manager sign-off before dispatch.',
      cureComparison: {
        softTouch: 94,
        standardNotice: 36,
        escalate: 'Mandated by Policy'
      }
    },
    memoryExamples: [
      {
        id: 'AL-SAT-8104',
        title: 'San Antonio · Bexar County',
        product: 'Auto loan',
        match: 96,
        matchReason: 'Payroll shift with 2 consecutive late auto installments & 35% liquidity dip',
        action: 'Bi-weekly payment split plan with courtesy call in Spanish',
        outcome: 'Cured in 30 days · 94% cure rate ($824 recovered)',
        creditLearning: 'Cash-flow verification replaced strict bureau score cutoffs for thin-file auto loans',
        statusTone: 'good'
      },
      {
        id: 'AL-SAT-7940',
        title: 'San Antonio · Alamo Heights',
        product: 'Auto loan',
        match: 92,
        matchReason: 'Missing paycheck deposit & partial payment in 60-day window',
        action: 'Automated SMS payment arrangement with manager sign-off',
        outcome: 'Account normalized · Zero repossession or charge-off',
        creditLearning: 'Early-warning rule reduced false-positive repossession alerts by 41% in Bexar area',
        statusTone: 'good'
      }
    ]
  },
  {
    id: 'CASE-3002',
    hero: true,
    name: 'James Carter',
    city: 'Columbus, OH',
    product: 'Personal loan',
    bucket: 'SMA-0',
    dpd: '4 days',
    overdue: 286,
    emi: 286,
    outstanding: 28500,
    risk: 14,
    segment: 'Prime personal',
    bureauScore: '790 (FICO)',
    creditScore: '790',
    intent: 'ACH debit retry pending',
    tone: 'ok',
    action: 'Text with 1-tap pay link',
    channel: 'Text',
    lang: 'English',
    code: 'en',
    factors: [
      ['Average bank balance 4.8x payment', 6],
      ['Paycheck credited on schedule', 5],
      ['Zero return history in past 24 months', 3]
    ],
    story: 'Low risk (14% in green): Strong liquidity, perfect history. Quick text reminder with secure pay link.',
    creditStory: 'Clean borrower profile with high liquidity buffers. Low risk qualifies for automated digital nudge.',
    memoryExamples: [
      {
        id: 'PL-CMH-2201',
        title: 'Columbus · Short North',
        product: 'Personal loan',
        match: 97,
        matchReason: 'Prime credit profile (790 FICO) with 4.8x liquidity buffer; minor calendar oversight',
        action: 'Single automated text reminder with 1-tap payment link',
        outcome: 'Paid within 6 hours · 100% cure rate',
        creditLearning: 'Confirms zero loss rate for prime personal installment accounts in Columbus',
        statusTone: 'good'
      },
      {
        id: 'PL-CMH-2094',
        title: 'Columbus · Dublin',
        product: 'Personal loan',
        match: 93,
        matchReason: 'Travel-related payment delay with spotless 24-month payment history',
        action: 'Courtesy notification with automated payment confirmation',
        outcome: 'Account cleared same day · Maintained Current status',
        creditLearning: 'Eliminated unnecessary manual collector outreach for low-risk salaried segment',
        statusTone: 'good'
      }
    ]
  },
  {
    id: 'CASE-3005',
    hero: true,
    name: 'Luis Hernández',
    city: 'Phoenix, AZ',
    product: 'Credit card',
    bucket: 'Pre-due',
    dpd: 'due in 5 days',
    overdue: 0,
    emi: 195,
    outstanding: 22400,
    risk: 62,
    segment: 'Near-prime card',
    bureauScore: '705 (FICO)',
    creditScore: '705',
    intent: 'Payroll deposit shifted',
    tone: 'warn',
    action: 'Offer payment plan & move due date',
    channel: 'AI voice',
    lang: 'Spanish',
    code: 'es',
    factors: [
      ['Paycheck arriving 5 days late', 28],
      ['Checking balance down 24%', 21],
      ['Payment due before payroll deposit', 13]
    ],
    story: 'Moderate risk (62% in amber): Paycheck date shifted. Move due date by 5 days to avoid return fee.',
    creditStory: 'Pre-due warning from cash-flow transaction data. Rescheduling due date prevents default.',
    memoryExamples: [
      {
        id: 'CC-PHX-4412',
        title: 'Phoenix · Scottsdale',
        product: 'Credit card',
        match: 95,
        matchReason: 'Employer payroll deposit delayed 5 days; pre-due return risk on auto-pay',
        action: 'Spanish voice assistant offered 5-day due-date extension to align with paycheck',
        outcome: 'Payment cleared on rescheduled date · Zero late fees assessed',
        creditLearning: 'Transaction flow due-date shifting lowered early-stage revolving delinquency by 33%',
        statusTone: 'good'
      },
      {
        id: 'CC-PHX-3801',
        title: 'Phoenix · Tempe',
        product: 'Credit card',
        match: 91,
        matchReason: 'Deposit balance reduction (24%) preceding billing cycle date',
        action: 'Proactive digital notification with minimum balance grace window',
        outcome: 'Paid in full on revised date · Avoided 30 DPD entry',
        creditLearning: 'Pre-due cash flow alerts integrated into revolving card line management',
        statusTone: 'good'
      }
    ]
  },
  {
    id: 'CASE-3011',
    hero: true,
    name: 'Keisha Brown',
    city: 'Atlanta, GA',
    product: 'Auto loan',
    bucket: 'SMA-2',
    dpd: '68 days',
    overdue: 1167,
    emi: 389,
    outstanding: 42000,
    risk: 91,
    segment: 'Subprime auto',
    bureauScore: '620 (FICO)',
    creditScore: '620',
    intent: 'Commercial turnover dip (42%)',
    tone: 'bad',
    action: 'Hardship specialist review',
    channel: 'Your agent',
    lang: 'English',
    code: 'en',
    human: true,
    factors: [
      ['Secondary income loss flagged', 34],
      ['Consecutive returned ACH debits', 28],
      ['Billing dispute on file', 17],
      ['Multiple bureau inquiries', 12]
    ],
    story: 'Critical risk (91% in red): Severe hardship and billing dispute. Autonomous contact paused; routed to human specialist.',
    creditStory: 'High risk account with contested fees. Underwriting notes updated for future portfolio risk modeling.',
    memoryExamples: [
      {
        id: 'AL-ATL-5120',
        title: 'Atlanta · Buckhead',
        product: 'Auto loan',
        match: 98,
        matchReason: 'Secondary income disruption and dispute over vehicle gap insurance surcharge',
        action: 'Assigned to senior hardship workout specialist with 60-day recovery agreement',
        outcome: 'Recovered $1,167 overdue balance · Title retention agreement executed',
        creditLearning: 'Underwriting tightened subprime auto debt-to-income caps in metropolitan Atlanta',
        statusTone: 'warn'
      },
      {
        id: 'AL-ATL-4890',
        title: 'Atlanta · Midtown',
        product: 'Auto loan',
        match: 93,
        matchReason: 'Consecutive ACH returns and 68 DPD in pre-chargeoff status',
        action: 'Hardship plan signed with revised loan term and deferred installment',
        outcome: 'Account normalized to 30 DPD in 45 days · Charge-off averted',
        creditLearning: 'Early dispute resolution protocol reduced repossession legal expense by 26%',
        statusTone: 'warn'
      }
    ]
  },
  { id: 'CASE-3015', name: 'Daniel Nguyen', city: 'Houston, TX', product: 'Installment loan', bucket: 'SMA-0', dpd: '7 days', overdue: 214, emi: 214, outstanding: 12800, risk: 33, intent: 'ACH return (insufficient funds)', tone: 'ok', action: 'Text with pay link', channel: 'Text', lang: 'English', code: 'en' },
  { id: 'CASE-3018', name: 'Ana Rodríguez', city: 'Miami, FL', product: 'Credit union loan', bucket: 'Pre-due', dpd: 'due in 9 days', overdue: 0, emi: 330, outstanding: 24000, risk: 68, intent: 'Tax filing lapse', tone: 'warn', action: 'AI voice call', channel: 'AI voice', lang: 'Spanish', code: 'es' },
  { id: 'CASE-3022', name: 'Robert Miller', city: 'Dayton, OH', product: 'Auto loan', bucket: 'SMA-2', dpd: '72 days', overdue: 1167, emi: 389, outstanding: 31000, risk: 90, intent: 'Interest reset dispute', tone: 'bad', action: 'Dispute review', channel: 'Your agent', lang: 'English', code: 'en', human: true },
  { id: 'CASE-3025', name: 'Tanya Williams', city: 'Memphis, TN', product: 'Personal loan', bucket: 'SMA-1', dpd: '46 days', overdue: 520, emi: 260, outstanding: 18500, risk: 79, intent: 'Medical hardship declaration', tone: 'bad', action: 'Hardship team', channel: 'Your agent', lang: 'English', code: 'en', human: true },
  { id: 'CASE-3029', name: 'Carlos Ramírez', city: 'Fresno, CA', product: 'Auto loan', bucket: 'SMA-0', dpd: '15 days', overdue: 455, emi: 455, outstanding: 26000, risk: 47, intent: 'Partial card repayment', tone: 'ok', action: 'AI voice call', channel: 'AI voice', lang: 'Spanish', code: 'es' },
  { id: 'CASE-3034', name: 'Emily Johnson', city: 'Tampa, FL', product: 'Credit card', bucket: 'SMA-0', dpd: '3 days', overdue: 120, emi: 120, outstanding: 9500, risk: 29, intent: 'Card debit bounce', tone: 'ok', action: 'Email with pay link', channel: 'Email', lang: 'English', code: 'en' },
  { id: 'CASE-3020', name: 'James Wilson', city: 'Chicago, IL', product: 'Installment loan', bucket: 'NPA', dpd: '210 DPD', overdue: 4200, emi: 350, outstanding: 38000, risk: 98, segment: 'Self-employed', bureauScore: '540 (FICO)', creditScore: '540', intent: 'Charge-off legal recall (200+ DPD)', tone: 'bad', action: 'NPA: legal / recovery track', channel: 'Legal / Recovery', lang: 'English', code: 'en', human: true },
  { id: 'CASE-3030', name: 'David Bennett', city: 'Phoenix, AZ', product: 'Auto loan', bucket: 'NPA', dpd: '184 DPD', overdue: 5600, emi: 480, outstanding: 42000, risk: 97, segment: 'Subprime auto', bureauScore: '555 (FICO)', creditScore: '555', intent: 'Collateral repossession notice (180+ DPD)', tone: 'bad', action: 'NPA: legal / recovery track', channel: 'Legal / Recovery', lang: 'English', code: 'en', human: true }
];

// Calls from the batch approved earlier this morning. These borrowers are
// not in the work queue. Lines alternate: AI first, then borrower.
const CALLS_IN = (p) => [
  { name: 'Suresh Yadav', city: 'Kanpur', lang: 'Hindi', amount: 4800, lines: ['Namaste, this is the digital assistant for ' + p + '. Am I speaking with Suresh Yadav?', 'Yes, speaking.', 'Your EMI of ₹9,600 was due on the 5th. Is everything all right?', 'My salary comes on the 12th.', 'You could pay ₹4,800 now and the rest on the 12th.', 'Okay, send the link.'], outcome: 'Paid ₹4,800 by UPI', tone: 'ok' },
  { name: 'Padma Rao', city: 'Vijayawada', lang: 'Telugu', lines: ['Namaskaram, this is the digital assistant for ' + p + '. Is this Padma Rao?', 'Yes.', 'Your gold loan payment of ₹6,800 is pending. Can you pay today?', 'I will pay this evening.', 'I will send a link at 6 pm.', 'Okay.'], outcome: 'Promise to pay · 6 pm today', tone: 'info' },
  { name: 'Senthil Kumar', city: 'Coimbatore', lang: 'Tamil', amount: 3200, lines: ['Vanakkam, this is the digital assistant for ' + p + '. Is this Senthil?', 'Yes, tell me.', 'Your EMI of ₹3,200 is due on the 5th.', 'I can pay now.', 'Sending a UPI request now.', 'Done.'], outcome: 'Paid ₹3,200 by UPI', tone: 'ok' },
  { name: 'Joseph Thomas', city: 'Thrissur', lang: 'English', lines: ['Hello, this is the digital assistant for ' + p + '. Am I speaking with Joseph Thomas?', 'Yes.', 'I am calling about ₹24,400 overdue on your loan.', 'I already paid this. There is a mistake.', 'Understood. I am passing this to a person on the team.', 'Thank you.'], outcome: 'Dispute · sent to your team', tone: 'bad' },
  { name: 'Sunita Jadhav', city: 'Nashik', lang: 'Marathi', lines: ['Namaskar, this is the digital assistant for ' + p + '. Is this Sunita Jadhav?', 'Yes.', 'Your EMI of ₹18,450 is 12 days overdue.', 'I will pay on the 8th.', 'I will remind you that morning.', 'Okay, thanks.'], outcome: 'Promise to pay · 8th', tone: 'info' },
  { name: 'Amit Verma', city: 'Indore', lang: 'Hindi', amount: 3100, lines: ['Namaste, this is the digital assistant for ' + p + '. Is this Amit Verma?', 'Yes.', 'Your EMI of ₹3,100 was due 5 days ago.', 'Oh, I forgot. Paying now.', 'Sending the UPI link.', 'Paid.'], outcome: 'Paid ₹3,100 by UPI', tone: 'ok' }
];

const CALLS_US = (p) => [
  { name: 'Jorge Morales', city: 'El Paso', lang: 'Spanish', amount: 45, lines: ['Hola, this is an automated assistant calling for ' + p + '. Is this Jorge Morales?', 'Yes.', 'Thanks. Before we continue, please confirm your date of birth.', 'March 4, 1988.', 'Thank you. Your card payment of $95 is 19 days past due. Is everything okay?', 'Things are tight until the 20th.', 'You could pay $45 today and $50 on the 20th.', 'Okay, text me the link.'], outcome: 'Paid $45 by card', tone: 'ok' },
  { name: 'Ricardo Torres', city: 'Bakersfield', lang: 'Spanish', lines: ['Hola, this is an automated assistant calling for ' + p + '. Is this Ricardo Torres?', 'Yes, speaking.', 'Thanks. Please confirm the ZIP code on your account.', '93301.', 'Thank you. Your auto payment of $455 is 15 days past due.', 'I get paid Friday.', 'I will text you a reminder Friday morning.', 'Thanks.'], outcome: 'Promise to pay · Friday', tone: 'info' },
  { name: 'Sofía Castillo', city: 'Orlando', lang: 'Spanish', lines: ['Hola, this is an automated assistant calling for ' + p + '. Is this Sofía Castillo?', 'Yes.', 'Thanks. Please confirm your date of birth.', 'June 9, 1991.', 'Thank you. Your $330 payment is due in 9 days. Would a different date help?', 'Can I move it to the 15th?', 'Yes, the 15th is one of your options.', 'Perfect.'], outcome: 'Due date moved · 15th', tone: 'info' },
  { name: 'Mark Davis', city: 'Toledo', lang: 'English', lines: ['Hi, this is an automated assistant calling for ' + p + '. Is this Mark Davis?', 'Yes.', 'Thanks. Please confirm the ZIP code on your account.', '43604.', 'Thank you. I am calling about your auto loan balance of $1,167.', 'I do not think I owe that.', 'Understood. I am passing this to a person for review.', 'Okay.'], outcome: 'Dispute · sent to your team', tone: 'bad' },
  { name: 'Kevin Tran', city: 'Austin', lang: 'English', amount: 214, lines: ['Hi, this is an automated assistant calling for ' + p + '. Is this Kevin Tran?', 'Yes.', 'Thanks. Please confirm your date of birth.', 'October 2, 1985.', 'Thank you. Your $214 payment was due 7 days ago.', 'I totally forgot. Can I pay now?', 'Sending a secure link now.', 'Done.'], outcome: 'Paid $214 by ACH', tone: 'ok' },
  { name: 'Sarah Mitchell', city: 'Charlotte', lang: 'English', amount: 120, lines: ['Hi, this is an automated assistant calling for ' + p + '. Is this Sarah Mitchell?', 'Yes.', 'Thanks. Please confirm the ZIP code on your account.', '28202.', 'Thank you. Your card payment of $120 is 3 days late.', 'Paying it right now.'], outcome: 'Paid $120 by card', tone: 'ok' }
];

// People who paid or promised this morning, for the live activity feed.
const FEED_IN = [
  ['Gaurav Tiwari', 'Kanpur', 4800], ['Meena Pillai', 'Chennai', 12200], ['Rahul Gupta', 'Delhi', 3400, true],
  ['Manoj Swaminathan', 'Coimbatore', 3200], ['Kavita Joshi', 'Ahmedabad', 18450], ['Imran Khan', 'Bhopal', 6800],
  ['Naveen Chhabra', 'Indore', 3100], ['Bhavna Rane', 'Nashik', 0, true], ['Arjun Menon', 'Kozhikode', 9600],
  ['Rekha Singh', 'Patna', 1150], ['Vijay Patel', 'Surat', 42000], ['Vani Krishna', 'Vijayawada', 0, true]
];
const FEED_US = [
  ['Brandon Hayes', 'El Paso', 45], ['Ashley Moore', 'Raleigh', 389], ['Brian Lee', 'Seattle', 286, true],
  ['Justin Brooks', 'Austin', 214], ['Nicole Adams', 'Denver', 412], ['Marcus Hill', 'Detroit', 260],
  ['Rachel Cooper', 'Charlotte', 120], ['Hector Vance', 'Bakersfield', 0, true], ['Laura Diaz', 'San Diego', 330],
  ['Tyler Scott', 'Nashville', 95], ['Monica Reyes', 'Albuquerque', 455], ['Elena Cruz', 'Orlando', 0, true]
];

export function normalizeRow(r) {
  // Label 1 to 30 DPD as SMA-0 and keep the header and bucket consistent
  const dpdStr = String(r.dpd || '');
  const rangeMatch = dpdStr.match(/dpd\s*(\d+)\s*(?:to|-|\s+)\s*(\d+)/i);
  const match = dpdStr.match(/(\d+)\s*(?:dpd|days?)/i) || (rangeMatch && [rangeMatch[0], rangeMatch[1]]);
  let bucket = r.bucket;
  let human = r.human;
  let action = r.action;
  let channel = r.channel;
  let intent = r.intent;
  let tone = r.tone;

  if (match) {
    const days = parseInt(match[1], 10);
    if (days >= 1 && days <= 30) {
      bucket = 'SMA-0';
    } else if (days >= 31 && days <= 60) {
      bucket = 'SMA-1';
    } else if (days >= 61 && days <= 90) {
      bucket = 'SMA-2';
    } else if (days > 90) {
      bucket = 'NPA';
    }
  }
  if (rangeMatch) {
    const startDay = parseInt(rangeMatch[1], 10);
    const endDay = parseInt(rangeMatch[2], 10);
    bucket = startDay >= 60 || endDay >= 60 ? 'SMA-2' : startDay >= 30 || endDay >= 30 ? 'SMA-1' : 'SMA-0';
  }

  // 90+ DPD in India are NPAs. Move out of soft-treatment queue and tag as 'NPA: legal / recovery track'
  const is90Plus = (match && parseInt(match[1], 10) > 90) || bucket === 'NPA' || dpdStr.toLowerCase().includes('npa');
  if (is90Plus) {
    bucket = 'NPA';
    human = true; // Moved out of soft-treatment queue to legal / recovery team
    action = 'NPA: legal / recovery track';
    channel = 'Legal / Recovery';
    intent = 'NPA: legal / recovery track';
    tone = 'bad';
  }

  // Thin-file borrowers usually have little or no bureau score
  let segment = r.segment;
  let bureauScore = r.bureauScore;
  let creditScore = r.creditScore;

  if (r.id === 'CASE-3008' || (segment && segment.toLowerCase().includes('thin'))) {
    segment = 'Thin file';
    bureauScore = 'No / limited bureau history';
    creditScore = 'No / limited bureau history';
  } else if (!bureauScore && creditScore) {
    bureauScore = String(creditScore);
  } else if (!bureauScore) {
    bureauScore = r.risk < 30 ? '780 (Bureau)' : r.risk < 70 ? '710 (Bureau)' : '640 (Bureau)';
  }

  // Total loan outstanding (Rs 22 to 42 lakh for housing/LAP books)
  let outstanding = r.outstanding;
  if (!outstanding) {
    if (r.emi >= 5000) {
      outstanding = Math.min(4200000, Math.max(2200000, Math.round((r.emi * 120) / 100000) * 100000));
    } else {
      outstanding = r.emi * 24;
    }
  }

  const priorityScore = r.priorityScore || r.risk || 50;
  const promiseToPay = r.promiseToPay || (is90Plus ? 'Broken' : r.risk >= 75 ? 'Made' : r.risk >= 45 ? 'Kept' : 'Not made');
  const lastContactAttempt = r.lastContactAttempt || (r.human ? 'Today · 09:05' : 'Today · 08:42');
  const lastContactOutcome = r.lastContactOutcome || (is90Plus ? 'Escalated to recovery team' : r.human ? 'Needs officer review' : 'No answer · retry eligible');
  const contactability = r.contactability || (r.human && /unreachable/i.test(r.intent || '') ? 'Unreachable' : 'Reachable');
  const preferredLanguage = r.preferredLanguage || r.lang || (r.code === 'en' ? 'English' : 'English');
  const consentStatus = r.consentStatus || 'On file';
  const doNotContactFlags = r.doNotContactFlags || 'None recorded';
  const displayProduct = String(r.product || '').replace(/^HOME_LOAN$/i, 'Home loan').replace(/_/g, ' ');
  const cityParts = String(r.city || '').split(',').map((part) => part.trim()).filter(Boolean);
  const displayCity = cityParts.length > 1 && cityParts.every((part) => part.toLowerCase() === cityParts[0].toLowerCase())
    ? cityParts[0]
    : cityParts.join(', ');
  const displayChannel = String(channel || '').replace(/^whatsapp$/i, 'WhatsApp');
  const displayDpd = rangeMatch
    ? bucket
    : dpdStr.replace(/^dpd\b/i, 'DPD');
  const displayAction = String(action || '').replace(/^Safety gate:\s*always HITL$/i, 'Human review required');
  const safeAction = !/^field\b/i.test(displayChannel) && /^field visit\b/i.test(displayAction)
    ? `${displayChannel || 'Phone'} follow-up`
    : displayAction;
  const displayIntent = String(intent || '').replace(/^Safety gate:\s*always HITL$/i, 'Human review required');

  return {
    ...r,
    product: displayProduct,
    city: displayCity,
    dpd: displayDpd,
    priorityScore,
    bucket,
    human,
    action: safeAction,
    channel: displayChannel,
    intent: displayIntent,
    tone,
    segment: segment || (r.product && r.product.toLowerCase().includes('salaried') ? 'Salaried' : 'Self-employed'),
    bureauScore,
    creditScore: creditScore || bureauScore,
    outstanding,
    promiseToPay,
    lastContactAttempt,
    lastContactOutcome,
    contactability,
    preferredLanguage,
    consentStatus,
    doNotContactFlags
  };
}

// Dynamic portfolio memory & similar historical case generator.
// Guarantees every case displays historical examples matching that case's EXACT product and city.
export function getCaseMemoryExamples(r, isHFC, isUS) {
  if (r.memoryExamples && r.memoryExamples.length > 0) {
    return r.memoryExamples;
  }

  const rawCity = (r.city || (isUS ? 'Dallas, TX' : 'Mumbai')).split(',')[0].trim();
  const rawProduct = (r.product || (isHFC ? 'Home loan' : 'Personal loan')).trim();

  // City sub-areas for realistic hyperlocal memory
  const LOCALITIES = {
    'Surat': ['Adajan', 'Vesu', 'Pal', 'Katargam'],
    'Pune': ['Wakad', 'Baner', 'Hinjawadi', 'Kothrud'],
    'Lucknow': ['Gomti Nagar', 'Alambagh', 'Indira Nagar', 'Hazratganj'],
    'Hyderabad': ['Ameerpet', 'Banjara Hills', 'Gachibowli', 'Kukatpally'],
    'Madurai': ['KK Nagar', 'Anna Nagar', 'Simmakkal', 'Villapuram'],
    'Chennai': ['Velachery', 'Anna Nagar', 'T. Nagar', 'Porur'],
    'Nagpur': ['Dharampeth', 'Civil Lines', 'Ramdaspeth', 'Manish Nagar'],
    'Jaipur': ['Mansarovar', 'Vaishali Nagar', 'Malviya Nagar', 'Raja Park'],
    'Mumbai': ['Kurla', 'Bandra', 'Andheri East', 'Borivali'],
    'Ahmedabad': ['Vastrapur', 'Navrangpura', 'Satellite', 'Bopal'],
    'Hubballi': ['Vidyanagar', 'Gokul Road', 'Navanagar', 'Keshwapur'],
    'Durgapur': ['City Centre', 'Benachity', 'Bidhannagar', 'Steel Township'],
    'Warangal': ['Hanamkonda', 'Kazipet', 'Subedari', 'Kakatiya'],
    'Kochi': ['Kakkanad', 'Edappally', 'Palarivattom', 'Fort Kochi'],
    'Mangaluru': ['Kadri', 'Bejai', 'Kodialbail', 'Urwa'],
    'Indore': ['Vijay Nagar', 'Palasia', 'Bhawarkua', 'Geeta Bhawan'],
    'Bhopal': ['MP Nagar', 'Arera Colony', 'Kolar Road', 'Hoshangabad Rd'],
    'San Antonio': ['Bexar County', 'Alamo Heights', 'Stone Oak', 'Leon Valley'],
    'Austin': ['Travis County', 'Round Rock', 'South Congress', 'Cedar Park'],
    'Columbus': ['Short North', 'Dublin', 'German Village', 'Bexley'],
    'Atlanta': ['Buckhead', 'Midtown', 'Decatur', 'Sandy Springs'],
    'Phoenix': ['Scottsdale', 'Tempe', 'Mesa', 'Chandler'],
    'Houston': ['Harris County', 'The Woodlands', 'Sugar Land', 'Katy'],
    'Miami': ['Brickell', 'Coral Gables', 'Wynwood', 'Kendall'],
    'Dallas': ['Uptown', 'Plano', 'Oak Lawn', 'Arlington'],
    'Tampa': ['Ybor City', 'Hyde Park', 'Westshore', 'Carrollwood']
  };

  const locs = LOCALITIES[rawCity] || ['North Hub', 'Central Hub', 'Metro Branch'];
  const loc1 = locs[0];
  const loc2 = locs[1] || locs[0];

  // Prefix by product
  let pfx = 'LN';
  const pLower = rawProduct.toLowerCase();
  if (pLower.includes('home') || pLower.includes('pmay')) pfx = 'HL';
  else if (pLower.includes('property') || pLower.includes('lap')) pfx = 'LAP';
  else if (pLower.includes('plot') || pLower.includes('construction')) pfx = 'PC';
  else if (pLower.includes('renovation')) pfx = 'RN';
  else if (pLower.includes('top-up') || pLower.includes('transfer')) pfx = 'BT';
  else if (pLower.includes('auto') || pLower.includes('vehicle')) pfx = 'AL';
  else if (pLower.includes('two-wheeler')) pfx = 'TW';
  else if (pLower.includes('personal')) pfx = 'PL';
  else if (pLower.includes('msme') || pLower.includes('business')) pfx = 'MSME';
  else if (pLower.includes('gold')) pfx = 'GL';
  else if (pLower.includes('microfinance')) pfx = 'MFI';
  else if (pLower.includes('card')) pfx = 'CC';
  else if (pLower.includes('mortgage')) pfx = 'MTG';

  const cCode = rawCity.substring(0, 3).toUpperCase();
  const hash = (rawCity.charCodeAt(0) * 31 + rawProduct.charCodeAt(0) * 17) % 900;
  const id1 = `${pfx}-${cCode}-${1000 + hash}`;
  const id2 = `${pfx}-${cCode}-${1050 + hash}`;

  // Match reason & Action based on product family
  if (pfx === 'HL' || pfx === 'PC' || pfx === 'RN' || pfx === 'BT' || pfx === 'MTG') {
    return [
      {
        id: id1,
        title: `${rawCity} · ${loc1}`,
        product: rawProduct,
        match: 96,
        matchReason: `Similar cash-flow lag & presentation failure on ${rawProduct.toLowerCase()} in ${rawCity}`,
        action: 'Structured split EMI with presentation date shifted to align with inflow cycle',
        outcome: 'Cured in 45 days · 94% cure rate',
        creditLearning: `Adjusted seasonal cash-flow grace buffer in ${rawCity} housing finance policy`,
        statusTone: 'good'
      },
      {
        id: id2,
        title: `${rawCity} · ${loc2}`,
        product: rawProduct,
        match: 92,
        matchReason: `eNACH bounce preceded by 30-day liquidity drawdown in ${loc2}`,
        action: 'Proactive digital reminder with 1-tap payment link and partial payment option',
        outcome: `Account normalized in SMA-0 · ₹${Math.round(r.emi ? r.emi * 1.5 : 28000).toLocaleString('en-IN')} recovered`,
        creditLearning: `Early-warning signal prevented SARFAESI escalation for ${rawCity} portfolio`,
        statusTone: 'good'
      }
    ];
  } else if (pfx === 'LAP') {
    return [
      {
        id: id1,
        title: `${rawCity} · ${loc1}`,
        product: rawProduct,
        match: 98,
        matchReason: `Commercial rental receipt delay with 60+ DPD stress in ${loc1}`,
        action: 'Dedicated hardship manager review & 60-day recovery restructuring plan',
        outcome: 'Full overdue clearance · 91% cure rate',
        creditLearning: `Underwriting refined commercial tenant occupancy appraisal in ${rawCity}`,
        statusTone: 'warn'
      },
      {
        id: id2,
        title: `${rawCity} · ${loc2}`,
        product: rawProduct,
        match: 93,
        matchReason: 'Consecutive mandate bounces and active dispute regarding interest reset',
        action: 'Workout team intervention with verified lease escrow and revised amortization',
        outcome: 'Dispute settled within 14 days · Zero NPA slippage',
        creditLearning: `Updated collateral valuation review cycle from biennial to annual for ${rawCity} LAP`,
        statusTone: 'warn'
      }
    ];
  } else if (pfx === 'MSME') {
    return [
      {
        id: id1,
        title: `${rawCity} · ${loc1}`,
        product: rawProduct,
        match: 97,
        matchReason: 'Quarterly GST turnover contraction (40%) and dual debit bounces',
        action: 'Dedicated business loan officer review with revised working capital milestone',
        outcome: 'Recovered overdue balance across 2 scheduled tranches',
        creditLearning: `Credit policy lowered permissible debt-to-turnover ceiling for wholesale traders in ${rawCity}`,
        statusTone: 'warn'
      },
      {
        id: id2,
        title: `${rawCity} · ${loc2}`,
        product: rawProduct,
        match: 92,
        matchReason: 'Supply chain receivable lag causing technical delay on mandate',
        action: 'Proactive automated reminder with flexible installment split',
        outcome: 'Cured in 30 days · Account restored to Current',
        creditLearning: `Seasonal receivable cycle integrated into ${rawCity} MSME credit scoring`,
        statusTone: 'good'
      }
    ];
  } else {
    return [
      {
        id: id1,
        title: `${rawCity} · ${loc1}`,
        product: rawProduct,
        match: 95,
        matchReason: `Payroll date shift with consecutive debit delays on ${rawProduct.toLowerCase()}`,
        action: 'Multilingual digital reminder with 1-tap instant payment link',
        outcome: 'Full installment paid within 24h · 96% cure rate',
        creditLearning: `Account Aggregator payroll date variance incorporated into ${rawCity} risk tiers`,
        statusTone: 'good'
      },
      {
        id: id2,
        title: `${rawCity} · ${loc2}`,
        product: rawProduct,
        match: 91,
        matchReason: 'Short-term cash buffer drawdown (-25%) prior to billing cycle',
        action: 'Automated courtesy voice nudge with customized grace period',
        outcome: 'Account cured before DPD escalation · Zero penalty applied',
        creditLearning: `Early pre-due nudge reduced 30-day delinquency by 38% in ${rawCity}`,
        statusTone: 'good'
      }
    ];
  }
}

export function marketData(US, prospect, profile) {
  const base = baseData(US, prospect);
  if (!profile || US) return base;
  const p = iciciHfcData(prospect);
  return { ...base, ...p, rows: (p.rows || []).map(normalizeRow), message: (code) => p.message(code, base.message(code)) };
}

function baseData(US, prospect) {
  const R = (US ? ROWS_US : ROWS_IN).map(normalizeRow);
  return {
    rows: R,
    calls: (US ? CALLS_US : CALLS_IN)(prospect),
    feedPool: (US ? FEED_US : FEED_IN).map(([name, city, amt, ptp]) => ({ name, city, amt, ptp: !!ptp || !amt })),
    message: (code) => (US ? MSG_US[code] : MSG_IN[code]),
    messageEn: (code) =>
      US ? MSG_US_EN : code === 'ta' ? MSG_IN_EN.replace('is pending', 'is due soon') : MSG_IN_EN,
    prepared: US ? 2140 : 860,
    flagged: US ? 3480 : 1240,
    hardship: US ? 92 : 38,
    accounts: US ? 18620 : 42300,
    due: US ? 9400000 : 486000000,
    atRisk: US ? 1300000 : 21400000,
    collectedBase: US ? 412000 : 18200000,
    collectedPerSec: US ? 640 : 23500,
    bulkBoost: US ? 38000 : 1400000,
    cure: US ? 61 : 68,
    cureDelta: US ? 11 : 14,
    dailyTarget: US ? 480000 : 20000000,
    manager: US ? { name: 'J. Ortiz', initials: 'JO' } : { name: 'R. Menon', initials: 'RM' },
    teamLead: US ? 'M. Chen' : 'A. Iyer',
    buckets: US
      ? [
        { label: 'Pre-due', sub: 'Current · 0 DPD (due in 10 days)', n: 3480, amt: 1300000 },
        { label: 'SMA-0', sub: '1 to 30 DPD · Special Mention 0', n: 5920, amt: 2400000 },
        { label: 'SMA-1', sub: '31 to 60 DPD · Special Mention 1', n: 1710, amt: 900000 },
        { label: 'SMA-2', sub: '61 to 90 DPD · Special Mention 2', n: 540, amt: 340000 },
        { label: 'NPA', sub: '90+ DPD · Charge-off / Legal track', n: 260, amt: 210000 }
      ]
      : [
        { label: 'Pre-due', sub: 'Current · 0 DPD (due in 10 days)', n: 1240, amt: 21400000 },
        { label: 'SMA-0', sub: '1 to 30 DPD · Special Mention 0', n: 2180, amt: 38900000 },
        { label: 'SMA-1', sub: '31 to 60 DPD · Special Mention 1', n: 640, amt: 15600000 },
        { label: 'SMA-2', sub: '61 to 90 DPD · Special Mention 2', n: 210, amt: 7400000 },
        { label: 'NPA', sub: '90+ DPD · Legal / Recovery track', n: 96, amt: 5100000 }
      ],
    regions: US
      ? [['Texas', 71], ['Florida', 66], ['California', 63], ['Georgia', 58], ['Ohio', 55]]
      : [['Maharashtra', 74], ['Tamil Nadu', 71], ['Karnataka', 66], ['Uttar Pradesh', 61], ['West Bengal', 57]],
    channels: US
      ? [['Text', 41], ['AI voice', 31], ['Email', 14], ['Your agents', 14]]
      : [['WhatsApp', 46], ['AI voice', 28], ['SMS', 12], ['Your callers', 10], ['Field', 4]],
    factors: US
      ? ['Paycheck deposit arrived late', 'Returned payment in the last 60 days', 'Balance trending down']
      : ['Salary credited later than usual', 'Bank balance down over 30 days', 'Part-payments in the last 3 months'],
    altActions: US ? ['Call from your agent', 'Email with pay link', 'Wait 3 days'] : ['Call from your team', 'SMS reminder', 'Field visit'],
    contactHours: US ? '8 am to 9 pm in the borrower’s time zone' : '8 am to 7 pm',
    contactWindow: US ? '8 am to 9 pm local' : '8 am to 7 pm',
    callsDone: US ? 1840 : 2960,
    paidOnCalls: US ? 61000 : 2900000,
    paidOnCallsPerSec: US ? 120 : 4100,
    handedOff: US ? 74 : 112,
    platforms: US ? 'your current collections platform, LOS / LMS (e.g. FinnOne) or in-house system' : 'Credgenics, Spocto, your LOS / LMS (e.g. FinnOne) or other in-house system',
    languages: US ? ['English', 'Spanish'] : ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali'],
    npaLabel: US ? 'Bankruptcy and legal' : 'Legal track (NPA)',
    ladder: US
      ? [['Current, at risk', ['Text', 'Email']], ['1 to 30 DPD', ['Text', 'AI voice', 'Your agent']], ['31 to 60 DPD', ['AI voice', 'Your agent']], ['61 to 90 DPD', ['Your agent']], ['90+ DPD', ['Recovery team']]]
      : [['Pre-due', ['WhatsApp', 'SMS']], ['SMA-0', ['WhatsApp', 'AI voice', 'Your caller']], ['SMA-1', ['AI voice', 'Your caller', 'Field']], ['SMA-2', ['Your caller', 'Field']], ['NPA', ['Legal team']]],
    hfc: false
  };
}

export const TONE = {
  ok: { bg: 'var(--good-soft)', fg: 'var(--good)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
  warn: { bg: 'var(--warn-soft)', fg: 'var(--warn)' },
  bad: { bg: 'var(--bad-soft)', fg: 'var(--bad)' }
};

export const riskColor = (r) => (r >= 75 ? 'var(--bad)' : r >= 55 ? 'var(--warn)' : 'var(--good)');

export const pad = (x) => (x < 10 ? '0' : '') + x;

// Demo clock starts at 09:12 and ticks with the page.
export function clockAt(US, t, startMin = 9 * 60 + 12) {
  const secs = startMin * 60 + t;
  const hh = Math.floor(secs / 3600) % 24, mm = Math.floor((secs % 3600) / 60), ss = secs % 60;
  if (US) {
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return { full: h12 + ':' + pad(mm) + ':' + pad(ss) + (hh >= 12 ? ' PM' : ' AM'), short: h12 + ':' + pad(mm) + (hh >= 12 ? ' PM' : ' AM') };
  }
  return { full: pad(hh) + ':' + pad(mm) + ':' + pad(ss), short: pad(hh) + ':' + pad(mm) };
}

export function timeLabel(US, h, m) {
  if (US) return (h % 12 === 0 ? 12 : h % 12) + ':' + pad(m) + (h >= 12 ? ' PM' : ' AM');
  return pad(h) + ':' + pad(m);
}
