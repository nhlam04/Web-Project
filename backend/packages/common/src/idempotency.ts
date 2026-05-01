import { Repository } from 'typeorm';

/**
 * Checks whether a message has already been processed (inbox pattern).
 * Returns true if the message is a duplicate and should be skipped.
 */
export async function isDuplicate(
  repo: Repository<any>,
  consumerName: string,
  messageId: string,
): Promise<boolean> {
  const existing = await repo.findOne({
    where: { consumerName, messageId },
  });
  return !!existing;
}

/**
 * Marks a message as processed in the inbox table.
 */
export async function markProcessed(
  repo: Repository<any>,
  consumerName: string,
  messageId: string,
): Promise<void> {
  await repo.save({ consumerName, messageId });
}
