import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ReviewEligibilityEntity } from '../modules/reviews/entities/review.entity';
import { ReviewRecordEntity } from '../modules/reviews/entities/review-record.entity';
import { ProcessedMessageEntity } from '../modules/inbox/processed-message.entity';
import { OutboxEntity } from '../modules/outbox/outbox.entity';

const isTsNode = __filename.endsWith('.ts');

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_NAME ?? 'review',
  entities: [
    ReviewEligibilityEntity,
    ReviewRecordEntity,
    ProcessedMessageEntity,
    OutboxEntity,
  ],
  migrations: isTsNode
    ? ['apps/review-service/src/database/migrations/*.ts']
    : ['dist/apps/review-service/src/database/migrations/*.js'],
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  logging: true,
});
