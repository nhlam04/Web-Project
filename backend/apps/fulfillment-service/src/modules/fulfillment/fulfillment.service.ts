import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import { FulfillmentEntity } from './entities/fulfillment.entity';
import { OutboxEntity } from '../outbox/outbox.entity';
import { ProcessedMessageEntity } from '../inbox/processed-message.entity';
import { CreateFulfillmentDto } from './dto/create-fulfillment.dto';
import { UpdateFulfillmentStatusDto } from './dto/update-fulfillment-status.dto';
import {
  FulfillmentStatus,
  ALLOWED_TRANSITIONS,
  ROUTING_KEYS,
} from '../../shared/constants';
import { createEvent } from '@backend/common';
import {
  DeliveryUpdatedPayload,
  DELIVERY_UPDATED_EVENT,
  ORDER_COMPLETED_EVENT,
  OrderCompletedPayload,
  OrderCancelledPayload,
  OrderPlacedPayload,
  SELLER_ORDER_CONFIRMED_EVENT,
  SellerOrderConfirmedPayload,
} from '@backend/contracts';

@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger(FulfillmentService.name);

  constructor(
    @InjectRepository(FulfillmentEntity)
    private readonly fulfillmentRepo: Repository<FulfillmentEntity>,

    @InjectRepository(OutboxEntity)
    private readonly outboxRepo: Repository<OutboxEntity>,

    private readonly dataSource: DataSource,
  ) {}

  /** Create a new fulfillment record from REST or local tests. */
  async create(dto: CreateFulfillmentDto): Promise<FulfillmentEntity> {
    const fulfillment = this.fulfillmentRepo.create({
      orderId: dto.orderId,
      customerId: dto.customerId,
      sellerId: dto.sellerId,
      items: dto.items?.map((item) => ({
        productId: item.productId,
        name: item.name ?? item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? item.price,
        lineTotal:
          item.lineTotal ??
          (item.unitPrice ?? item.price ?? 0) * item.quantity,
      })),
      status: 'PENDING',
    });
    return this.fulfillmentRepo.save(fulfillment);
  }

  async createFromOrderPlaced(
    eventId: string,
    payload: OrderPlacedPayload,
    consumerName: string,
  ): Promise<FulfillmentEntity[]> {
    return this.dataSource.transaction(async (manager) => {
      const processed = await manager.findOne(ProcessedMessageEntity, {
        where: { consumerName, messageId: eventId },
      });
      if (processed) {
        this.logger.warn(`Duplicate OrderPlaced event ${eventId}, skipping`);
        return [];
      }

      const itemsBySeller = new Map<string, OrderPlacedPayload['items']>();
      for (const item of payload.items) {
        const sellerItems = itemsBySeller.get(item.sellerId) ?? [];
        sellerItems.push(item);
        itemsBySeller.set(item.sellerId, sellerItems);
      }

      const fulfillments: FulfillmentEntity[] = [];
      for (const [sellerId, items] of itemsBySeller.entries()) {
        const fulfillment = manager.create(FulfillmentEntity, {
          orderId: payload.orderId,
          customerId: payload.customerId,
          sellerId,
          status: 'PENDING',
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        });
        fulfillments.push(await manager.save(FulfillmentEntity, fulfillment));
      }

      await manager.save(ProcessedMessageEntity, {
        consumerName,
        messageId: eventId,
      });

      return fulfillments;
    });
  }

  async cancelFromOrderCancelled(
    eventId: string,
    payload: OrderCancelledPayload,
    consumerName: string,
  ): Promise<FulfillmentEntity[]> {
    return this.dataSource.transaction(async (manager) => {
      const processed = await manager.findOne(ProcessedMessageEntity, {
        where: { consumerName, messageId: eventId },
      });
      if (processed) {
        this.logger.warn(`Duplicate OrderCancelled event ${eventId}, skipping`);
        return [];
      }

      const fulfillments = await manager.find(FulfillmentEntity, {
        where: { orderId: payload.orderId },
      });
      const cancelled: FulfillmentEntity[] = [];
      const now = new Date();

      for (const fulfillment of fulfillments) {
        const currentStatus = fulfillment.status as FulfillmentStatus;
        if (!ALLOWED_TRANSITIONS[currentStatus]?.includes('CANCELLED')) {
          continue;
        }

        fulfillment.status = 'CANCELLED';
        fulfillment.cancelledAt = now;
        cancelled.push(await manager.save(FulfillmentEntity, fulfillment));
      }

      await manager.save(ProcessedMessageEntity, {
        consumerName,
        messageId: eventId,
      });

      return cancelled;
    });
  }

  /** List all fulfillments */
  async findAll(): Promise<FulfillmentEntity[]> {
    return this.fulfillmentRepo.find({ order: { createdAt: 'DESC' } });
  }

  /** Get single fulfillment */
  async findOne(id: string): Promise<FulfillmentEntity> {
    const entity = await this.fulfillmentRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Fulfillment ${id} not found`);
    return entity;
  }

  /** Get fulfillments by orderId */
  async findByOrder(orderId: string): Promise<FulfillmentEntity[]> {
    return this.fulfillmentRepo.find({ where: { orderId } });
  }

  async findSellerOrders(filters: {
    sellerId?: string;
    status?: FulfillmentStatus;
    page?: number;
    limit?: number;
  }): Promise<{ items: FulfillmentEntity[]; page: number; limit: number }> {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
    const where: FindOptionsWhere<FulfillmentEntity> = {};
    if (filters.sellerId) where.sellerId = filters.sellerId;
    if (filters.status) where.status = filters.status;

    const items = await this.fulfillmentRepo.find({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, page, limit };
  }

  confirmSellerOrder(id: string, sellerId?: string): Promise<FulfillmentEntity> {
    return this.updateStatus(id, { status: 'CONFIRMED' }, sellerId);
  }

  shipSellerOrder(
    id: string,
    dto: { carrier?: string; trackingCode?: string },
    sellerId?: string,
  ): Promise<FulfillmentEntity> {
    return this.updateStatus(
      id,
      { status: 'SHIPPED', carrier: dto.carrier, trackingCode: dto.trackingCode },
      sellerId,
    );
  }

  deliverSellerOrder(
    id: string,
    sellerId?: string,
  ): Promise<FulfillmentEntity> {
    return this.updateStatus(id, { status: 'DELIVERED' }, sellerId);
  }

  completeSellerOrder(
    id: string,
    sellerId?: string,
  ): Promise<FulfillmentEntity> {
    return this.updateStatus(id, { status: 'COMPLETED' }, sellerId);
  }

  /**
   * Update fulfillment status using a transactional outbox pattern.
   * Both the status change and the outbox event are written in a single transaction.
   */
  async updateStatus(
    id: string,
    dto: UpdateFulfillmentStatusDto,
    sellerId?: string,
  ): Promise<FulfillmentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const fulfillment = await manager.findOne(FulfillmentEntity, {
        where: { id },
      });
      if (!fulfillment) {
        throw new NotFoundException(`Fulfillment ${id} not found`);
      }
      if (sellerId && fulfillment.sellerId !== sellerId) {
        throw new BadRequestException('Fulfillment does not belong to seller');
      }

      const currentStatus = fulfillment.status as FulfillmentStatus;
      const newStatus = dto.status;

      // Validate state transition
      if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus)) {
        throw new BadRequestException(
          `Cannot transition from ${currentStatus} to ${newStatus}`,
        );
      }

      const previousStatus = currentStatus;

      // Apply status-specific timestamp updates
      fulfillment.status = newStatus;
      const now = new Date();
      switch (newStatus) {
        case 'CONFIRMED':
          break;
        case 'PACKED':
          fulfillment.packedAt = now;
          break;
        case 'SHIPPED':
          fulfillment.shippedAt = now;
          fulfillment.trackingCode = dto.trackingCode ?? fulfillment.trackingCode;
          fulfillment.carrier = dto.carrier ?? fulfillment.carrier;
          break;
        case 'DELIVERED':
          fulfillment.deliveredAt = now;
          break;
        case 'COMPLETED':
          fulfillment.completedAt = now;
          break;
        case 'CANCELLED':
          fulfillment.cancelledAt = now;
          break;
      }

      await manager.save(FulfillmentEntity, fulfillment);

      // Emit SellerOrderConfirmed when status is CONFIRMED
      if (newStatus === 'CONFIRMED') {
        const confirmedEvent = createEvent<SellerOrderConfirmedPayload>(
          SELLER_ORDER_CONFIRMED_EVENT,
          fulfillment.id,
          {
            fulfillmentId: fulfillment.id,
            orderId: fulfillment.orderId,
            customerId: fulfillment.customerId,
            sellerId: fulfillment.sellerId,
            status: 'CONFIRMED',
            confirmedAt: now.toISOString(),
          },
          { aggregateType: 'Fulfillment', producer: 'fulfillment-service' },
        );
        await manager.save(OutboxEntity, {
          eventId: confirmedEvent.eventId,
          eventName: ROUTING_KEYS.SELLER_ORDER_CONFIRMED,
          aggregateId: confirmedEvent.aggregateId,
          payload: confirmedEvent,
          status: 'PENDING',
        });
      }

      if (newStatus === 'SHIPPED' || newStatus === 'DELIVERED') {
        const deliveryEvent = createEvent<DeliveryUpdatedPayload>(
          DELIVERY_UPDATED_EVENT,
          fulfillment.id,
          {
            fulfillmentId: fulfillment.id,
            orderId: fulfillment.orderId,
            customerId: fulfillment.customerId,
            sellerId: fulfillment.sellerId,
            status: newStatus,
            carrier: fulfillment.carrier,
            trackingCode: fulfillment.trackingCode,
            packedAt: fulfillment.packedAt?.toISOString() ?? null,
            shippedAt: fulfillment.shippedAt?.toISOString() ?? null,
            deliveredAt: fulfillment.deliveredAt?.toISOString() ?? null,
          },
          { aggregateType: 'Fulfillment', producer: 'fulfillment-service' },
        );
        await manager.save(OutboxEntity, {
          eventId: deliveryEvent.eventId,
          eventName: ROUTING_KEYS.DELIVERY_UPDATED,
          aggregateId: deliveryEvent.aggregateId,
          payload: deliveryEvent,
          status: 'PENDING',
        });
      }

      // Emit OrderCompleted when status is COMPLETED
      if (newStatus === 'COMPLETED') {
        const completedEvent = createEvent<OrderCompletedPayload>(
          ORDER_COMPLETED_EVENT,
          fulfillment.id,
          {
            fulfillmentId: fulfillment.id,
            orderId: fulfillment.orderId,
            customerId: fulfillment.customerId,
            sellerId: fulfillment.sellerId,
            completedAt: now.toISOString(),
            items:
              fulfillment.items?.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })) ?? [],
          },
          { aggregateType: 'Fulfillment', producer: 'fulfillment-service' },
        );
        await manager.save(OutboxEntity, {
          eventId: completedEvent.eventId,
          eventName: ROUTING_KEYS.ORDER_COMPLETED,
          aggregateId: completedEvent.aggregateId,
          payload: completedEvent,
          status: 'PENDING',
        });
      }

      this.logger.log(
        `Fulfillment ${id} transitioned ${previousStatus} → ${newStatus}`,
      );
      return fulfillment;
    });
  }
}
