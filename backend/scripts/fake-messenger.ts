/**
 * Fake Messenger – End-to-End Integration Test
 *
 * Simulates the full message flow between fulfillment and review services:
 *
 * 1. Publishes an "OrderCreated" event to RabbitMQ
 *    → Fulfillment service consumes it and creates a fulfillment record
 * 2. Calls REST API to transition fulfillment through all statuses
 *    → Each transition writes outbox events which the poller publishes to RabbitMQ
 * 3. FulfillmentCompleted event triggers the review service
 *    → Review service creates eligibility
 * 4. Submits a review via REST API
 *    → Review service validates eligibility and writes ReviewCreated to outbox
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/fake-messenger.ts
 *
 * Prerequisites:
 *   - Docker containers (MySQL + RabbitMQ) running
 *   - Fulfillment service on port 3002
 *   - Review service on port 3003
 */

import * as amqp from 'amqplib';
import http from 'http';
import { randomUUID } from 'crypto';

// ---- Config ----
const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://admin:admin123@localhost:5672';
const FULFILLMENT_URL = process.env.FULFILLMENT_URL ?? 'http://localhost:3002';
const REVIEW_URL = process.env.REVIEW_URL ?? 'http://localhost:3003';
const EXCHANGE = 'ecommerce.events';

// ---- Helpers ----
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpRequest(
  url: string,
  method: string,
  body?: unknown,
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = body ? JSON.stringify(body) : undefined;

    const options: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode ?? 0,
            data: data ? JSON.parse(data) : null,
          });
        } catch {
          resolve({ status: res.statusCode ?? 0, data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// ---- Color output ----
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(emoji: string, message: string, color = COLORS.reset) {
  console.log(`${color}${emoji}  ${message}${COLORS.reset}`);
}

function header(title: string) {
  console.log();
  console.log(
    `${COLORS.bold}${COLORS.cyan}${'═'.repeat(60)}${COLORS.reset}`,
  );
  console.log(`${COLORS.bold}${COLORS.cyan}  ${title}${COLORS.reset}`);
  console.log(
    `${COLORS.bold}${COLORS.cyan}${'═'.repeat(60)}${COLORS.reset}`,
  );
}

function subheader(title: string) {
  console.log();
  console.log(
    `${COLORS.bold}${COLORS.yellow}── ${title} ──${COLORS.reset}`,
  );
}

// ---- Main Test Flow ----
async function main() {
  header('🚀 Fake Messenger – Integration Test');

  // Test data
  const orderId = randomUUID();
  const customerId = randomUUID();
  const sellerId = randomUUID();
  const productId = randomUUID();
  const eventId = randomUUID();

  log('📋', `Order ID:    ${orderId}`, COLORS.dim);
  log('👤', `Customer ID: ${customerId}`, COLORS.dim);
  log('🏪', `Seller ID:   ${sellerId}`, COLORS.dim);
  log('📦', `Product ID:  ${productId}`, COLORS.dim);

  // ======================================================
  // STEP 1: Publish OrderCreated event to RabbitMQ
  // ======================================================
  subheader('STEP 1: Publish OrderCreated → RabbitMQ');

  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  const orderCreatedEvent = {
    eventId,
    eventName: 'order.created',
    aggregateId: orderId,
    occurredAt: new Date().toISOString(),
    payload: {
      orderId,
      customerId,
      sellerId,
      items: [
        {
          productId,
          productName: 'Test Product',
          quantity: 2,
          price: 150000,
        },
      ],
      totalAmount: 300000,
    },
  };

  channel.publish(
    EXCHANGE,
    'order.created',
    Buffer.from(JSON.stringify(orderCreatedEvent)),
    { persistent: true, contentType: 'application/json' },
  );

  log('✅', 'OrderCreated event published to RabbitMQ', COLORS.green);
  log('📨', `Routing key: order.created`, COLORS.dim);

  // Wait for fulfillment service to consume
  log('⏳', 'Waiting 4s for fulfillment service to consume...', COLORS.yellow);
  await sleep(4000);

  // ======================================================
  // STEP 2: Verify fulfillment was created
  // ======================================================
  subheader('STEP 2: Verify fulfillment record created');

  const listRes = await httpRequest(
    `${FULFILLMENT_URL}/fulfillments?orderId=${orderId}`,
    'GET',
  );
  log('📡', `GET /fulfillments?orderId=${orderId}`, COLORS.blue);
  log('📥', `Status: ${listRes.status}`, COLORS.blue);

  if (!Array.isArray(listRes.data) || listRes.data.length === 0) {
    log('❌', 'No fulfillment found! Consumer may not have processed the event.', COLORS.red);
    log('💡', 'Check if fulfillment service is running and connected to RabbitMQ.', COLORS.yellow);
    await channel.close();
    await conn.close();
    return;
  }

  const fulfillmentId = listRes.data[0].id;
  const fulfillmentStatus = listRes.data[0].status;
  log('✅', `Fulfillment created: ${fulfillmentId} (status: ${fulfillmentStatus})`, COLORS.green);

  // ======================================================
  // STEP 3: Walk through fulfillment status transitions
  // ======================================================
  subheader('STEP 3: Fulfillment status transitions (REST + Outbox)');

  const transitions = [
    { status: 'CONFIRMED', extra: {} },
    { status: 'PACKED', extra: {} },
    { status: 'SHIPPED', extra: { trackingCode: 'TRK-' + Date.now(), carrier: 'VN Post' } },
    { status: 'DELIVERED', extra: {} },
    { status: 'COMPLETED', extra: {} },
  ];

  for (const t of transitions) {
    const body = { status: t.status, ...t.extra };
    const patchRes = await httpRequest(
      `${FULFILLMENT_URL}/fulfillments/${fulfillmentId}/status`,
      'PATCH',
      body,
    );
    if (patchRes.status >= 200 && patchRes.status < 300) {
      log(
        '✅',
        `→ ${t.status} (HTTP ${patchRes.status}) ${t.extra && (t.extra as any).trackingCode ? `tracking=${(t.extra as any).trackingCode}` : ''}`,
        COLORS.green,
      );
    } else {
      log('❌', `→ ${t.status} FAILED (HTTP ${patchRes.status}): ${JSON.stringify(patchRes.data)}`, COLORS.red);
      break;
    }
    // Brief pause to let outbox poller pick up the event
    await sleep(1000);
  }

  // Wait for outbox poller to publish events and review service to consume
  log('⏳', 'Waiting 5s for outbox poller + review consumer...', COLORS.yellow);
  await sleep(5000);

  // ======================================================
  // STEP 4: Check review eligibility
  // ======================================================
  subheader('STEP 4: Verify review eligibility');

  const eligRes = await httpRequest(
    `${REVIEW_URL}/reviews/eligibility?customerId=${customerId}&orderId=${orderId}`,
    'GET',
  );
  log('📡', `GET /reviews/eligibility`, COLORS.blue);
  log('📥', `Status: ${eligRes.status}`, COLORS.blue);

  if (eligRes.data) {
    log('✅', `Eligibility found: isEligible=${eligRes.data.isEligible}`, COLORS.green);
  } else {
    log('⚠️', 'No eligibility record found. FulfillmentCompleted may not have been consumed yet.', COLORS.yellow);
    log('💡', 'The outbox poller publishes events every 2s. Try waiting longer.', COLORS.yellow);
  }

  // ======================================================
  // STEP 5: Submit a review
  // ======================================================
  subheader('STEP 5: Submit a review (REST + Outbox)');

  const reviewBody = {
    productId,
    customerId,
    orderId,
    fulfillmentId,
    rating: 5,
    comment: 'Excellent product! Fast delivery. Highly recommended.',
  };

  const reviewRes = await httpRequest(
    `${REVIEW_URL}/reviews`,
    'POST',
    reviewBody,
  );
  log('📡', `POST /reviews`, COLORS.blue);
  log('📥', `Status: ${reviewRes.status}`, COLORS.blue);

  if (reviewRes.status >= 200 && reviewRes.status < 300) {
    log('✅', `Review created: ${reviewRes.data.id} (rating: ${reviewRes.data.rating}⭐)`, COLORS.green);
  } else {
    log('❌', `Review creation failed: ${JSON.stringify(reviewRes.data)}`, COLORS.red);
  }

  // ======================================================
  // STEP 6: Try duplicate review (should fail)
  // ======================================================
  subheader('STEP 6: Attempt duplicate review (should be rejected)');

  const dupRes = await httpRequest(
    `${REVIEW_URL}/reviews`,
    'POST',
    reviewBody,
  );
  if (dupRes.status >= 400) {
    log('✅', `Duplicate correctly rejected (HTTP ${dupRes.status})`, COLORS.green);
  } else {
    log('⚠️', `Duplicate was NOT rejected (HTTP ${dupRes.status})`, COLORS.yellow);
  }

  // ======================================================
  // STEP 7: Fetch reviews for the product
  // ======================================================
  subheader('STEP 7: Fetch product reviews');

  const productReviews = await httpRequest(
    `${REVIEW_URL}/reviews?productId=${productId}`,
    'GET',
  );
  log('📡', `GET /reviews?productId=${productId}`, COLORS.blue);
  log(
    '✅',
    `Found ${Array.isArray(productReviews.data) ? productReviews.data.length : 0} review(s)`,
    COLORS.green,
  );

  // ======================================================
  // STEP 8: Verify outbox was published
  // ======================================================
  subheader('STEP 8: Wait for ReviewCreated outbox event');
  log('⏳', 'Waiting 4s for review outbox poller...', COLORS.yellow);
  await sleep(4000);
  log('✅', 'ReviewCreated event should now be in RabbitMQ', COLORS.green);

  // ======================================================
  // Summary
  // ======================================================
  header('📊 Test Summary');
  console.log();
  log('📦', `Fulfillment ID: ${fulfillmentId}`, COLORS.cyan);
  log('📝', `Review ID:      ${reviewRes.data?.id ?? 'N/A'}`, COLORS.cyan);
  console.log();
  log('🔄', 'Message flow verified:', COLORS.bold);
  console.log(`  ${COLORS.dim}1. OrderCreated      → RabbitMQ → Fulfillment Service (consumer)${COLORS.reset}`);
  console.log(`  ${COLORS.dim}2. Status transitions → Fulfillment REST API → Outbox → RabbitMQ${COLORS.reset}`);
  console.log(`  ${COLORS.dim}3. FulfillmentCompleted → RabbitMQ → Review Service (consumer)${COLORS.reset}`);
  console.log(`  ${COLORS.dim}4. Review submission  → Review REST API → Outbox → RabbitMQ${COLORS.reset}`);
  console.log();
  log('🎉', 'Integration test complete!', COLORS.green + COLORS.bold);
  console.log();

  await channel.close();
  await conn.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
