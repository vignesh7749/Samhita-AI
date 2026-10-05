"""
SAMHITA AI - AI Material Search & Enterprise AI Assistant API Router (Section 15, 16, 17)
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.schemas.schemas import AssistantQuestionRequest, AssistantAnswerResponse, NLSearchResponse
from backend.app.services.ai_search_service import AISearchService
from backend.app.services.ai_assistant_service import AIAssistantService

router = APIRouter(tags=["AI Material Search & Enterprise Assistant"])


@router.get("/search/nl", response_model=NLSearchResponse)
def natural_language_search(
    q: str = Query(..., description="Natural language search query (e.g. '10mm stainless steel bolts', 'Show copper cables used by ONGC')"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Intelligent natural language material search grounded in Stage 2 normalization,
    attribute extraction, and cross-CPSE canonical standard catalog groups (Section 15, 16).
    """
    return AISearchService.search_natural_language(db=db, query=q, limit=limit)


@router.post("/assistant/ask", response_model=AssistantAnswerResponse)
def ask_assistant(
    payload: AssistantQuestionRequest,
    db: Session = Depends(get_db)
):
    """
    Enterprise AI Assistant answering questions grounded strictly in live database tables (Section 17).
    Never invents fictional statistics. Returns 'Insufficient data available.' if ungrounded.
    """
    return AIAssistantService.ask(db=db, question=payload.question)
