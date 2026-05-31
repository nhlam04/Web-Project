from fastapi import APIRouter, HTTPException

router = APIRouter()

def _deprecated():
    raise HTTPException(
        status_code=410,
        detail="Catalog user API deprecated. Use IAM service instead.",
    )

@router.post("/")
def create_user():
    _deprecated()

@router.get("/")
def read_users():
    _deprecated()

@router.get("/{user_id}")
def read_user(user_id: int):
    _deprecated()

@router.put("/{user_id}")
def update_user(user_id: int):
    _deprecated()

@router.delete("/{user_id}")
def delete_user(user_id: int):
    _deprecated()
