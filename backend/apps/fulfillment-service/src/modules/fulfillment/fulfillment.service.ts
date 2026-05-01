import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FulfillmentEntity } from './entities/fulfillment.entity';
import { OutboxEntity } from '../outbox/outbox.entity';
import { CreateFulfillmentDto } from './dto/create-fulfillment.dto';
import { UpdateFulfillmentStatusDto } from './dto/update-fulfillment-status.dto';
import {
  FulfillmentStatus,
  ALLOWED_TRANSITIONS,
  EXCHANGE,
  ROUTING_KEYS,
} from '../../shared/constants';
import { createEvent } from '@backend/common';
import {
  FulfillmentCompletedPayload,
  FulfillmentStatusUpdatedPayload,
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

  /** Create a new fulfillment record (from OrderCreated event or REST) */
  async create(dto: CreateFulfillmentDto): Promise<FulfillmentEntity> {
    const fulfillment = this.fulfillmentRepo.create({
      orderId: dto.orderId,
      customerId: dto.customerId,
      sellerId: dto.sellerId,
      status: 'PENDING',
    });
    return this.fulfillmentRepo.save(fulfillment);
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

  /**
   * Update fulfillment status using a transactional outbox pattern.
   * Both the status change and the outbox event are written in a single transaction.
   */
  async updateStatus(
    id: string,
    dto: UpdateFulfillmentStatusDto,
  ): Promise<FulfillmentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const fulfillment = await manager.findOne(FulfillmentEntity, {
        where: { id },
      });
      if (!fulfillment) {
        throw new NotFoundException(`Fulfillment ${id} not found`);
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

      // --- Write outbox events in the same transaction ---

      // Always emit a status-updated event
      const statusEvent = createEvent<FulfillmentStatusUpdatedPayload>(
        ROUTING_KEYS.FULFILLMENT_STATUS_UPDATED,
        fulfillment.id,
        {
          fulfillmentId: fulfillment.id,
          orderId: fulfillment.orderId,
          customerId: fulfillment.customerId,
          sellerId: fulfillment.sellerId,
          previousStatus,
          newStatus,
          trackingCode: fulfillment.trackingCode,
          carrier: fulfillment.carrier,
          updatedAt: now.toISOString(),
        },
      );
      await manager.save(OutboxEntity, {
        eventId: statusEvent.eventId,
        eventName: statusEvent.eventName,
        aggregateId: statusEvent.aggregateId,
        payload: statusEvent,
        status: 'PENDING',
      });

      // Emit SellerOrderConfirmed when status is CONFIRMED
      if (newStatus === 'CONFIRMED') {
        const confirmedEvent = createEvent<SellerOrderConfirmedPayload>(
          ROUTING_KEYS.SELLER_ORDER_CONFIRMED,
          fulfillment.id,
          {
            fulfillmentId: fulfillment.id,
            orderId: fulfillment.orderId,
            customerId: fulfillment.customerId,
            sellerId: fulfillment.sellerId,
            confirmedAt: now.toISOString(),
          },
        );
        await manager.save(OutboxEntity, {
          eventId: confirmedEvent.eventId,
          eventName: confirmedEvent.eventName,
          aggregateId: confirmedEvent.aggregateId,
          payload: confirmedEvent,
          status: 'PENDING',
        });
      }

      // Emit FulfillmentCompleted when status is COMPLETED
      if (newStatus === 'COMPLETED') {
        const completedEvent = createEvent<FulfillmentCompletedPayload>(
          ROUTING_KEYS.FULFILLMENT_COMPLETED,
          fulfillment.id,
          {
            fulfillmentId: fulfillment.id,
            orderId: fulfillment.orderId,
            customerId: fulfillment.customerId,
            sellerId: fulfillment.sellerId,
            completedAt: now.toISOString(),
          },
        );
        await manager.save(OutboxEntity, {
          eventId: completedEvent.eventId,
          eventName: completedEvent.eventName,
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
