import json
import os
import threading
import time

import pika

from app.db.database import SessionLocal
from app.services.product_service import apply_order_completed, apply_order_placed


def start_catalog_consumer():
    if os.getenv("CATALOG_CONSUMER_ENABLED", "true").lower() == "false":
        return

    thread = threading.Thread(target=_run_consumer, daemon=True)
    thread.start()


def _run_consumer():
    rabbitmq_url = os.getenv("RABBITMQ_URL", "amqp://admin:admin123@localhost:5672")
    exchange = os.getenv("RABBITMQ_EXCHANGE", "cnweb.events")
    queue = os.getenv("CATALOG_CONSUMER_QUEUE", "catalog.order_events.q")

    while True:
        try:
            params = pika.URLParameters(rabbitmq_url)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            channel.exchange_declare(exchange=exchange, exchange_type="topic", durable=True)
            channel.queue_declare(queue=queue, durable=True)
            channel.queue_bind(queue=queue, exchange=exchange, routing_key="order.placed")
            channel.queue_bind(queue=queue, exchange=exchange, routing_key="fulfillment.order_completed")

            def callback(ch, method, _properties, body):
                try:
                    event = json.loads(body.decode("utf-8"))
                    payload = event.get("payload") or {}
                    db = SessionLocal()
                    try:
                        if event.get("eventType") == "OrderPlaced":
                            apply_order_placed(db, event["eventId"], payload.get("items", []))
                        elif event.get("eventType") == "OrderCompleted":
                            apply_order_completed(db, event["eventId"], payload.get("items", []))
                    finally:
                        db.close()
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception:
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

            channel.basic_qos(prefetch_count=10)
            channel.basic_consume(queue=queue, on_message_callback=callback)
            channel.start_consuming()
        except Exception:
            time.sleep(5)
