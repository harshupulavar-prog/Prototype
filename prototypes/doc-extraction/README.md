# DocuSense AI Extraction
> Version 2.0.0 | Category: Document Extraction

An intelligent document processing platform for ingestion of invoices, bills of lading, contracts, and IDs with OCR extraction, human-in-the-loop review, and structured API exports.

## Key Modules & Features
- Multi-file PDF & image batch ingestion
- Automated document classification (Invoices, Receipts, Contracts)
- Bounding-box OCR field extraction & confidence scores
- Human-in-the-loop review queue for low-confidence data
- Structured JSON webhooks & ERP connectors

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
