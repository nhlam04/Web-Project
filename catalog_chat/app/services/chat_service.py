from fastapi import WebSocket
from app.models.chat import MessageModel
from app.schemas.chat import MessageCreate

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, receiver_id: str):
        if receiver_id in self.active_connections:
            for connection in self.active_connections[receiver_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    pass

manager = ConnectionManager()

async def save_message(message: MessageCreate):
    msg_obj = MessageModel(
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        content=message.content
    )
    await msg_obj.save()

async def get_messages(user1_id: str, user2_id: str, limit: int = 50):
    return await MessageModel.get_history(user1_id, user2_id, limit)