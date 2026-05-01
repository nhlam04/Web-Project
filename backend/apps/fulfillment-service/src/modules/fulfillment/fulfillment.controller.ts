import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { FulfillmentService } from './fulfillment.service';
import { CreateFulfillmentDto } from './dto/create-fulfillment.dto';
import { UpdateFulfillmentStatusDto } from './dto/update-fulfillment-status.dto';

@Controller('fulfillments')
export class FulfillmentController {
  constructor(private readonly fulfillmentService: FulfillmentService) {}

  @Get('health')
  health() {
    return { ok: true, service: 'fulfillment-service' };
  }

  /** POST /fulfillments — create fulfillment (sync REST) */
  @Post()
  create(@Body() dto: CreateFulfillmentDto) {
    return this.fulfillmentService.create(dto);
  }

  /** GET /fulfillments — list all, optionally filter by orderId */
  @Get()
  findAll(@Query('orderId') orderId?: string) {
    if (orderId) return this.fulfillmentService.findByOrder(orderId);
    return this.fulfillmentService.findAll();
  }

  /** GET /fulfillments/:id — single fulfillment */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fulfillmentService.findOne(id);
  }

  /** PATCH /fulfillments/:id/status — update status (triggers outbox events) */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFulfillmentStatusDto,
  ) {
    return this.fulfillmentService.updateStatus(id, dto);
  }
}
