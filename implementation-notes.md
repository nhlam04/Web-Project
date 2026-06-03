# Implementation Notes

## Decisions made outside the specs

- Standardized RabbitMQ exchange to `cnweb.events` in Ordering, Fulfillment, Catalog, and Notification. Some existing code used `ecommerce.events`.
- Standardized MVP routing keys to `order.placed`, `order.cancelled`, `fulfillment.seller_order_confirmed`, `fulfillment.delivery_updated`, and `fulfillment.order_completed`.
- Kept Ordering and Notification on Postgres because their existing implementation already used `pg`. Kept IAM, Catalog, and Fulfillment on MySQL because their existing code already used MySQL/TypeORM.
- Used TypeORM `synchronize=true` only for local Docker Fulfillment startup. This avoids requiring a migration step in the runbook, but it should not be used in production.
- Added Catalog bootstrap seed data so the frontend can browse and add products immediately after `docker compose up`.
- Added Catalog RabbitMQ consumer for `OrderPlaced` and `OrderCompleted` projections. It updates `quantity` and `sold` with an idempotency table named `catalog_processed_events`.
- Added `/api/ordering`, `/api/catalog`, `/api/auth`, `/api/fulfillment`, and `/api/notification` routes to the root nginx gateway so the Docker frontend can call APIs through one origin.
- Left IAM as a direct Express service instead of moving it into NestJS. The task goal was service/API alignment and local orchestration, not a full framework rewrite.

## Tradeoffs

- Multi-seller orders are grouped into multiple Fulfillment records, but Ordering still maps fulfillment events directly to the order status. This is acceptable for MVP but incomplete for production multi-seller completion rules.
- Checkout does not implement `Idempotency-Key`; repeated checkout on the same active cart is blocked because the cart is marked `CHECKED_OUT`.
- Catalog stock is updated asynchronously from `OrderPlaced`; checkout does not reserve stock synchronously.
- Review service was not wired into the frontend MVP flow because the basic flow priorities focus on login, catalog, cart, checkout, fulfillment, notification, and catalog projection.
- Frontend auth tokens are stored in `localStorage` for the local MVP pages. This keeps the React integration simple but should be replaced with a more defensive session strategy before production.
- The order and notification pages keep editable `userId` fields because local demo flows create data for fixed IDs and backend auth is optional in Docker.
- IAM account type is represented by the existing `users.role` column. Public registration accepts only `CUSTOMER` and `SELLER`; existing `USER` rows are normalized to `CUSTOMER` at IAM startup.
- Seller frontend pages now use the logged-in seller IAM `userId` as `sellerId`. Seeded catalog/demo products still use fixed seller IDs such as `seller-001`, so seller fulfillment visibility depends on product seller IDs matching IAM user IDs.
- Remaining business-flow completion will be handled in phases so each stable slice can be built, documented, and verified before moving to the next dependency.
- Review service is now wired into local Docker and the gateway for API/manual verification. Review UI is still pending.
- Adminer is included in Docker compose as a local database GUI on port `8081`.

## Notable fixes

- Fixed IAM startup hazards caused by using `setAuditPool` before importing it and by importing/redeclaring `validatePassword`.
- Added `/api/v1/orders/checkout` while preserving the existing `/api/v1/orders` create endpoint.
- Changed Ordering outbox messages to publish the shared event envelope directly.
- Bound Fulfillment's `fulfillment.order_placed.q` queue to `order.placed`.
- Added frontend pages for auth, user order list/detail/cancel, seller fulfillment transitions, notification list/read, and fulfillment tracking.
- Added frontend build arguments for auth, fulfillment, and notification base URLs so Docker builds use the gateway-relative API paths.
- Added Customer/Seller selection to registration, persisted IAM role, included role in `/me`, and propagated role through internal token verification clients.
- Updated cart and checkout user ownership to use the logged-in IAM user when present instead of always using the demo user.
- Improved frontend layout with a shared navigation shell based on common web app layout patterns: persistent primary navigation, active route state, breadcrumbs, page-level actions, account status, and a compact travel panel.
- Wrapped catalog browse/detail pages in the shared shell so shopping, account, orders, seller fulfillment, and notifications have one consistent navigation model.
- Added a minimal frontend design system with reusable Button, Card, Badge, Input, Select, Skeleton, EmptyState, ErrorState, Toast, OrderStatusBadge, ProductCard, and formatter helpers.
- Replaced duplicated product card, loading, empty, status badge, button, and form-control UI in product list, catalog product list, order, seller, notification, and fulfillment tracking pages where this did not change API behavior.
- Kept existing route paths and backend API calls unchanged during the design-system pass.
- Preserved the existing `formatVnd` export by delegating it to the shared `formatPrice` helper, so older page imports keep working.
- Polished `PageShell` so it owns persistent top navigation, route-group active state, compact breadcrumbs, account/login/logout controls, responsive behavior, and a cart drawer entry point for product-related routes.
- Wrapped the landing page in compact `PageShell` mode and hid its older standalone header to keep one consistent navigation model across customer pages.
- Kept the cart drawer on existing Ordering cart and checkout APIs; no backend contract or route path changed.
- Centralized frontend cart state in `CartProvider` and moved cart rendering into a shared `CartDrawer`.
- Product add-to-cart actions on landing, product list, product detail, and catalog product list now update the shared cart state and shared feedback messages.
- The shared cart checkout path still delegates to the existing `checkoutCart` helper and Ordering checkout endpoint.
- Refactored the landing page to use gateway-relative Catalog APIs for category and featured product data instead of hardcoded product data.
- Fixed landing page mojibake by replacing customer-facing copy with readable Vietnamese text.
- Wired landing page CTAs to existing routes and shared cart behavior without adding backend API requirements.
- Polished customer order pages so logged-in users see their own orders by default, while guest/local demo mode keeps a small editable demo user ID fallback.
- Order detail now separates summary, status, created date, items, fulfillment tracking, and cancellation; the cancel action only renders for statuses accepted by the existing cancel API.
- Polished seller fulfillment as an operational dashboard with status KPI cards and an action-oriented table.
- Seller next actions are derived strictly from the current fulfillment status, with terminal statuses rendering no active action.
- Added a shared frontend page width system with CSS variables for content max width, readable width, responsive page padding, and section spacing.
- Updated `PageShell` to provide full-width backgrounds with centered inner content, flex-based page height, and an opt-in full-bleed mode for landing-style pages.
- Tightened shared product grid/card layout so cards stretch to equal height and actions align consistently at the bottom.
- Removed nested page-level max-width/padding from high-traffic catalog pages where the shared shell should own content alignment.
- Added `AuthProvider` / `useAuth` so the frontend has one role-aware source of truth for current IAM user state.
- Added `RequireAuth`, `RequireRole`, and `GuestOnly` route guards without changing route paths.
- Generated `PageShell` navigation from role capabilities so guests, customers, and sellers only see relevant entry points.
- Hid customer purchase actions for guests and sellers. Guests get login/register prompts; sellers can inspect catalog data without cart or checkout controls.
- Restricted `CartProvider` so it does not create or fetch carts unless the active role is `CUSTOMER`.
- Standardized visible frontend copy and fallback system messages to Vietnamese with accents across shared UI, auth, cart, catalog, ordering, seller fulfillment, notifications, landing page, chat widget, and frontend API helpers.
- Replaced leftover mojibake in frontend files that previously rendered broken Vietnamese text.
- Repaired the landing/shared shell font stack with `"Inter", "Segoe UI", Arial, sans-serif` and normalized customer, seller, admin, and chat UI copy to UTF-8 Vietnamese text.
- Added `review-service` to Docker compose and exposed it through the gateway at `/api/reviews` and `/api/reviews/`.
- Enabled review-service local TypeORM synchronization through `TYPEORM_SYNCHRONIZE=true` in Docker so the local `review` database creates `reviews`, `review_eligibilities`, `processed_messages`, and `outbox` tables automatically.
- Bound the review service `review.order_completed.q` consumer to the shared `fulfillment.order_completed` routing key so completed fulfillment events can create review eligibility records.
- Added frontend review listing on product detail and eligible review submission on order detail using the existing Review API contracts.
- Added Catalog projection handling for `review.created` so product rating fields update after a review is submitted.
- Extended `OrderCancelled` payloads with order items so downstream services can reverse item-level projections without changing Ordering API paths.
- Added Catalog handling for `order.cancelled` to restore product quantity.
- Added Fulfillment handling for `order.cancelled` to cancel pending/confirmed/packed fulfillments where the local state machine allows `CANCELLED`.
- Added shared cart drawer quantity stepper and remove action backed by existing Ordering cart item update/delete APIs.
- Added Ordering checkout validation against Catalog product availability and current price before order creation.
- Added `adminer` service to Docker compose for local MySQL/PostgreSQL inspection without changing application services.
- Imported catalog `users` into IAM as the source of truth, added `iam.user_profiles` for legacy fields, and linked catalog users via `iamUserId`.
- Locked imported catalog users by setting a placeholder password hash and a far-future `locked_until` to prevent login until reset.
- Deprecated catalog `/users` API (HTTP 410) so IAM remains the single source of truth for user management.
- Migrated catalog `products.shopId` to store IAM user IDs (UUID string) and removed the FK to `catalog.users`.
- Catalog seed products now read `CATALOG_SEED_SELLER_ID` to set the IAM seller ID (default placeholder UUID).
- Migrated demo seller data to IAM user `seller_test` (password `seller123456`), updated catalog/ordering/fulfillment references, and removed the `demo-seller` IAM account.
- Migrated the frontend from Create React App/react-scripts to Vite with `src/main.jsx`, root `src/App.jsx`, Vite HTML entry, and Docker output served from `dist/`.
- Added Vite build args and runtime env naming with `VITE_AUTH_URL`, `VITE_CATALOG_URL`, `VITE_ORDERING_URL`, `VITE_FULFILLMENT_URL`, `VITE_NOTIFICATION_URL`, and `VITE_REVIEW_URL`.
- Added a frontend `.dockerignore` so Docker builds do not send local `node_modules`, `dist`, or old `build` output as context.
- Added route-level `src/pages` wrappers for auth, customer catalog/order/notification pages, plus new cart and checkout pages backed by the existing shared cart provider.
- Split the former monolithic landing page into `HeroSection`, `CategorySection`, `FeaturedProducts`, and `CustomerFooter` under `src/components/customer`, with `pages/customer/Home.jsx` as the route wrapper.
- Added `postcss.config.cjs` for Tailwind processing under Vite and rewrote `ChatWidget` to use scoped CSS classes instead of relying on utility classes for its core sizing/layout. This fixes the oversized raw SVG/chat popup render.
- Added seller-owned Catalog product APIs under `/api/v1/products/seller`: list, create, and update. Create uses `x-seller-id` as `shopId`; update rejects products whose `shopId` does not match the seller header.
- Wired seller product management in the frontend: `/seller/products`, `/seller/products/new`, and `/seller/products/:productId/edit` now call Catalog Service instead of showing placeholders.
- Split post-login routing by role: `ADMIN` sessions land on `/admin`, `SELLER` sessions land on `/seller`, and `/` redirects authenticated admin/seller sessions back to their dashboard instead of rendering the customer landing page.
- Fully separated seller dashboard pages from the customer `PageShell`: seller orders, profile, and notifications now render under `/seller/...` inside `DashboardLayout`; `/profile` and `/notifications` redirect sellers to `/seller/profile` and `/seller/notifications`.
- Removed seller-specific quick links from the customer shell so seller navigation is no longer mixed into landing/catalog quick-link panels.
- Added `src/layouts/CustomerLayout.jsx` and `src/layouts/DashboardLayout.jsx`; seller and admin dashboards now have role-based route groups under `/seller` and `/admin`.
- Added frontend service modules for auth, catalog, cart, order, notification, and review APIs, plus Zustand stores for auth, cart, and notifications.
- Added `ToastProvider`, `NotificationBell`, and a `ProtectedRoute.jsx` compatibility guard while preserving the existing `RequireAuth`, `RequireRole`, and `GuestOnly` guards.
- Kept old customer URLs such as `/product-list` and `/product-detail/:slug` working while adding the cleaner `/products` and `/products/:slug` aliases.
- Unified customer catalog browsing into the `/products` page. The page now combines search, price range, brand/location filters, and a category filter; legacy `/catalogs/:catalogId` redirects into `/products?catalogId=:catalogId`.

## Verification

- `docker compose build iam-service frontend ordering-service notification-service` succeeds on 2026-05-31.
- `docker compose build frontend` succeeds after the shared layout update.
- `docker compose build frontend` succeeds after the design-system update.
- `docker compose build frontend` succeeds after the PageShell polish.
- `docker compose build frontend` succeeds after the unified cart update.
- `docker compose build frontend` succeeds after the landing page API refactor.
- `docker compose build frontend` succeeds after the customer order flow polish.
- `docker compose build frontend` succeeds after the seller fulfillment dashboard polish.
- `docker compose build frontend` succeeds after the layout consistency polish.
- `docker compose build frontend` succeeds after role-based UI visibility and route guard implementation.
- `docker compose build frontend` succeeds after the Vietnamese text cleanup.
- The build still reports the existing catalog hook dependency warnings in `CatalogProductList.js`, `ProductDetail.js`, and `ProductList.js`.
- After restarting only the frontend container, gateway smoke checks returned `200` for `/`, `/product-list`, `/product-detail/id=1`, `/catalogs/1`, `/orders`, `/seller/orders`, `/notifications`, and `/fulfillment-tracking/test-order`.
- After the layout consistency polish, gateway smoke checks returned `200` for `/`, `/product-list`, `/product-detail/id=1`, `/catalogs/1`, `/orders`, `/seller/orders`, `/notifications`, and `/profile`.
- Gateway smoke tests verified `SELLER` and `CUSTOMER` registration, login, `/me` role return, and authenticated order listing.
- Gateway route smoke checks returned `200` for `/`, `/product-list`, `/orders`, `/seller/orders`, and `/notifications`.
- `docker compose build review-service` succeeds after wiring the review service into Docker.
- `docker compose up -d --force-recreate review-service api-gateway` starts the review service and refreshes gateway routing.
- Gateway review API smoke checks returned `200` for `/api/reviews/health`, `/api/reviews?productId=1`, and `/api/reviews/eligibility?customerId=test&orderId=test&productId=1`.
- Review eligibility smoke flow succeeded through the gateway: create cart, add product `1`, checkout COD, complete seller fulfillment, then `GET /api/reviews/eligibility` returned an eligibility record with `isEligible: true`.
- Review submission smoke check succeeded through the gateway: `POST /api/reviews` created review `dd818bcf-f2a6-40f4-ad0c-303aaa6c5ffc`, and `GET /api/reviews?productId=1` returned the new rating.
- `docker compose build frontend` succeeds after adding the frontend review UI. The same three catalog hook dependency warnings remain.
- After recreating only the frontend container, gateway route smoke checks returned `200` for `/`, `/product-list`, `/product-detail/id=1`, and `/orders/c47d790d-cd11-4560-aef2-c9ac69eaf92f`.
- `docker compose build catalog-service` succeeds after adding the `review.created` projection.
- Catalog projection smoke check succeeded: after review `537390b1-4a0f-4880-9922-d63da5dc5bcc`, product `1` changed from `totalRates=0`, `totalComments=0`, `StarCount=0`, `ranking=0` to `totalRates=1`, `totalComments=1`, `StarCount=4`, `ranking=4`.
- `docker compose build ordering-service fulfillment-service catalog-service` succeeds after the cancel end-to-end changes.
- Cancel end-to-end smoke check succeeded: order `57d0e831-e6e8-467e-b9e7-6002d5d1758d` moved to `CANCELLED`, product `1` quantity restored from `12` to `13`, fulfillment moved from `PENDING` to `CANCELLED`, and notifications included `order.cancelled`.
- Cart update/delete smoke check succeeded: cart item quantity changed from `1` to `3`, then delete returned `totalQuantity=0` and no items.
- `docker compose build frontend` succeeds after adding cart quantity/remove controls. The same three catalog hook dependency warnings remain.
- `docker compose build ordering-service` succeeds after adding Catalog checkout validation.
- Checkout validation smoke check succeeded: quantity `1` created order `48e87404-32e8-4df7-a7c0-384cef8a9e73` with status `PLACED`; quantity `999` was rejected with HTTP `409`.
- `docker compose up -d adminer` starts Adminer, and `http://localhost:8081` returns `200`.
- `npm run build` in `frontend` succeeds after the Vite migration and frontend route/service/store restructure. Vite reports a non-blocking chunk-size warning for the main bundle.
- `docker compose build frontend` succeeds after the Vite Dockerfile and compose build-arg migration.
- `npm run build` in `frontend` succeeds after the chat widget scoped-CSS fix.
- `npm run build` in `frontend` succeeds after wiring seller product management routes.
- `docker compose build catalog-service` succeeds after adding seller product APIs.
- Seller product API smoke checks through the gateway succeeded: create product `3`, update price to `125000` and quantity to `9`, list by seller includes the product, and update with a mismatched `x-seller-id` returns `403`.
- `docker compose build frontend` and `docker compose up -d --force-recreate frontend` succeed after adding seller product UI routes.
- `npm run build` in `frontend` succeeds after role-specific login/root redirects.
- `npm run build` in `frontend` succeeds after separating seller profile/notification/orders pages from the customer shell.
- `npm run build` in `frontend` succeeds after the UTF-8 Vietnamese text/font cleanup. Vite still reports the existing non-blocking main bundle chunk-size warning.
- `npm run build` in `frontend` succeeds after merging catalog and product listing into the unified products page.

## Planned Remaining Work

Planned on 2026-05-31:

1. Review service Docker/gateway wiring. Status: implemented and API-smoke-tested.
   - Add `review-service` to compose and gateway.
   - Verify review health and APIs through gateway.
   - Frontend testability: not yet, API/manual only.

2. Review eligibility from completed orders. Status: implemented and API-smoke-tested end to end.
   - Verify `OrderCompleted` reaches Review and creates eligibility rows.
   - Frontend testability: current checkout/seller flow can produce the event; eligibility still checked by API.

3. Product review UI. Status: implemented and build/API-smoke-tested.
   - Add review list/submission for eligible completed orders.
   - Frontend testability: yes, via product detail/order detail after completing an order.

4. Catalog review projection. Status: implemented and API-smoke-tested.
   - Consume `review.created` and update rating/comment/ranking fields.
   - Frontend testability: yes, product detail/list should reflect review stats after refresh.

5. Cancel order end-to-end. Status: implemented and API-smoke-tested end to end.
   - Catalog restores stock from `order.cancelled`.
   - Fulfillment cancels pending/confirmed fulfillments from `order.cancelled`.
   - Notification cancel event is verified.
   - Frontend testability: yes, via order detail cancel and notifications.

6. Cart quantity and remove controls. Status: implemented and build/API-smoke-tested.
   - Wire existing Ordering cart update/delete APIs into shared cart drawer.
   - Frontend testability: yes, via all product/catalog pages.

7. Checkout availability and price validation. Status: implemented and API-smoke-tested.
   - Validate stock and current price before checkout.
   - Frontend testability: normal path yes; edge cases may need API/database setup.

8. Seller product management. Status: create/update implemented and API/frontend-build-smoke-tested.
   - Add seller product create/update with ownership checks.
   - Delete remains a later extension.
   - Frontend testability: yes, with SELLER account.

9. Server-side search/filter/sort.
   - Add Catalog query params and update product list/catalog pages to use them.
   - Frontend testability: yes.

10. Chat through gateway and notifications.
    - Route chat HTTP/websocket through gateway and emit/consume `MessageSent`.
    - Frontend testability: yes if demo chat users exist.

11. Payment beyond COD.
    - Add mock CARD/WALLET or real payment state model and events.
    - Frontend testability: yes after checkout method selection exists.
