from datetime import datetime
from pydantic import BaseModel

class MessageCreate(BaseModel):
    sender_id: str
    receiver_id: str
    content: str

class MessageResponse(MessageCreate):
    id: str
    timestamp: datetime