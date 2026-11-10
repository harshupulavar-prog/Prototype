"""
DocuSense AI Extraction - Backend API Service
Enterprise prototype backend powered by FastAPI
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

app = FastAPI(
    title="DocuSense AI Extraction Service",
    version="2.0.0",
    description="An intelligent document processing platform for ingestion of invoices, bills of lading, contracts, and IDs with OCR extraction, human-in-the-loop review, and structured API exports."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "DocuSense AI Extraction",
        "version": "2.0.0",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
def health():
    return {"status": "healthy", "prototype": "doc-extraction"}


@app.get("/api/ocr/upload")
def api_ocr_upload():
    return {
        "endpoint": "/api/ocr/upload",
        "prototype": "doc-extraction",
        "status": "success",
        "data": [
            {"id": 1, "name": "Demonstrative Record 001", "created_at": datetime.utcnow().isoformat()},
            {"id": 2, "name": "Demonstrative Record 002", "created_at": datetime.utcnow().isoformat()}
        ]
    }

@app.get("/api/ocr/documents")
def api_ocr_documents():
    return {
        "endpoint": "/api/ocr/documents",
        "prototype": "doc-extraction",
        "status": "success",
        "data": [
            {"id": 1, "name": "Demonstrative Record 001", "created_at": datetime.utcnow().isoformat()},
            {"id": 2, "name": "Demonstrative Record 002", "created_at": datetime.utcnow().isoformat()}
        ]
    }

@app.get("/api/ocr/extract/{doc_id}")
def api_ocr_extract_doc_id():
    return {
        "endpoint": "/api/ocr/extract/{doc_id}",
        "prototype": "doc-extraction",
        "status": "success",
        "data": [
            {"id": 1, "name": "Demonstrative Record 001", "created_at": datetime.utcnow().isoformat()},
            {"id": 2, "name": "Demonstrative Record 002", "created_at": datetime.utcnow().isoformat()}
        ]
    }

@app.get("/api/ocr/review/{doc_id}")
def api_ocr_review_doc_id():
    return {
        "endpoint": "/api/ocr/review/{doc_id}",
        "prototype": "doc-extraction",
        "status": "success",
        "data": [
            {"id": 1, "name": "Demonstrative Record 001", "created_at": datetime.utcnow().isoformat()},
            {"id": 2, "name": "Demonstrative Record 002", "created_at": datetime.utcnow().isoformat()}
        ]
    }
