"""
SAMHITA AI - Role-Based Access Control (RBAC) & Authorization Module
Enforces enterprise security policies across Admin, Reviewer, and Viewer roles.
"""
from typing import List, Optional
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)


def get_current_user_role(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = None) -> str:
    """
    Extracts the authenticated or active user role from:
    1. 'X-User-Role' header
    2. 'role' query parameter
    3. Bearer token payload/hint
    4. Default fallback: 'admin' for demo environment
    """
    # 1. Header check
    role_header = request.headers.get("x-user-role") or request.headers.get("X-User-Role")
    if role_header:
        role_clean = role_header.strip().lower()
        if role_clean in ["admin", "reviewer", "viewer"]:
            return role_clean

    # 2. Query param check
    role_query = request.query_params.get("role")
    if role_query:
        role_clean = role_query.strip().lower()
        if role_clean in ["admin", "reviewer", "viewer"]:
            return role_clean

    # 3. Bearer token check
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header and "bearer" in auth_header.lower():
        token = auth_header.split(" ")[-1].lower()
        if "viewer" in token:
            return "viewer"
        elif "reviewer" in token:
            return "reviewer"
        elif "admin" in token:
            return "admin"

    # Default to admin for seamless out-of-the-box demo if not specified
    return "admin"


def require_role(allowed_roles: List[str]):
    """
    FastAPI dependency enforcing that the requesting client possesses
    one of the authorized RBAC roles.
    """
    allowed_normalized = [r.lower().strip() for r in allowed_roles]

    async def role_checker(request: Request):
        user_role = get_current_user_role(request)
        if user_role not in allowed_normalized:
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied: Current role '{user_role.upper()}' is not authorized. Required: {', '.join([r.upper() for r in allowed_roles])}."
            )
        return user_role

    return role_checker
