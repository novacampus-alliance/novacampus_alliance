from fastapi import APIRouter

from app.api.v1.conflicts import router as conflicts_router

api_router = APIRouter()
api_router.include_router(conflicts_router)


@api_router.get("/ping", tags=["test"])
def ping():
    return {"message": "pong"}
