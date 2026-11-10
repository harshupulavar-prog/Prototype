# Digital Banking Platform
> Version 2.4.0 | Category: Banking

A comprehensive digital banking platform featuring multi-currency accounts, real-time transaction ledger, beneficiary routing, fund transfers, and corporate treasury dashboards.

## Key Modules & Features
- Corporate treasury & liquidity dashboard
- Multi-currency accounts & IBAN management
- Real-time transaction ledger & categorization
- Instant SEPA & Wire fund transfers
- Audit trail & automated KYC limits

## Architecture
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Python FastAPI REST service
- **Database**: PostgreSQL (or SQLite local)

## Getting Started
### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
