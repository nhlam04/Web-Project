from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from app.services.chat_service import manager, save_message, get_messages, get_chatted_users
from app.schemas.chat import MessageCreate, MessageResponse

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            
            message = MessageCreate(
                sender_id=user_id,
                receiver_id=msg_data["receiver_id"],
                content=msg_data["content"]
            )
            
            await save_message(message)
            
            # Create a response dict including sender_id so receiver knows who sent it
            response_data = {
                "sender_id": user_id,
                "receiver_id": message.receiver_id,
                "content": message.content
            }
            await manager.send_personal_message(json.dumps(response_data), message.receiver_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

@router.get("/history/{user1_id}/{user2_id}", response_model=List[MessageResponse])
async def get_chat_history(user1_id: str, user2_id: str, limit: int = 50):
    """
    Retrieve chat history between two users.
    """
    messages = await get_messages(user1_id, user2_id, limit)
    return messages

@router.get("/users/{user_id}", response_model=List[str])
async def list_chatted_users(user_id: str):
    """
    Retrieve a list of user IDs who have chatted with the given user.
    """
    users = await get_chatted_users(user_id)
    return users