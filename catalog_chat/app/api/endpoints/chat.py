from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from app.services.chat_service import manager, save_message
from app.schemas.chat import MessageCreate

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
            await manager.send_personal_message(data, message.receiver_id)
    except WebSocketDisconnect:
        manager.disconnect(user_id)