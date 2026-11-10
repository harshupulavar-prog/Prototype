"""
OmniSure Insurance Portal - Backend API Service
Enterprise prototype backend powered by FastAPI
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

app = FastAPI(
    title="OmniSure Insurance Portal Service",
    version="1.9.5",
    description="An end-to-end insurance management application for multi-line policy administration, rapid claims processing, customer portfolios, and automated renewals."
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
        "service": "OmniSure Insurance Portal",
        "version": "1.9.5",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
def health():
    return {"status": "healthy", "prototype": "insurance"}


@app.get("/api/insurance/policies")
def api_insurance_policies():
    return {
        "endpoint": "/api/insurance/policies",
        "prototype": "insurance",
        "status": "success",
        "data": [
            {"id": 1, "name": "Demonstrative Record 001", "created_at": datetime.utcnow().isoformat()},
            {"id": 2, "name": "Demonstrative Record 002", "created_at": datetime.utcnow().isoformat()}
        ]
    }

@app.get("/api/insurance/claims")
def api_insurance_claims():
    return {
        "endpoint": "/api/insurance/claims",
        "prototype": "insurance",
        "status": "success",
        "data": [
            {"id": 1, "name": "Demonstrative Record 001", "created_at": datetime.utcnow().isoformat()},
            {"id": 2, "name": "Demonstrative Record 002", "created_at": datetime.utcnow().isoformat()}
        ]
    }

@app.get("/api/insurance/customers")
def api_insurance_customers():
    return {
        "endpoint": "/api/insurance/customers",
        "prototype": "insurance",
        "status": "success",
        "data": [
            {"id": 1, "name": "Demonstrative Record 001", "created_at": datetime.utcnow().isoformat()},
            {"id": 2, "name": "Demonstrative Record 002", "created_at": datetime.utcnow().isoformat()}
        ]
    }

@app.get("/api/insurance/renewals")
def api_insurance_renewals():
    return {
        "endpoint": "/api/insurance/renewals",
        "prototype": "insurance",
        "status": "success",
        "data": [
            {"id": 1, "name": "Demonstrative Record 001", "created_at": datetime.utcnow().isoformat()},
            {"id": 2, "name": "Demonstrative Record 002", "created_at": datetime.utcnow().isoformat()}
        ]
    }
