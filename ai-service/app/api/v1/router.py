from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/ping", tags=["test"])
def ping():
    return {"message": "pong"}
