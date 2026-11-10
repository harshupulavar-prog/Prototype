# OmniSure Insurance Portal
> Version 1.9.5 | Category: Insurance

An end-to-end insurance management application for multi-line policy administration, rapid claims processing, customer portfolios, and automated renewals.

## Key Modules & Features
- Gross written premiums & active loss ratio charts
- Multi-line commercial, health & auto policy catalog
- First Notice of Loss (FNOL) claims processing
- Adjuster assignment & document evidence ledger
- Automated renewal quotes & churn risk scoring

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
