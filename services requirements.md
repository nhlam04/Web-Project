Để các luồng nghiệp vụ chạy bình thường, mỗi service không chỉ cần “có database” mà còn phải chuẩn bị đủ **API đồng bộ**, **event bất đồng bộ**, **bảng outbox/inbox**, **state machine**, **contract chung**, và **cơ chế retry/idempotency**.

Trong hệ thống của bạn, assignment đã định hướng khá rõ: **REST API để xử lý đồng bộ**, **RabbitMQ + outbox pattern để xử lý bất đồng bộ**, và có **Authenticator/API Gateway** đứng phía ngoài.

---

# 1. Mỗi service cần chuẩn bị những gì?

## 1.1. Xác định service sở hữu dữ liệu nào

Mỗi service phải biết rõ:

```text
Tôi sở hữu bảng nào?
Tôi được phép sửa dữ liệu nào?
Tôi chỉ giữ ID tham chiếu logic đến service khác nào?
```

Ví dụ:

|Service|Dữ liệu sở hữu chính|
|---|---|
|Catalog|`products`, `catalog`, tồn kho, sold, rating aggregate|
|Ordering|`carts`, `cart_items`, `orders`, `order_items`|
|Fulfillment|`fulfillments`, trạng thái giao hàng|
|Review|`review_eligibilities`, `reviews`|
|Notification|`notifications`, `notification_preferences`|
|IAM|users, roles, auth|
|Chat|messages|

Điểm quan trọng: **không nên để service này sửa trực tiếp DB của service khác**. Với Fulfillment/Review hiện tại, các field như `orderId`, `customerId`, `sellerId`, `productId`, `fulfillmentId` chỉ là ID tham chiếu logic, không có foreign key vật lý liên service.

---

## 1.2. Chuẩn bị REST API cho command/query cần phản hồi ngay

REST dùng cho các thao tác frontend cần kết quả ngay.

Ví dụ:

```text
Catalog:
GET /products
GET /products/:id

Ordering:
POST /carts/items
POST /orders/checkout
GET /orders/:id

Fulfillment:
PATCH /fulfillments/:id/status

Review:
POST /reviews

Notification:
GET /notifications
PATCH /notifications/:id/read
```

Quy tắc đơn giản:

```text
Frontend cần phản hồi ngay -> REST
Service khác cần biết chuyện gì vừa xảy ra -> RabbitMQ event
```

---

## 1.3. Chuẩn bị event contract chung

Trước khi code RabbitMQ, nhóm nên thống nhất format event.

Ví dụ chuẩn:

```json
{
  "eventId": "uuid",
  "eventType": "OrderPlaced",
  "aggregateId": "orderId",
  "occurredAt": "2026-05-13T10:00:00.000Z",
  "producer": "ordering-service",
  "version": 1,
  "payload": {}
}
```

Tất cả event nên có:

|Field|Ý nghĩa|
|---|---|
|`eventId`|ID duy nhất của event, dùng chống xử lý trùng|
|`eventType`|Tên event|
|`aggregateId`|ID entity chính, ví dụ `orderId`|
|`occurredAt`|Thời điểm phát sinh|
|`producer`|Service phát event|
|`version`|Version contract|
|`payload`|Dữ liệu nghiệp vụ|

---

## 1.4. Chuẩn bị outbox cho service phát event

Service nào phát event thì cần bảng outbox.

Ví dụ Ordering có `ordering.outbox_events` gồm `aggregate_type`, `aggregate_id`, `event_type`, `exchange_name`, `routing_key`, `payload`, `status`, `created_at`, `published_at`.

Ý nghĩa:

```text
Business transaction thành công
-> ghi dữ liệu nghiệp vụ
-> ghi event vào outbox cùng transaction
-> background publisher đọc outbox
-> publish RabbitMQ
-> update outbox thành PUBLISHED
```

Không nên publish RabbitMQ trực tiếp trong lúc tạo order, vì nếu DB commit thành công nhưng RabbitMQ lỗi thì luồng sẽ mất event.

---

## 1.5. Chuẩn bị inbox / processed_messages cho service consume event

Service nào consume event thì cần bảng chống xử lý trùng.

Ví dụ Fulfillment hiện có `processed_messages` với `consumerName`, `messageId`, `processedAt`, có unique constraint `(consumerName, messageId)`. Bảng này dùng làm **Inbox Pattern / idempotency table**, giúp Fulfillment bỏ qua event bị RabbitMQ gửi lại.

Quy tắc consumer:

```text
Nhận event
-> kiểm tra eventId đã xử lý chưa
-> nếu rồi: bỏ qua
-> nếu chưa: xử lý nghiệp vụ trong transaction
-> insert processed_messages / inbox_events
```

---

## 1.6. Chuẩn bị RabbitMQ topology

Tối thiểu nên có:

```text
exchange: cnweb.events
type: topic
durable: true
```

Routing key đề xuất:

```text
order.placed
order.cancelled
fulfillment.seller_confirmed
fulfillment.delivery_updated
fulfillment.order_completed
review.created
chat.message_sent
catalog.product_updated
```

Queue theo service:

```text
fulfillment.order_placed.q
ordering.fulfillment_events.q
catalog.projection.q
review.order_completed.q
notification.domain_events.q
```

Không nên để nhiều service dùng chung một queue. Mỗi service cần queue riêng để cùng nhận được event.

---

## 1.7. Chuẩn bị state machine

Mỗi service phải định nghĩa trạng thái hợp lệ.

Ví dụ Ordering có status đề xuất:

```text
PLACED
SELLER_CONFIRMED
IN_DELIVERY
DELIVERED
COMPLETED
CANCELLED
```

Các status này đã được đề xuất trong thiết kế Ordering.

Nên kiểm soát transition:

```text
PLACED -> SELLER_CONFIRMED
SELLER_CONFIRMED -> IN_DELIVERY
IN_DELIVERY -> DELIVERED
DELIVERED -> COMPLETED
PLACED -> CANCELLED
SELLER_CONFIRMED -> CANCELLED
```

Không cho:

```text
COMPLETED -> CANCELLED
CANCELLED -> IN_DELIVERY
DELIVERED -> PLACED
```

---

# 2. Ví dụ một luồng nghiệp vụ: Checkout tạo đơn hàng

Luồng chọn ví dụ:

```text
User checkout
-> Ordering tạo order
-> Ordering ghi outbox OrderPlaced
-> Outbox publisher publish RabbitMQ
-> Fulfillment consume OrderPlaced
-> Fulfillment tạo fulfillment
```

Ordering hiện có `carts`, `cart_items`, `orders`, `order_items`, `outbox_events`, `inbox_events`, rất phù hợp làm service phát sinh đơn hàng. Fulfillment hiện có `fulfillments`, `processed_messages`, `outbox`; trong đó `fulfillments` lưu `orderId`, `customerId`, `sellerId`, `status`, `trackingCode`, `carrier`, các mốc giao hàng.

---

# 3. Ordering Service cần chuẩn bị gì cho luồng checkout?

## 3.1. API

```text
POST /orders/checkout
```

Request:

```json
{
  "cartId": "cart-uuid",
  "shippingAddress": {
    "fullName": "Nguyen Van A",
    "phone": "0900000000",
    "address": "HCM"
  },
  "paymentMethod": "COD"
}
```

Response:

```json
{
  "orderId": "order-uuid",
  "status": "PLACED"
}
```

---

## 3.2. Event phát ra

```json
{
  "eventId": "event-uuid",
  "eventType": "OrderPlaced",
  "aggregateId": "order-uuid",
  "occurredAt": "2026-05-13T10:00:00.000Z",
  "producer": "ordering-service",
  "version": 1,
  "payload": {
    "orderId": "order-uuid",
    "customerId": "user-id",
    "shippingAddress": {},
    "paymentMethod": "COD",
    "items": [
      {
        "productId": "p1",
        "sellerId": "s1",
        "name": "Product A",
        "quantity": 2,
        "unitPrice": 100000
      }
    ]
  }
}
```

---

# 4. Ví dụ code NestJS cho Ordering Service

Dưới đây là ví dụ tối giản theo hướng **Order Service tạo order + ghi outbox**.

## 4.1. Cấu trúc thư mục

```text
src/
  orders/
    orders.controller.ts
    orders.service.ts
    dto/checkout.dto.ts
    entities/order.entity.ts
    entities/order-item.entity.ts
  carts/
    entities/cart.entity.ts
    entities/cart-item.entity.ts
  outbox/
    outbox-event.entity.ts
    outbox-publisher.service.ts
  messaging/
    rabbitmq.service.ts
  contracts/
    base-event.ts
    order-placed.event.ts
```

---

## 4.2. Event contract

```ts
// src/contracts/base-event.ts
export interface BaseEvent<TPayload> {
  eventId: string;
  eventType: string;
  aggregateId: string;
  occurredAt: string;
  producer: string;
  version: number;
  payload: TPayload;
}
```

```ts
// src/contracts/order-placed.event.ts
export interface OrderPlacedPayload {
  orderId: string;
  customerId: string;
  shippingAddress: Record<string, any>;
  paymentMethod: string;
  currency: string;
  totals: Record<string, any>;
  items: Array<{
    productId: string;
    sellerId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}
```

---

## 4.3. Outbox entity

```ts
// src/outbox/outbox-event.entity.ts
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'outbox_events', schema: 'ordering' })
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'aggregate_type', type: 'text' })
  aggregateType: string;

  @Column({ name: 'aggregate_id', type: 'uuid' })
  aggregateId: string;

  @Column({ name: 'event_type', type: 'text' })
  eventType: string;

  @Column({ name: 'exchange_name', type: 'text', nullable: true })
  exchangeName: string;

  @Column({ name: 'routing_key', type: 'text', nullable: true })
  routingKey: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'text' })
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;
}
```

---

## 4.4. Checkout DTO

```ts
// src/orders/dto/checkout.dto.ts
export class CheckoutDto {
  cartId: string;
  shippingAddress: Record<string, any>;
  paymentMethod: string;
}
```

---

## 4.5. Orders Controller

```ts
// src/orders/orders.controller.ts
import { Body, Controller, Post, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@Req() req: any, @Body() dto: CheckoutDto) {
    const userId = req.user.id;
    return this.ordersService.checkout(userId, dto);
  }
}
```

---

## 4.6. Orders Service: tạo order + ghi outbox cùng transaction

```ts
// src/orders/orders.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { CheckoutDto } from './dto/checkout.dto';
import { OutboxEvent } from '../outbox/outbox-event.entity';
import { BaseEvent } from '../contracts/base-event';
import { OrderPlacedPayload } from '../contracts/order-placed.event';
import { Cart } from '../carts/entities/cart.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrdersService {
  constructor(private readonly dataSource: DataSource) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const orderId = randomUUID();
    const now = new Date();

    await this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: {
          id: dto.cartId,
          userId,
          status: 'ACTIVE',
        },
        relations: ['items'],
      });

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      if (!cart.items || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const totals = this.calculateTotals(cart.items);

      await manager.insert(Order, {
        id: orderId,
        userId,
        cartId: cart.id,
        status: 'PLACED',
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod,
        currency: cart.currency,
        totals,
        history: [
          {
            status: 'PLACED',
            at: now.toISOString(),
          },
        ],
        createdAt: now,
        updatedAt: now,
      });

      for (const item of cart.items) {
        await manager.insert(OrderItem, {
          orderId,
          productId: item.productId,
          sellerId: item.sellerId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: Number(item.quantity) * Number(item.unitPrice),
        });
      }

      await manager.update(
        Cart,
        { id: cart.id },
        {
          status: 'CHECKED_OUT',
          checkedOutAt: now,
          updatedAt: now,
        },
      );

      const event: BaseEvent<OrderPlacedPayload> = {
        eventId: randomUUID(),
        eventType: 'OrderPlaced',
        aggregateId: orderId,
        occurredAt: now.toISOString(),
        producer: 'ordering-service',
        version: 1,
        payload: {
          orderId,
          customerId: userId,
          shippingAddress: dto.shippingAddress,
          paymentMethod: dto.paymentMethod,
          currency: cart.currency,
          totals,
          items: cart.items.map((item) => ({
            productId: item.productId,
            sellerId: item.sellerId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
          })),
        },
      };

      await manager.insert(OutboxEvent, {
        aggregateType: 'Order',
        aggregateId: orderId,
        eventType: 'OrderPlaced',
        exchangeName: 'cnweb.events',
        routingKey: 'order.placed',
        payload: event,
        status: 'PENDING',
        createdAt: now,
        publishedAt: null,
      });
    });

    return {
      orderId,
      status: 'PLACED',
    };
  }

  private calculateTotals(items: any[]) {
    const subtotal = items.reduce((sum, item) => {
      return sum + Number(item.quantity) * Number(item.unitPrice);
    }, 0);

    const totalQuantity = items.reduce((sum, item) => {
      return sum + Number(item.quantity);
    }, 0);

    return {
      subtotal,
      totalQuantity,
      total: subtotal,
    };
  }
}
```

Điểm quan trọng trong đoạn trên là:

```text
Tạo order
+ tạo order_items
+ update cart CHECKED_OUT
+ insert outbox OrderPlaced
```

Tất cả nằm trong **một transaction**. Nếu một bước lỗi, toàn bộ rollback.

---

## 4.7. Outbox Publisher

```ts
// src/outbox/outbox-publisher.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent } from './outbox-event.entity';
import { RabbitmqService } from '../messaging/rabbitmq.service';

@Injectable()
export class OutboxPublisherService {
  private readonly logger = new Logger(OutboxPublisherService.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async publishPendingEvents() {
    const events = await this.outboxRepo.find({
      where: { status: 'PENDING' },
      order: { createdAt: 'ASC' },
      take: 20,
    });

    for (const event of events) {
      try {
        await this.rabbitmqService.publish(
          event.exchangeName,
          event.routingKey,
          event.payload,
        );

        await this.outboxRepo.update(event.id, {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        });

        this.logger.log(`Published event ${event.eventType} - ${event.id}`);
      } catch (error) {
        this.logger.error(`Publish failed ${event.id}`, error);

        await this.outboxRepo.update(event.id, {
          status: 'FAILED',
        });
      }
    }
  }
}
```

Với bản demo, `FAILED` là đủ. Bản tốt hơn nên có thêm:

```text
retries
lastError
nextRetryAt
```

Fulfillment/Review hiện đã có outbox gồm `eventId`, `eventName`, `aggregateId`, `payload`, `status`, `retries`, `lastError`, `publishedAt`, nên có thể làm retry tốt hơn.

---

# 5. Fulfillment cần làm gì để nhận được OrderPlaced?

Ở phía Fulfillment, cần consumer `order.placed`.

Logic tối thiểu:

```ts
async handleOrderPlaced(event: BaseEvent<OrderPlacedPayload>) {
  const consumerName = 'fulfillment.order-placed-consumer';

  await this.dataSource.transaction(async (manager) => {
    const existed = await manager.findOne(ProcessedMessage, {
      where: {
        consumerName,
        messageId: event.eventId,
      },
    });

    if (existed) {
      return;
    }

    for (const item of event.payload.items) {
      await manager.insert(Fulfillment, {
        orderId: event.payload.orderId,
        customerId: event.payload.customerId,
        sellerId: item.sellerId,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await manager.insert(ProcessedMessage, {
      consumerName,
      messageId: event.eventId,
      processedAt: new Date(),
    });
  });
}
```

Fulfillment có bảng `processed_messages` chính là để xử lý trường hợp RabbitMQ gửi lại cùng một event, tránh tạo trùng fulfillment.

---

# 6. Tóm lại checklist cho từng service

## Ordering Service

Cần chuẩn bị:

```text
REST:
- POST /orders/checkout
- POST /orders/:id/cancel
- GET /orders/:id

DB:
- carts
- cart_items
- orders
- order_items
- outbox_events
- inbox_events

Produce events:
- OrderPlaced
- OrderCancelled

Consume events:
- SellerOrderConfirmed
- DeliveryUpdated
- OrderCompleted

Logic:
- state transition của order
- transaction tạo order + outbox
- idempotency khi consume fulfillment event
```

---

## Fulfillment Service

Cần chuẩn bị:

```text
REST:
- PATCH /fulfillments/:id/confirm
- PATCH /fulfillments/:id/ship
- PATCH /fulfillments/:id/deliver
- PATCH /fulfillments/:id/complete

DB:
- fulfillments
- processed_messages
- outbox

Consume events:
- OrderPlaced
- OrderCancelled

Produce events:
- SellerOrderConfirmed
- DeliveryUpdated
- OrderCompleted

Logic:
- chống consume trùng
- cập nhật trạng thái giao hàng
- phát event ngược lại cho Ordering/Review/Notification/Catalog
```

---

## Catalog Service

Cần chuẩn bị:

```text
REST:
- GET /products
- GET /products/:id
- POST /products
- PATCH /products/:id

DB:
- catalog
- products

Consume events:
- OrderPlaced
- OrderCancelled
- OrderCompleted
- ReviewCreated

Logic:
- giảm quantity
- hoàn quantity
- tăng sold
- cập nhật StarCount, totalComments, totalRates, ranking
```

---

## Review Service

Cần chuẩn bị:

```text
REST:
- POST /reviews
- GET /products/:id/reviews

DB:
- review_eligibilities
- reviews
- processed_messages
- outbox

Consume events:
- OrderCompleted

Produce events:
- ReviewCreated
  hoặc CommentCreated / RatingCreated

Logic:
- chỉ cho review nếu có eligibility
- chống review trùng
- phát event để Catalog cập nhật rating
```

Review hiện có `review_eligibilities` để ghi nhận quyền review sau khi Fulfillment hoàn tất, và `reviews` để lưu `productId`, `customerId`, `orderId`, `fulfillmentId`, `rating`, `comment`.

---

## Notification Service

Cần chuẩn bị:

```text
REST:
- GET /notifications
- PATCH /notifications/:id/read

DB:
- notifications
- notification_preferences
- inbox_events
- outbox_events

Consume events:
- OrderPlaced
- OrderCancelled
- SellerOrderConfirmed
- DeliveryUpdated
- OrderCompleted
- ReviewCreated
- MessageSent

Logic:
- chống gửi trùng
- template thông báo
- trạng thái PENDING / SENT / FAILED
```

Notification DB hiện có `notifications`, `notification_preferences`, `inbox_events`, `outbox_events`, trong đó `notifications` lưu `user_id`, `event_name`, `title`, `body`, `channel`, `status`, `payload`, `delivery_attempts`, `sent_at`, `read_at`.

---

# 7. Kết luận thực tế cho nhóm bạn

Để chạy được luồng nghiệp vụ bình thường, mỗi service cần chuẩn bị theo mẫu này:

```text
1. REST API cho thao tác trực tiếp từ frontend
2. DB tables cho nghiệp vụ chính
3. Outbox nếu service phát event
4. Inbox / processed_messages nếu service consume event
5. Event contract chung
6. RabbitMQ exchange, routing key, queue
7. State machine hợp lệ
8. Transaction boundary rõ ràng
9. Retry + idempotency
10. Log để debug luồng end-to-end
```

Với MVP, nên implement đầu tiên luồng:

```text
POST /orders/checkout
-> Ordering ghi orders + order_items + outbox OrderPlaced
-> Outbox publisher publish order.placed
-> Fulfillment consume order.placed
-> Fulfillment tạo fulfillments
```

Khi luồng này chạy ổn, các luồng sau như `SellerOrderConfirmed`, `DeliveryUpdated`, `OrderCompleted`, `ReviewCreated`, `Notification` sẽ chỉ là mở rộng cùng một pattern.