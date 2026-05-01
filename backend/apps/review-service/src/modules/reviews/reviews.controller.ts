import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('health')
  health() {
    return { ok: true, service: 'review-service' };
  }

  /** POST /reviews — submit a new review (checks eligibility) */
  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.submitReview(dto);
  }

  /** GET /reviews — list reviews, optionally filter by productId */
  @Get()
  findAll(@Query('productId') productId?: string) {
    if (productId) return this.reviewsService.findByProduct(productId);
    return this.reviewsService.findAll();
  }

  /** GET /reviews/eligibility?customerId=...&orderId=... */
  @Get('eligibility')
  checkEligibility(
    @Query('customerId') customerId: string,
    @Query('orderId') orderId: string,
  ) {
    return this.reviewsService.checkEligibility(customerId, orderId);
  }

  /** GET /reviews/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  /** PATCH /reviews/:id */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, dto);
  }
}
