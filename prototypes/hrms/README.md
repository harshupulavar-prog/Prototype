# Enterprise HRMS Suite
> Version 3.1.2 | Category: Human Resources

An enterprise human resource management system for employee lifecycle administration, automated attendance, global payroll, leave approvals, and recruitment pipelines.

## Key Modules & Features
- Headcount metrics & attrition analysis
- Employee 360 directory & org chart
- Biometric attendance & clock-in tracking
- Leave management & manager approval workflow
- Automated payroll calculation with tax withholdings

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
