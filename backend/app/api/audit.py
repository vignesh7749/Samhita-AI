from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.models import AuditLog
from backend.app.schemas.schemas import AuditLogItem

router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])

@router.get("", response_model=dict)
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns immutable audit logs detailing every human and AI decision for enterprise compliance.
    """
    query = db.query(AuditLog)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (AuditLog.material_code.ilike(search_filter)) |
            (AuditLog.user_name.ilike(search_filter)) |
            (AuditLog.reason.ilike(search_filter))
        )

    if action and action != "ALL":
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    total = query.count()
    records = query.order_by(desc(AuditLog.timestamp)).offset((page - 1) * page_size).limit(page_size).all()

    items = [
        AuditLogItem(
            id=r.id,
            timestamp=r.timestamp,
            user_name=r.user_name,
            user_role=r.user_role,
            material_code=r.material_code,
            previous_state=r.previous_state,
            new_state=r.new_state,
            action=r.action,
            reason=r.reason
        )
        for r in records
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
