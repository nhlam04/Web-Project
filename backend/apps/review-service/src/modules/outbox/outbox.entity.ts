import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'outbox' })
export class OutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  eventId!: string;

  @Column()
  eventName!: string;

  @Column()
  aggregateId!: string;

  @Column({ type: 'json' })
  payload: unknown;

  @Column({ default: 'PENDING' })
  status!: string;

  @Column({ type: 'int', default: 0 })
  retries!: number;

  @Column({ type: 'text', nullable: true })
  lastError?: string;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
