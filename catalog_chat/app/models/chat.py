from datetime import datetime
from app.db.mongo_database import db

class MessageModel:
    def __init__(self, sender_id: str, receiver_id: str, content: str, timestamp: datetime = None):
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.content = content
        self.timestamp = timestamp or datetime.utcnow()

    async def save(self):
        doc = {
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "content": self.content,
            "timestamp": self.timestamp
        }
        result = await db.messages.insert_one(doc)
        return str(result.inserted_id)

    @classmethod
    async def get_history(cls, user1_id: str, user2_id: str, limit: int = 50):
        query = {
            "$or": [
                {"sender_id": user1_id, "receiver_id": user2_id},
                {"sender_id": user2_id, "receiver_id": user1_id}
            ]
        }
        cursor = db.messages.find(query).sort("timestamp", 1).limit(limit)
        messages = await cursor.to_list(length=limit)
        for msg in messages:
            msg["id"] = str(msg.pop("_id"))
        return messages

    @classmethod
    async def get_chatted_users(cls, user_id: str):
        senders = await db.messages.distinct("sender_id", {"receiver_id": user_id})
        receivers = await db.messages.distinct("receiver_id", {"sender_id": user_id})
        users = set(senders + receivers)
        if user_id in users:
            users.remove(user_id)
        return list(users)