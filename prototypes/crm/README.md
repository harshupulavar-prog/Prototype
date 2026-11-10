# DealFlow Enterprise CRM
> Version 4.0.1 | Category: CRM & Sales

A modern customer relationship management application for high-velocity sales pipelines, lead scoring, account relationships, and revenue forecasting.

## Key Modules & Features
- Visual drag-and-drop sales pipeline (Kanban)
- Automated lead capture & AI enrichment scoring
- Company stakeholder mapping & interaction history
- Deal stage gate milestones & contract values
- Weighted pipeline revenue forecasting

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
