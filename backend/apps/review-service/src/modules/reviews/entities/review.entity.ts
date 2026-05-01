import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Tracks review eligibility: when a fulfillment is completed,
 * the customer becomes eligible to leave a review for that order.
 */
@Entity({ name: 'review_eligibilities' })
export class ReviewEligibilityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fulfillmentId: string;

  @Column()
  orderId: string;

  @Column()
  customerId: string;

  @Column()
  sellerId: string;

  @Column({ default: true })
  isEligible: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}