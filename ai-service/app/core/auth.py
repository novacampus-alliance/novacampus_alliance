from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.core.config import settings

ALLOWED_ROLES = frozenset({"ADMIN", "DIRECTION", "INSTRUCTOR"})

_bearer = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    sub: str
    email: str
    role: str
    first_name: str = ""
    last_name: str = ""


def _decode_token(token: str) -> AuthUser:
    if not settings.JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="JWT_SECRET non configuré sur le service IA",
        )
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
        ) from exc

    role = payload.get("role")
    if role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux rôles ADMIN, DIRECTION et INSTRUCTOR",
        )

    return AuthUser(
        sub=str(payload.get("sub", "")),
        email=str(payload.get("email", "")),
        role=str(role),
        first_name=str(payload.get("firstName", "")),
        last_name=str(payload.get("lastName", "")),
    )


class AuthContext(BaseModel):
    user: AuthUser
    token: str


def _require_credentials(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> HTTPAuthorizationCredentials:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise",
        )
    return credentials


def require_conflict_agent(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_require_credentials)],
) -> AuthUser:
    return _decode_token(credentials.credentials)


def require_conflict_agent_context(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_require_credentials)],
) -> AuthContext:
    token = credentials.credentials
    return AuthContext(user=_decode_token(token), token=token)
